import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { useAuth } from "../context/AuthContext";
import { DashboardLayout } from "../components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

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
    if (!aiPrompt || aiPrompt.trim().length < 5) { setError("Masukkan materi atau topik minimal 5 karakter."); return; }
    setError(null);
    try {
      const generated = await generateAiMutation.mutateAsync({ prompt: aiPrompt, numQuestions: aiNumQuestions });
      if (generated.title) setTitle(generated.title);
      if (generated.subject) setSubject(generated.subject);
      if (generated.gradeLevel) setGradeLevel(generated.gradeLevel);
      if (generated.questions && generated.questions.length > 0) setQuestions(generated.questions);
      setShowAiModal(false);
      setAiPrompt("");
    } catch (err: any) {
      setError(err.message || "Gagal membuat kuis otomatis.");
    }
  };

  const addQuestion = () => { if (questions.length >= 50) return; setQuestions([...questions, emptyQuestion()]); };
  const removeQuestion = (idx: number) => { if (questions.length <= 1) return; setQuestions(questions.filter((_, i) => i !== idx)); };
  const updateQuestionText = (index: number, text: string) => { const u = [...questions]; u[index].text = text; setQuestions(u); };
  const updateOptionText = (qIdx: number, oIdx: number, text: string) => { const u = [...questions]; u[qIdx].options[oIdx] = text; setQuestions(u); };
  const updateCorrectIndex = (qIdx: number, ci: number) => { const u = [...questions]; u[qIdx].correctIndex = ci; setQuestions(u); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!user) { setError("Silakan login terlebih dahulu."); return; }
    if (questions.length < 1) { setError("Kuis harus memiliki minimal 1 soal."); return; }
    try {
      const res = await createMutation.mutateAsync({ teacherId: user.id, title, subject, gradeLevel, questions });
      navigate(`/monitor/${res.quiz.id}`);
    } catch (err: any) {
      setError(err.message || "Gagal membuat kuis.");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">Buat Kuis Formatif</h2>
                <p className="text-xs text-neutral-500">Jumlah soal fleksibel (1-50). Bisa diisi manual atau digenerate AI.</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowAiModal(true)}>
                  Auto-Generate AI
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate("/dashboard")}>Batal</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Modal */}
        <Dialog open={showAiModal} onOpenChange={setShowAiModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Generate Soal Otomatis dengan AI</DialogTitle>
              <p className="text-xs text-neutral-500">Masukkan materi pelajaran atau topik, lalu tentukan jumlah soal yang diinginkan (1-20).</p>
            </DialogHeader>
            <form onSubmit={handleGenerateAI} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <Label>Materi / Topik</Label>
                <Textarea rows={3} placeholder="Contoh: Daur air dan evaporasi untuk kelas 5 SD" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Jumlah Soal</Label>
                <Input type="number" min={1} max={20} value={aiNumQuestions} onChange={(e) => setAiNumQuestions(Number(e.target.value))} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAiModal(false)}>Batal</Button>
                <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={generateAiMutation.isPending}>
                  {generateAiMutation.isPending ? `Membuat ${aiNumQuestions} soal...` : `Generate ${aiNumQuestions} Soal`}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Quiz Info */}
          <Card>
            <CardContent className="pt-5 flex flex-col gap-4">
              <h4 className="text-sm font-semibold text-neutral-700">Informasi Kuis</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <Label>Judul Kuis / Topik</Label>
                  <Input placeholder="Misal: Pecahan & Desimal" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Mata Pelajaran</Label>
                  <Input placeholder="Misal: Matematika" value={subject} onChange={(e) => setSubject(e.target.value)} required />
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Kelas / Tingkat</Label>
                  <Input placeholder="Misal: Kelas 5 SD" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} required />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-neutral-700">Daftar Soal ({questions.length})</span>
            <Button type="button" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={addQuestion}>+ Tambah Soal</Button>
          </div>

          {/* Questions */}
          {questions.map((q, qIdx) => (
            <Card key={qIdx} style={{ borderLeft: "3px solid #2563eb" }}>
              <CardContent className="pt-4 flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-sm text-neutral-600">Soal #{qIdx + 1}</span>
                  {questions.length > 1 && (
                    <button type="button" className="text-xs text-red-500 hover:text-red-700" onClick={() => removeQuestion(qIdx)}>Hapus</button>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Pertanyaan</Label>
                  <Input placeholder={`Tulis pertanyaan soal nomor ${qIdx + 1}`} value={q.text} onChange={(e) => updateQuestionText(qIdx, e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {q.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      className={`flex items-center gap-2 p-2 border rounded cursor-pointer ${q.correctIndex === oIdx ? "border-blue-600 bg-blue-50" : "border-neutral-200 bg-white"}`}
                      onClick={() => updateCorrectIndex(qIdx, oIdx)}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${q.correctIndex === oIdx ? "border-blue-600 bg-blue-600" : "border-neutral-300"}`} />
                      <span className="text-xs font-semibold text-neutral-500">{String.fromCharCode(65 + oIdx)}.</span>
                      <Input
                        className="border-0 p-0 h-auto text-xs focus-visible:ring-0 bg-transparent"
                        placeholder={`Pilihan ${String.fromCharCode(65 + oIdx)}`}
                        value={opt}
                        onChange={(e) => { e.stopPropagation(); updateOptionText(qIdx, oIdx, e.target.value); }}
                        onClick={(e) => e.stopPropagation()}
                        required
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Menyimpan Kuis..." : `Simpan Kuis (${questions.length} Soal) & Buka Monitor`}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
};
