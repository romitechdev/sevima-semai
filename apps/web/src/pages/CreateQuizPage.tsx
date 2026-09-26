import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { useAuth } from "../context/AuthContext";
import { DashboardLayout } from "../components/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";

function emptyQuestion() {
  return { text: "", options: ["", "", "", ""] as [string, string, string, string], correctIndex: 0 };
}

export const CreateQuizPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiNumQuestions, setAiNumQuestions] = useState(5);
  const [showAiModal, setShowAiModal] = useState(false);

  const [questions, setQuestions] = useState([emptyQuestion()]);

  useEffect(() => {
    const state = location.state as { initialPrompt?: string } | null;
    if (state?.initialPrompt) {
      setAiPrompt(state.initialPrompt);
      setShowAiModal(true);
    }
  }, [location.state]);

  const createMutation = trpc.quiz.create.useMutation();
  const generateAiMutation = trpc.quiz.generateWithAI.useMutation();

  const handleGenerateAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt || aiPrompt.trim().length < 5) {
      setError("Masukkan materi atau topik minimal 5 karakter.");
      return;
    }

    setError(null);
    try {
      const generated = await generateAiMutation.mutateAsync({
        prompt: aiPrompt,
        numQuestions: aiNumQuestions,
      });
      if (generated.title) setTitle(generated.title);
      if (generated.subject) setSubject(generated.subject);
      if (generated.gradeLevel) setGradeLevel(generated.gradeLevel);
      if (generated.questions && generated.questions.length > 0) {
        setQuestions(generated.questions);
      }
      setShowAiModal(false);
      setAiPrompt("");
    } catch (err: any) {
      setError(err.message || "Gagal membuat kuis otomatis.");
    }
  };

  const addQuestion = () => {
    if (questions.length >= 50) return;
    setQuestions([...questions, emptyQuestion()]);
  };

  const removeQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestionText = (index: number, text: string) => {
    const updated = [...questions];
    updated[index].text = text;
    setQuestions(updated);
  };

  const updateOptionText = (qIndex: number, oIndex: number, text: string) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = text;
    setQuestions(updated);
  };

  const updateCorrectIndex = (qIndex: number, correctIndex: number) => {
    const updated = [...questions];
    updated[qIndex].correctIndex = correctIndex;
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("Silakan login terlebih dahulu.");
      return;
    }

    if (questions.length < 1) {
      setError("Kuis harus memiliki minimal 1 soal.");
      return;
    }

    try {
      const res = await createMutation.mutateAsync({
        teacherId: user.id,
        title,
        subject,
        gradeLevel,
        questions,
      });

      navigate(`/monitor/${res.quiz.id}`);
    } catch (err: any) {
      setError(err.message || "Gagal membuat kuis.");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Buat Kuis Formatif</h1>
            <p className="text-slate-500 text-xs">Jumlah soal fleksibel (1-50). Bisa diisi manual atau digenerate AI.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded transition-colors"
              onClick={() => setShowAiModal(true)}
            >
              Auto-Generate AI
            </button>
            <button
              type="button"
              className="px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-xs rounded transition-colors"
              onClick={() => navigate("/dashboard")}
            >
              Batal
            </button>
          </div>
        </div>

        {showAiModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-lg bg-white rounded-lg border border-slate-200 p-6 shadow-lg space-y-4">
              <h2 className="text-base font-bold text-slate-900">
                Generate Soal Otomatis dengan AI
              </h2>
              <p className="text-xs text-slate-500">
                Masukkan materi pelajaran atau topik, lalu tentukan jumlah soal yang diinginkan (1-20).
              </p>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="aiPromptInput">Materi / Topik</Label>
                  <textarea
                    id="aiPromptInput"
                    rows={3}
                    className="w-full mt-1 p-2.5 text-xs border rounded border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    placeholder="Contoh: Daur air dan evaporasi untuk kelas 5 SD"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="aiNumInput">Jumlah Soal</Label>
                  <Input
                    id="aiNumInput"
                    type="number"
                    min={1}
                    max={20}
                    value={aiNumQuestions}
                    onChange={(e) => setAiNumQuestions(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-xs rounded transition-colors"
                  onClick={() => setShowAiModal(false)}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded transition-colors"
                  onClick={handleGenerateAI}
                  disabled={generateAiMutation.isPending}
                >
                  {generateAiMutation.isPending
                    ? `Membuat ${aiNumQuestions} soal...`
                    : `Generate ${aiNumQuestions} Soal`}
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-800">Informasi Kuis</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="title">Judul Kuis / Topik</Label>
                <Input id="title" placeholder="Misal: Pecahan & Desimal" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="subject">Mata Pelajaran</Label>
                <Input id="subject" placeholder="Misal: Matematika" value={subject} onChange={(e) => setSubject(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="gradeLevel">Kelas / Tingkat</Label>
                <Input id="gradeLevel" placeholder="Misal: Kelas 5 SD" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} required />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-slate-800">
              Daftar Soal ({questions.length})
            </div>
            <button
              type="button"
              onClick={addQuestion}
              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded transition-colors"
            >
              + Tambah Soal
            </button>
          </div>

          {questions.map((q, qIdx) => (
            <Card key={qIdx} className="border-l-2 border-l-emerald-700">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm text-slate-700">Soal #{qIdx + 1}</CardTitle>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIdx)}
                    className="text-red-500 hover:text-red-700 text-xs font-medium"
                  >
                    Hapus
                  </button>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor={`q-${qIdx}`}>Pertanyaan</Label>
                  <Input
                    id={`q-${qIdx}`}
                    placeholder={`Tulis pertanyaan soal nomor ${qIdx + 1}`}
                    value={q.text}
                    onChange={(e) => updateQuestionText(qIdx, e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                  {q.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      className={`p-2 rounded border flex items-center gap-2 ${
                        q.correctIndex === oIdx ? "border-emerald-600 bg-emerald-50/40" : "border-slate-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`correct-${qIdx}`}
                        id={`q-${qIdx}-opt-${oIdx}`}
                        checked={q.correctIndex === oIdx}
                        onChange={() => updateCorrectIndex(qIdx, oIdx)}
                        className="accent-emerald-700 cursor-pointer"
                      />
                      <label htmlFor={`q-${qIdx}-opt-${oIdx}`} className="text-xs font-semibold text-slate-500 w-5">
                        {String.fromCharCode(65 + oIdx)}.
                      </label>
                      <Input
                        placeholder={`Pilihan ${String.fromCharCode(65 + oIdx)}`}
                        value={opt}
                        onChange={(e) => updateOptionText(qIdx, oIdx, e.target.value)}
                        required
                        className="h-8 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            type="submit"
            className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 font-bold rounded text-sm"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Menyimpan Kuis..." : `Simpan Kuis (${questions.length} Soal) & Buka Monitor`}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
};
