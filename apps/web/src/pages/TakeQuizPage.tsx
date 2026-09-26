import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";

export const TakeQuizPage: React.FC = () => {
  const { code: urlCode } = useParams<{ code?: string }>();
  const navigate = useNavigate();

  const [inputCode, setInputCode] = useState(urlCode || "");
  const [studentName, setStudentName] = useState("");
  const [quizStarted, setQuizStarted] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submittedResult, setSubmittedResult] = useState<{
    score: number; correctCount: number; totalQuestions: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: quizData, isLoading: isFetchingQuiz, refetch } = trpc.quiz.getByCode.useQuery(
    { code: inputCode }, { enabled: false }
  );

  const submitMutation = trpc.quiz.submitAnswers.useMutation();

  const handleStartQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!inputCode || !studentName) { setError("Silakan isi Kode Kuis dan Nama Kamu"); return; }
    const res = await refetch();
    if (res.isError || !res.data) { setError("Kode kuis tidak ditemukan!"); return; }
    setQuizStarted(true);
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmitQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizData) return;
    const answersArray = quizData.questions.map((q) => ({
      questionId: q.id, selectedIndex: selectedAnswers[q.id] ?? 0,
    }));
    try {
      const res = await submitMutation.mutateAsync({ quizCode: inputCode, studentName, answers: answersArray });
      setSubmittedResult({ score: res.score, correctCount: res.correctCount, totalQuestions: res.totalQuestions });
    } catch (err: any) { setError(err.message || "Gagal mengumpulkan jawaban"); }
  };

  if (submittedResult) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-bold text-blue-600">Jawaban Terkirim!</h2>
            <p className="text-neutral-600">
              Terima kasih <span className="font-bold text-neutral-900">{studentName}</span>. Jawabanmu sudah dicatat secara real-time oleh guru.
            </p>
            <div className="bg-blue-50 p-4 border border-blue-200 rounded-md w-full text-center">
              <p className="text-xs font-semibold text-blue-600 uppercase">Skor Kamu</p>
              <p className="text-3xl font-black text-neutral-900 mt-1">{submittedResult.score} / 100</p>
              <p className="text-sm text-neutral-500 mt-1">
                {submittedResult.correctCount} dari {submittedResult.totalQuestions} soal benar
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quizStarted || !quizData) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col gap-4">
            <div className="flex flex-col items-center gap-1">
              <h2 className="text-2xl font-bold text-blue-600">Semai</h2>
              <h3 className="text-lg font-semibold text-neutral-900">Masuk Kuis Formatif</h3>
            </div>
            <form onSubmit={handleStartQuiz} className="flex flex-col gap-4">
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
              <div className="flex flex-col gap-1">
                <Label>Kode Kuis (6 Karakter)</Label>
                <Input
                  className="font-mono text-center"
                  placeholder="Contoh: AB12CD"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Nama Lengkap Siswa</Label>
                <Input placeholder="Ketik nama lengkapmu" value={studentName} onChange={(e) => setStudentName(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isFetchingQuiz}>
                {isFetchingQuiz ? "Mencari Kuis..." : "Mulai Kerjakan"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-4">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        {/* Quiz Header */}
        <div className="bg-blue-600 rounded-md p-6">
          <p className="text-xs font-semibold text-blue-200">{quizData.quiz.subject} · {quizData.quiz.grade_level}</p>
          <h1 className="text-2xl font-bold text-white mt-1">{quizData.quiz.title}</h1>
          <p className="text-sm text-blue-200 mt-1">Siswa: {studentName}</p>
        </div>

        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        <form onSubmit={handleSubmitQuiz} className="flex flex-col gap-4">
          {quizData.questions.map((q, idx) => (
            <Card key={q.id}>
              <CardContent className="pt-4 flex flex-col gap-2">
                <p className="text-base font-semibold text-neutral-900">{idx + 1}. {q.text}</p>
                {(q.options as string[]).map((opt, oIdx) => (
                  <div
                    key={oIdx}
                    className={`flex items-center gap-3 p-3 border rounded cursor-pointer transition-colors ${
                      selectedAnswers[q.id] === oIdx ? "border-blue-600 bg-blue-50" : "border-neutral-200 bg-white hover:bg-neutral-50"
                    }`}
                    onClick={() => handleSelectOption(q.id, oIdx)}
                  >
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 ${
                      selectedAnswers[q.id] === oIdx ? "border-blue-600 bg-blue-600" : "border-neutral-300"
                    }`}>
                      <span className={`text-xs font-bold ${selectedAnswers[q.id] === oIdx ? "text-white" : "text-neutral-400"}`}>
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                    </div>
                    <p className={`text-sm ${selectedAnswers[q.id] === oIdx ? "font-semibold text-neutral-900" : "text-neutral-700"}`}>
                      {opt}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          <Button type="submit" size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={submitMutation.isPending}>
            {submitMutation.isPending ? "Mengirim Jawaban..." : "Kirim Semua Jawaban"}
          </Button>
        </form>
      </div>
    </div>
  );
};
