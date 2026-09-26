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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Buat Kuis Formatif Baru</h1>
            <p className="text-slate-500 text-sm">Semai 🌱 — Kuis 5 Soal Cepat Instan</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Kembali ke Dashboard
          </Button>
        </div>

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
