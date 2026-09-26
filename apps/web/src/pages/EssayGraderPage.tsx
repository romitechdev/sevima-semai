import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { useAuth } from "../context/AuthContext";
import { DashboardLayout } from "../components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

export const EssayGraderPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [question, setQuestion] = useState("");
  const [rubricOrKey, setRubricOrKey] = useState("");
  const [studentAnswer, setStudentAnswer] = useState("");
  const [studentName, setStudentName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [evaluation, setEvaluation] = useState<{
    score: number; maxScore: number; feedback: string;
    strengths: string[]; improvements: string[]; suggestedCorrection: string;
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
        question, rubricOrKey, studentAnswer,
        studentName: studentName || undefined,
        teacherId: user?.id || undefined,
      });
      setEvaluation(res);
    } catch (err: any) {
      setError(err.message || "Gagal mengevaluasi jawaban esai");
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
                <h2 className="text-xl font-bold text-neutral-900">Koreksi Esai & Teks Otomatis</h2>
                <p className="text-xs text-neutral-500">Semai · Penilaian Jawaban Esai Berbasis AI</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>Batal</Button>
            </div>
          </CardContent>
        </Card>

        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        {/* Form */}
        <Card>
          <CardContent className="pt-5 flex flex-col gap-4">
            <h3 className="text-base font-semibold text-neutral-900">Form Input Penilaian Esai</h3>
            <form onSubmit={handleEvaluate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <Label>Nama Siswa (Opsional - Integrasi ke Gradebook)</Label>
                <Input placeholder="Contoh: Ahmad Rizky" value={studentName} onChange={(e) => setStudentName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Pertanyaan / Soal Esai</Label>
                <Input placeholder="Contoh: Jelaskan dampak fotosintesis terhadap siklus oksigen di bumi!" value={question} onChange={(e) => setQuestion(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Kunci Jawaban / Kriteria Rubrik Penilaian</Label>
                <Textarea rows={3} placeholder="Contoh: Poin penting: (1) Menghasilkan O2 dari H2O dan CO2, (2) Mendukung respirasi makhluk hidup, (3) Menjaga kestabilan atmosfer." value={rubricOrKey} onChange={(e) => setRubricOrKey(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Jawaban Teks Siswa</Label>
                <Textarea rows={4} className="font-mono" placeholder="Ketik atau tempel teks jawaban siswa di sini..." value={studentAnswer} onChange={(e) => setStudentAnswer(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={evaluateMutation.isPending}>
                {evaluateMutation.isPending ? "AI Sedang Mengoreksi..." : "Koreksi Jawaban Otomatis"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Result */}
        {evaluation && (
          <Card>
            <CardContent className="pt-5 flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b pb-4">
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">Hasil Penilaian AI</h3>
                  <p className="text-xs text-neutral-500 mt-1">Ulasan otomatis berdasarkan rubrik</p>
                </div>
                <div className="bg-white px-6 py-2 border border-neutral-200 rounded text-center">
                  <p className="text-xs font-semibold text-blue-600 uppercase">Skor Akhir</p>
                  <p className="text-2xl font-black text-neutral-900">
                    {evaluation.score} <span className="text-sm text-neutral-400 font-medium">/ {evaluation.maxScore}</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold text-neutral-500 uppercase">Catatan & Ulasan Guru (Feedback)</p>
                <div className="bg-white p-3 border border-neutral-200 rounded">
                  <p className="text-sm text-neutral-700 leading-relaxed">{evaluation.feedback}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-green-700 uppercase">Kelebihan Jawaban</p>
                  <div className="flex flex-col gap-1">
                    {evaluation.strengths.map((st, i) => (
                      <div key={i} className="flex items-start gap-2 p-2.5 bg-white border border-neutral-200 rounded">
                        <span className="text-xs text-green-600 font-bold">✓</span>
                        <span className="text-xs text-neutral-700 font-medium">{st}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-amber-700 uppercase">Area Yang Perlu Ditingkatkan</p>
                  <div className="flex flex-col gap-1">
                    {evaluation.improvements.map((imp, i) => (
                      <div key={i} className="flex items-start gap-2 p-2.5 bg-white border border-neutral-200 rounded">
                        <span className="text-xs text-amber-600 font-bold">•</span>
                        <span className="text-xs text-neutral-700 font-medium">{imp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold text-blue-600 uppercase">Rekomendasi Perbaikan Jawaban Ideal</p>
                <div className="bg-white p-3 border border-neutral-200 rounded whitespace-pre-line">
                  <p className="text-sm text-neutral-700 leading-relaxed">{evaluation.suggestedCorrection}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};
