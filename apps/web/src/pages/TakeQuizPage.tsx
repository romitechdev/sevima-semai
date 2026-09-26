import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";

export const TakeQuizPage: React.FC = () => {
  const { code: urlCode } = useParams<{ code?: string }>();
  const navigate = useNavigate();

  const [inputCode, setInputCode] = useState(urlCode || "");
  const [studentName, setStudentName] = useState("");
  const [quizStarted, setQuizStarted] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submittedResult, setSubmittedResult] = useState<{
    score: number;
    correctCount: number;
    totalQuestions: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: quizData, isLoading: isFetchingQuiz, refetch } = trpc.quiz.getByCode.useQuery(
    { code: inputCode },
    { enabled: false }
  );

  const submitMutation = trpc.quiz.submitAnswers.useMutation();

  const handleStartQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!inputCode || !studentName) {
      setError("Silakan isi Kode Kuis dan Nama Kamu");
      return;
    }

    const res = await refetch();
    if (res.isError || !res.data) {
      setError("Kode kuis tidak ditemukan!");
      return;
    }

    setQuizStarted(true);
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmitQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizData) return;

    const answersArray = quizData.questions.map((q) => ({
      questionId: q.id,
      selectedIndex: selectedAnswers[q.id] ?? 0,
    }));

    try {
      const res = await submitMutation.mutateAsync({
        quizCode: inputCode,
        studentName,
        answers: answersArray,
      });

      setSubmittedResult({
        score: res.score,
        correctCount: res.correctCount,
        totalQuestions: res.totalQuestions,
      });
    } catch (err: any) {
      setError(err.message || "Gagal mengumpulkan jawaban");
    }
  };

  if (submittedResult) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-6 border-emerald-200">
          <CardHeader>
            <div className="text-5xl mb-2">🎉</div>
            <CardTitle className="text-2xl text-emerald-800">Jawaban Terkirim!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600">
              Terima kasih <span className="font-bold text-slate-800">{studentName}</span>. Jawabanmu sudah dicatat secara real-time oleh guru.
            </p>
            <div className="bg-emerald-100/70 p-4 rounded-xl border border-emerald-200 inline-block w-full">
              <div className="text-xs text-emerald-700 uppercase tracking-wide font-semibold mb-1">Skor Kamu</div>
              <div className="text-4xl font-black text-emerald-900">{submittedResult.score} / 100</div>
              <div className="text-sm text-emerald-700 mt-1">
                {submittedResult.correctCount} dari {submittedResult.totalQuestions} soal benar
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quizStarted || !quizData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-slate-200 shadow-md">
          <CardHeader className="text-center">
            <div className="text-3xl font-extrabold text-emerald-600 mb-1">Semai 🌱</div>
            <CardTitle className="text-xl">Masuk Kuis Formatif</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStartQuiz} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-200">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="code">Kode Kuis (6 Karakter)</Label>
                <Input
                  id="code"
                  placeholder="Contoh: AB12CD"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  required
                  className="uppercase tracking-widest font-mono text-center text-lg"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="studentName">Nama Lengkap Siswa</Label>
                <Input
                  id="studentName"
                  placeholder="Ketik nama lengkapmu"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isFetchingQuiz}>
                {isFetchingQuiz ? "Mencari Kuis..." : "Mulai Kerjakan 🚀"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="bg-emerald-600 text-white border-none shadow-md">
          <CardContent className="pt-6">
            <div className="text-xs uppercase tracking-wider font-semibold opacity-90">
              {quizData.quiz.subject} • {quizData.quiz.grade_level}
            </div>
            <h1 className="text-2xl font-bold mt-1">{quizData.quiz.title}</h1>
            <div className="text-sm opacity-90 mt-2">Siswa: {studentName}</div>
          </CardContent>
        </Card>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmitQuiz} className="space-y-4">
          {quizData.questions.map((q, idx) => (
            <Card key={q.id} className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-800">
                  {idx + 1}. {q.text}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(q.options as string[]).map((opt, oIdx) => (
                  <button
                    key={oIdx}
                    type="button"
                    onClick={() => handleSelectOption(q.id, oIdx)}
                    className={`w-full p-3 text-left rounded-lg border transition-all flex items-center gap-3 ${
                      selectedAnswers[q.id] === oIdx
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold"
                        : "border-slate-200 hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold">
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span>{opt}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          ))}

          <Button
            type="submit"
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-lg font-bold shadow-md"
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? "Mengirim Jawaban..." : "Kirim Semua Jawaban ✅"}
          </Button>
        </form>
      </div>
    </div>
  );
};
