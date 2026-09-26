import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { supabase } from "../lib/supabase";
import { DashboardLayout } from "../components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const MonitorQuizPage: React.FC = () => {
  const { id: quizId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const { data, isLoading, refetch } = trpc.quiz.getProgress.useQuery(
    { quizId: quizId || "" },
    { enabled: !!quizId, refetchInterval: 3000 }
  );

  useEffect(() => {
    if (!quizId) return;
    const channel = supabase
      .channel(`realtime-answers-${quizId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "answers", filter: `quiz_id=eq.${quizId}` }, () => { refetch(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [quizId, refetch]);

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { quiz, totalStudents, totalSubmissions, questions } = data;

  const accuracyColor = (pct: number) => {
    if (pct >= 70) return "#15803d";
    if (pct >= 50) return "#a16207";
    return "#b91c1c";
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">{quiz.subject} · {quiz.grade_level}</Badge>
                  <span className="text-xs font-mono bg-neutral-100 px-2 py-0.5 border border-neutral-200 rounded">Kode: {quiz.code}</span>
                </div>
                <h2 className="text-xl font-bold text-neutral-900 mt-1">{quiz.title}</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center px-4 py-1.5 bg-blue-50 border border-blue-100 rounded">
                  <p className="text-xl font-black text-blue-600">{totalStudents}</p>
                  <p className="text-xs font-semibold text-blue-500">Siswa Submit</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>Dashboard</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          {/* Student Access */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-4 flex flex-col gap-2">
              <h4 className="text-sm font-semibold text-green-800">Akses Siswa</h4>
              <p className="text-xs text-neutral-500">Minta siswa buka link:</p>
              <div className="flex justify-between items-center font-mono bg-white p-2 border border-neutral-200 rounded">
                <span className="text-sm font-bold text-neutral-900">{window.location.origin}/quiz/{quiz.code}</span>
                <span className="text-xs text-green-600">Kode: {quiz.code}</span>
              </div>
            </CardContent>
          </Card>

          {/* AI Remedial */}
          <Card>
            <CardContent className="pt-4 flex flex-col gap-2">
              <h4 className="text-sm font-semibold text-neutral-700">AI Micro-Remedial Assistant</h4>
              <p className="text-xs text-neutral-500">Menganalisis konsep yang paling banyak salah & buatkan rincian intervensi 2 menit.</p>
              <Button
                size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  setAiLoading(true);
                  setTimeout(() => {
                    setAiAnalysis("**Analisis AI**: 60% siswa mengalami miskonsepsi pada **Soal #3 (Pengurangan Pecahan Beda Penyebut)**.\n\n**Micro-Remedial 2 Menit untuk Guru**:\n1. Jelaskan kembali KPK dari penyebut 3 dan 4 adalah 12.\n2. Berikan contoh kontekstual: 1/3 pizza + 1/4 pizza = (4+3)/12 = 7/12 pizza.");
                    setAiLoading(false);
                  }, 1500);
                }}
                disabled={aiLoading}
              >
                {aiLoading ? "AI Sedang Menganalisis..." : "Generate AI Micro-Remedial"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* AI Analysis Result */}
        {aiAnalysis && (
          <Card className="border border-blue-200 bg-blue-50">
            <CardContent className="pt-4 flex flex-col gap-2">
              <h3 className="text-base font-semibold text-blue-700">Hasil Diagnosis AI Micro-Remedial</h3>
              <p className="text-sm text-neutral-700 whitespace-pre-line leading-relaxed">{aiAnalysis}</p>
            </CardContent>
          </Card>
        )}

        {/* Per-Question Analysis */}
        <div className="flex flex-col gap-4">
          <h3 className="text-base font-semibold text-neutral-900">Analisis Per-Soal Real-time</h3>
          {questions.map((q, idx) => (
            <Card
              key={q.questionId}
              className={q.needsIntervention ? "bg-yellow-50 border-yellow-300" : "bg-white"}
              style={{ borderLeft: `4px solid ${q.needsIntervention ? "#eab308" : "#22c55e"}` }}
            >
              <CardContent className="pt-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-base font-semibold text-neutral-900">{idx + 1}. {q.text}</p>
                  <div className="text-right">
                    <p className="text-lg font-black" style={{ color: accuracyColor(q.correctPercentage) }}>{q.correctPercentage}%</p>
                    <p className="text-xs font-semibold text-neutral-400">Tingkat Akurasi</p>
                  </div>
                </div>
                <Progress value={q.correctPercentage} className="h-1.5" />
                <div className="grid grid-cols-2 gap-2">
                  {(q.options as string[]).map((opt, oIdx) => {
                    const count = q.optionCounts[oIdx] || 0;
                    const isCorrect = q.correctIndex === oIdx;
                    return (
                      <div
                        key={oIdx}
                        className={`flex justify-between items-center p-2.5 border rounded ${isCorrect ? "border-green-500 bg-green-50" : "border-neutral-200 bg-white"}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${isCorrect ? "text-green-700" : "text-neutral-500"}`}>{String.fromCharCode(65 + oIdx)}.</span>
                          <span className={`text-xs ${isCorrect ? "text-neutral-900" : "text-neutral-600"}`}>{opt}</span>
                        </div>
                        <span className="text-xs font-mono bg-neutral-100 px-2 py-0.5 rounded">{count} siswa</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};
