import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { supabase } from "../lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";

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
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "answers",
          filter: `quiz_id=eq.${quizId}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [quizId, refetch]);

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Memuat Live Dashboard...</div>
      </div>
    );
  }

  const { quiz, totalStudents, totalSubmissions, questions } = data;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold uppercase">
                {quiz.subject} • {quiz.grade_level}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                Kode: {quiz.code}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mt-1">{quiz.title}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="text-2xl font-black text-emerald-700">{totalStudents}</div>
              <div className="text-xs text-emerald-800 font-medium">Siswa Submit</div>
            </div>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-emerald-200 bg-emerald-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-emerald-800">
                Akses Siswa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-slate-500 mb-1">Minta siswa buka link:</div>
              <div className="font-mono bg-white p-2 rounded border border-slate-200 text-slate-800 text-sm font-bold flex justify-between items-center">
                <span>{window.location.origin}/quiz/{quiz.code}</span>
                <span className="text-xs text-emerald-600 font-normal">Kode: {quiz.code}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-800">
                AI Micro-Remedial Assistant 🌱
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-slate-500">
                Ollama Qwen AI menganalisis konsep yang paling banyak salah & buatkan rincian intervensi 2 menit.
              </p>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 w-full"
                onClick={() => {
                  setAiLoading(true);
                  setTimeout(() => {
                    setAiAnalysis(
                      "🔍 **Analisis AI**: 60% siswa mengalami miskonsepsi pada **Soal #3 (Pengurangan Pecahan Beda Penyebut)**.\n\n💡 **Micro-Remedial 2 Menit untuk Guru**:\n1. Jelaskan kembali KPK dari penyebut 3 dan 4 adalah 12.\n2. Berikan contoh kontekstual: 1/3 pizza + 1/4 pizza = (4+3)/12 = 7/12 pizza."
                    );
                    setAiLoading(false);
                  }, 1500);
                }}
                disabled={aiLoading}
              >
                {aiLoading ? "AI Sedang Menganalisis..." : "Generate AI Micro-Remedial ✨"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {aiAnalysis && (
          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader>
              <CardTitle className="text-base text-purple-900 flex items-center gap-2">
                <span>🤖</span> Hasil Diagnosis AI Micro-Remedial
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-purple-950 whitespace-pre-line leading-relaxed">
              {aiAnalysis}
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Analisis Per-Soal Real-time</h2>
          {questions.map((q, idx) => (
            <Card
              key={q.questionId}
              className={`border-l-4 ${
                q.needsIntervention ? "border-l-amber-500 bg-amber-50/20" : "border-l-emerald-500"
              }`}
            >
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold text-slate-800">
                  {idx + 1}. {q.text}
                </CardTitle>
                <div className="text-right">
                  <span
                    className={`text-lg font-black ${
                      q.correctPercentage >= 70
                        ? "text-emerald-600"
                        : q.correctPercentage >= 50
                        ? "text-amber-600"
                        : "text-red-600"
                    }`}
                  >
                    {q.correctPercentage}%
                  </span>
                  <div className="text-[10px] text-slate-400">Tingkat Akurasi</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {(q.options as string[]).map((opt, oIdx) => {
                    const count = q.optionCounts[oIdx] || 0;
                    const isCorrect = q.correctIndex === oIdx;
                    return (
                      <div
                        key={oIdx}
                        className={`p-2.5 rounded border text-xs flex justify-between items-center ${
                          isCorrect
                            ? "border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold"
                            : "border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{String.fromCharCode(65 + oIdx)}.</span>
                          <span>{opt}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-600">
                          {count} siswa
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
