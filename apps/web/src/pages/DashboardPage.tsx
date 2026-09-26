import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { useAuth } from "../context/AuthContext";
import { DashboardLayout } from "../components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [agentInput, setAgentInput] = useState("");
  const [agentResult, setAgentResult] = useState<any | null>(null);
  const [agentError, setAgentError] = useState<string | null>(null);

  const { data: quizzes, isLoading: isQuizzesLoading } = trpc.quiz.listByTeacher.useQuery(
    { teacherId: user?.id || "" },
    { enabled: !!user }
  );

  const { data: gradebookData } = trpc.gradebook.listByTeacher.useQuery(
    { teacherId: user?.id || "" },
    { enabled: !!user }
  );

  const executeAgentMutation = trpc.agent.executeCommand.useMutation();

  const handleAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAgentError(null);
    if (!agentInput || agentInput.trim().length < 3) {
      setAgentError("Masukkan instruksi minimal 3 karakter.");
      return;
    }
    try {
      const res = await executeAgentMutation.mutateAsync({ command: agentInput });
      setAgentResult(res);
    } catch (err: any) {
      setAgentError(err.message || "Gagal memproses instruksi.");
    }
  };

  const handleApplyAgentAction = () => {
    if (!agentResult) return;
    if (agentResult.actionType === "CREATE_QUIZ") {
      navigate("/create", { state: { initialPrompt: agentResult.actionPayload?.promptText || agentResult.title } });
    } else if (agentResult.actionType === "CREATE_MATERIAL") {
      navigate("/material");
    } else if (agentResult.actionType === "DOCU_NOTE") {
      navigate("/documents");
    }
  };

  const totalQuizzes = quizzes?.length || 0;
  const totalStudentsCount = gradebookData?.students?.length || 0;
  const totalGradesCount = gradebookData?.allGrades?.length || 0;

  const submittedCount = quizzes?.reduce((sum, q) => sum + (q.totalStudents || 0), 0) || 0;
  const recentQuizzes = (quizzes || []).slice(0, 5);

  const teacherName = user?.user_metadata?.name as string | undefined;
  const greeting = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-sm text-neutral-500">{greeting}</p>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 mt-1">
              Selamat datang, {teacherName?.split(" ")[0] || "Guru"}
            </h1>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto" onClick={() => navigate("/create")}>
            Buat Kuis Formatif
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-200 rounded-xl ring-1 ring-neutral-200 overflow-hidden">
          {[
            { label: "Kuis Formatif", value: totalQuizzes, desc: "kuis terdaftar" },
            { label: "Siswa Terdaftar", value: totalStudentsCount, desc: "dalam gradebook" },
            { label: "Pengerjaan Dikumpulkan", value: submittedCount, desc: "seluruh kuis" },
            { label: "Rekap Nilai", value: totalGradesCount, desc: "nilai tersimpan" },
          ].map((m) => (
            <div key={m.label} className="bg-white p-4 sm:p-5">
              <p className="text-xs font-medium text-neutral-500">{m.label}</p>
              <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 mt-2 tabular-nums">{m.value}</p>
              <p className="text-xs text-neutral-400 mt-1">{m.desc}</p>
            </div>
          ))}
        </div>

        <Card>
          <CardContent className="pt-5 flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-base font-semibold text-neutral-900">Instruksi AI</h3>
                <p className="text-sm text-neutral-500 mt-0.5">Ketik perintah untuk membuat kuis, materi, atau arsip kelas.</p>
              </div>
              <Badge variant="secondary" className="font-mono">Agent</Badge>
            </div>
            <form onSubmit={handleAgentSubmit} noValidate>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Contoh: Buatkan 5 soal kuis tentang fotosintesis untuk kelas 5 SD"
                  aria-label="Instruksi untuk AI Agent"
                  value={agentInput}
                  onChange={(e) => setAgentInput(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground sm:w-auto" disabled={executeAgentMutation.isPending}>
                  {executeAgentMutation.isPending ? "Memproses..." : "Jalankan"}
                </Button>
              </div>
            </form>
            {agentError && <Alert variant="destructive"><AlertDescription>{agentError}</AlertDescription></Alert>}
            {agentResult && (
              <div className="bg-neutral-50 p-4 border border-neutral-200 rounded-lg flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono">{agentResult.actionType}</Badge>
                  <p className="text-sm font-semibold text-neutral-900">{agentResult.title}</p>
                </div>
                <p className="text-sm text-neutral-600">{agentResult.summary}</p>
                <div className="bg-white p-3 border border-neutral-200 rounded-md text-sm text-neutral-700 whitespace-pre-line leading-relaxed">
                  {agentResult.details}
                </div>
                {agentResult.suggestedTargetUrl && agentResult.actionType !== "ADVISE" && (
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground self-start" onClick={handleApplyAgentAction}>
                    Buka Modul Terkait
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-base font-semibold text-neutral-900">Kuis Formatif</h3>
                <p className="text-sm text-neutral-500 mt-0.5">Kuis terbaru beserta jumlah siswa yang mengumpulkan.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/create")}>
                Buat Kuis Baru
              </Button>
            </div>

            {isQuizzesLoading ? (
              <div className="flex flex-col gap-3 p-1">
                <Skeleton className="w-full h-16" />
                <Skeleton className="w-full h-16" />
                <Skeleton className="w-full h-16" />
              </div>
            ) : !quizzes || quizzes.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-neutral-300 rounded-lg">
                <p className="text-sm font-semibold text-neutral-700">Belum ada kuis</p>
                <p className="text-sm text-neutral-500 max-w-sm mx-auto mt-1">
                  Buat kuis formatif pertama untuk mulai memantau pemahaman siswa secara real-time.
                </p>
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground mt-4" onClick={() => navigate("/create")}>
                  Buat Kuis Pertama
                </Button>
              </div>
            ) : (
              <ul className="list-none p-0 m-0 flex flex-col divide-y divide-neutral-100 border border-neutral-200 rounded-lg overflow-hidden">
                {recentQuizzes.map((q) => (
                  <li key={q.id}>
                    <button
                      onClick={() => navigate(`/monitor/${q.id}`)}
                      className="w-full text-left px-4 py-3.5 hover:bg-neutral-50 transition-colors flex items-center gap-4"
                      aria-label={`Lihat detail kuis ${q.title}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 truncate">{q.title}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {q.subject} · {q.gradeLevel} · {q.totalQuestions} soal
                        </p>
                      </div>
                      <span className="text-xs font-mono text-neutral-400 flex-shrink-0">{q.code}</span>
                      <span className="text-sm font-medium text-neutral-700 tabular-nums flex-shrink-0">
                        {q.totalStudents} <span className="text-xs text-neutral-400 font-normal">siswa</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};
