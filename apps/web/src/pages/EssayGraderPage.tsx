import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { useAuth } from "../context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";

export const EssayGraderPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [question, setQuestion] = useState("");
  const [rubricOrKey, setRubricOrKey] = useState("");
  const [studentAnswer, setStudentAnswer] = useState("");
  const [studentName, setStudentName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: gradebookData } = trpc.gradebook.listByTeacher.useQuery(
    { teacherId: user?.id || "" },
    { enabled: !!user }
  );

  const [evaluation, setEvaluation] = useState<{
    score: number;
    maxScore: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
    suggestedCorrection: string;
  } | null>(null);

  const evaluateMutation = trpc.essay.evaluate.useMutation();

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!question || !rubricOrKey || !studentAnswer) {
      setError("Silakan lengkapi semua kolom (Soal, Kunci/Rubrik, Jawaban Siswa)");
      return;
    }

    try {
      const res = await evaluateMutation.mutateAsync({
        question,
        rubricOrKey,
        studentAnswer,
        studentName: studentName || undefined,
        teacherId: user?.id || undefined,
      });
      setEvaluation(res);
    } catch (err: any) {
      setError(err.message || "Gagal mengevaluasi jawaban esai");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Koreksi Esai & Teks Otomatis</h1>
            <p className="text-slate-500 text-sm">Semai 🌱 — Penilaian Jawaban Esai Berbasis AI</p>
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

        <Card className="border-emerald-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-emerald-900 flex items-center gap-2">
              <span>✍️</span> Form Input Penilaian Esai
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEvaluate} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="sName">Nama Siswa (Opsional - Integrasi ke Gradebook)</Label>
                <Input
                  id="sName"
                  placeholder="Contoh: Ahmad Rizky (Isi agar nilai otomatis tercatat ke Gradebook)"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  list="students-datalist-essay"
                />
                <datalist id="students-datalist-essay">
                  {(gradebookData?.students || []).map((s) => (
                    <option key={s.studentName} value={s.studentName} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-1">
                <Label htmlFor="question">Pertanyaan / Soal Esai</Label>
                <Input
                  id="question"
                  placeholder="Contoh: Jelaskan dampak fotosintesis terhadap siklus oksigen di bumi!"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="rubric">Kunci Jawaban / Kriteria Rubrik Penilaian</Label>
                <textarea
                  id="rubric"
                  rows={3}
                  className="w-full p-2.5 text-sm border rounded-md border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Contoh: Poin penting: (1) Menghasilkan O2 dari H2O dan CO2, (2) Mendukung respirasi makhluk hidup, (3) Menjaga kestabilan atmosfer."
                  value={rubricOrKey}
                  onChange={(e) => setRubricOrKey(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="studentAnswer">Jawaban Teks Siswa</Label>
                <textarea
                  id="studentAnswer"
                  rows={4}
                  className="w-full p-2.5 text-sm border rounded-md border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  placeholder="Ketik atau tempel teks jawaban siswa di sini..."
                  value={studentAnswer}
                  onChange={(e) => setStudentAnswer(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 font-semibold"
                disabled={evaluateMutation.isPending}
              >
                {evaluateMutation.isPending ? "AI Sedang Mengoreksi..." : "Koreksi Jawaban Otomatis 🚀"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {evaluation && (
          <Card className="border-emerald-300 bg-emerald-50/20">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4">
              <div>
                <CardTitle className="text-xl font-bold text-slate-800">
                  Hasil Penilaian AI
                </CardTitle>
                <div className="text-xs text-slate-500 mt-1">Ulasan otomatis berdasarkan rubrik</div>
              </div>
              <div className="bg-white px-6 py-2 rounded-xl border border-emerald-200 text-center shadow-sm">
                <div className="text-xs text-emerald-700 uppercase font-semibold">Skor Akhir</div>
                <div className="text-3xl font-black text-emerald-800">
                  {evaluation.score} <span className="text-sm font-medium text-slate-400">/ {evaluation.maxScore}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wide mb-1">
                  Catatan & Ulasan Guru (Feedback)
                </h3>
                <p className="text-slate-800 text-sm bg-white p-3 rounded border border-slate-200 leading-relaxed">
                  {evaluation.feedback}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wide mb-2">
                    ✅ Kelebihan Jawaban
                  </h3>
                  <ul className="space-y-1">
                    {evaluation.strengths.map((st, i) => (
                      <li key={i} className="bg-white p-2.5 rounded border border-emerald-200 text-xs text-emerald-950 font-medium flex items-center gap-2">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>{st}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wide mb-2">
                    💡 Area Yang Perlu Ditingkatkan
                  </h3>
                  <ul className="space-y-1">
                    {evaluation.improvements.map((imp, i) => (
                      <li key={i} className="bg-white p-2.5 rounded border border-amber-200 text-xs text-amber-950 font-medium flex items-center gap-2">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-purple-800 uppercase tracking-wide mb-1">
                  ✏️ Rekomendasi Perbaikan Jawaban Ideal
                </h3>
                <div className="text-purple-950 text-sm bg-white p-3 rounded border border-purple-200 whitespace-pre-line leading-relaxed font-sans">
                  {evaluation.suggestedCorrection}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
