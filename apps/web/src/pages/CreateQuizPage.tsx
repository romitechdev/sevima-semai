import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { useAuth } from "../context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";

export const CreateQuizPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [aiPrompt, setAiPrompt] = useState("");
  const [showAiModal, setShowAiModal] = useState(false);

  const [questions, setQuestions] = useState<
    Array<{ text: string; options: [string, string, string, string]; correctIndex: number }>
  >([
    { text: "", options: ["", "", "", ""], correctIndex: 0 },
    { text: "", options: ["", "", "", ""], correctIndex: 0 },
    { text: "", options: ["", "", "", ""], correctIndex: 0 },
    { text: "", options: ["", "", "", ""], correctIndex: 0 },
    { text: "", options: ["", "", "", ""], correctIndex: 0 },
  ]);

  const createMutation = trpc.quiz.create.useMutation();
  const generateAiMutation = trpc.quiz.generateWithAI.useMutation();

  const handleGenerateAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt || aiPrompt.trim().length < 5) {
      setError("Masukkan materi atau topik minimal 5 karakter");
      return;
    }

    setError(null);
    try {
      const generated = await generateAiMutation.mutateAsync({ prompt: aiPrompt });
      if (generated.title) setTitle(generated.title);
      if (generated.subject) setSubject(generated.subject);
      if (generated.gradeLevel) setGradeLevel(generated.gradeLevel);
      if (generated.questions && generated.questions.length === 5) {
        setQuestions(generated.questions);
      }
      setShowAiModal(false);
      setAiPrompt("");
    } catch (err: any) {
      setError(err.message || "Gagal membuat kuis otomatis dengan AI");
    }
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
      setError(err.message || "Gagal membuat kuis");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Buat Kuis Formatif Baru</h1>
            <p className="text-slate-500 text-sm">Semai 🌱 — Kuis 5 Soal Cepat Instan</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold"
              onClick={() => setShowAiModal(true)}
            >
              ✨ Auto-Generate AI
            </Button>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Kembali
            </Button>
          </div>
        </div>

        {showAiModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-lg bg-white shadow-xl border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-purple-900">
                  <span>✨</span> Auto-Generate Kuis dengan AI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-slate-600">
                  Masukkan materi pelajaran, rangkuman bab, atau topik spesifik. OmniRoute Agent AI akan membuatkan 5 soal pilihan ganda lengkap dengan opsi & kunci jawaban secara otomatis.
                </p>
                <div>
                  <Label htmlFor="aiPrompt">Materi / Prompt Kuis</Label>
                  <textarea
                    id="aiPrompt"
                    rows={4}
                    className="w-full mt-1 p-2.5 text-sm border rounded-md border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Contoh: Daur air dan evaporasi untuk kelas 5 SD. Sertakan soal tentang kondensasi dan presipitasi."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" type="button" onClick={() => setShowAiModal(false)}>
                    Batal
                  </Button>
                  <Button
                    type="button"
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={handleGenerateAI}
                    disabled={generateAiMutation.isPending}
                  >
                    {generateAiMutation.isPending ? "AI Sedang Membuat Soal..." : "Generate Soal Sekarang 🚀"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Kuis</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="title">Judul Kuis / Topik</Label>
                <Input
                  id="title"
                  placeholder="Misal: Pecahan & Desimal"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="subject">Mata Pelajaran</Label>
                <Input
                  id="subject"
                  placeholder="Misal: Matematika"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="gradeLevel">Kelas / Tingkat</Label>
                <Input
                  id="gradeLevel"
                  placeholder="Misal: Kelas 5 SD"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {questions.map((q, qIdx) => (
            <Card key={qIdx} className="border-l-4 border-l-emerald-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-slate-700">Soal #{qIdx + 1}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor={`q-${qIdx}`}>Pertanyaan</Label>
                  <Input
                    id={`q-${qIdx}`}
                    placeholder={`Tulis pertanyaan soal nomor ${qIdx + 1}...`}
                    value={q.text}
                    onChange={(e) => updateQuestionText(qIdx, e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {q.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      className={`p-2 rounded-md border flex items-center gap-2 ${
                        q.correctIndex === oIdx ? "border-emerald-500 bg-emerald-50/50" : "border-slate-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`correct-${qIdx}`}
                        id={`q-${qIdx}-opt-${oIdx}`}
                        checked={q.correctIndex === oIdx}
                        onChange={() => updateCorrectIndex(qIdx, oIdx)}
                        className="accent-emerald-600 cursor-pointer"
                      />
                      <Label htmlFor={`q-${qIdx}-opt-${oIdx}`} className="text-xs font-semibold uppercase text-slate-500 w-6">
                        {String.fromCharCode(65 + oIdx)}.
                      </Label>
                      <Input
                        placeholder={`Pilihan ${String.fromCharCode(65 + oIdx)}`}
                        value={opt}
                        onChange={(e) => updateOptionText(qIdx, oIdx, e.target.value)}
                        required
                        className="h-8 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 font-semibold"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Menyimpan Kuis..." : "Simpan Kuis & Buka Live Monitor 🚀"}
          </Button>
        </form>
      </div>
    </div>
  );
};
