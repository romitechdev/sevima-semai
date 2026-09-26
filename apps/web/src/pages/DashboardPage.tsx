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

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Kuis Formatif", value: totalQuizzes, desc: "Kuis terdaftar dalam sistem" },
            { label: "Siswa Terdaftar", value: totalStudentsCount, desc: "Siswa dalam Gradebook" },
            { label: "Total Rekap Nilai", value: totalGradesCount, desc: "Nilai kuis, esai, dan P5" },
          ].map((m) => (
            <Card key={m.label}>
              <CardContent className="pt-5">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{m.label}</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">{m.value}</p>
                <p className="text-xs text-neutral-500 mt-1">{m.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Command Center */}
        <Card>
          <CardContent className="pt-5 flex flex-col gap-4">
            <div>
              <h3 className="text-base font-semibold text-neutral-900">Pusat Instruksi Pembelajaran</h3>
              <p className="text-xs text-neutral-500">Ketik perintah untuk otomatisasi pembuatan kuis, bahan ajar, atau analisis kelas.</p>
            </div>
            <form onSubmit={handleAgentSubmit}>
              <div className="flex gap-2 flex-wrap">
                <Input
                  placeholder="Contoh: Buatkan 5 soal kuis tentang fotosintesis untuk kelas 5 SD" aria-label="Instruksi untuk AI Agent"
                  value={agentInput}
                  onChange={(e) => setAgentInput(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={executeAgentMutation.isPending}>
                  {executeAgentMutation.isPending ? "Memproses..." : "Jalankan Instruksi"}
                </Button>
              </div>
            </form>
            {agentError && <Alert variant="destructive"><AlertDescription>{agentError}</AlertDescription></Alert>}
            {agentResult && (
              <div className="bg-neutral-50 p-4 border border-neutral-200 rounded-md flex flex-col gap-3">
                <p className="text-xs font-semibold text-neutral-500 uppercase">Tindakan: {agentResult.actionType}</p>
                <p className="text-sm font-bold text-neutral-900">{agentResult.title}</p>
                <p className="text-xs text-neutral-500">{agentResult.summary}</p>
                <div className="bg-white p-3 border border-neutral-200 rounded text-xs text-neutral-700 whitespace-pre-line leading-relaxed">
                  {agentResult.details}
                </div>
                {agentResult.suggestedTargetUrl && agentResult.actionType !== "ADVISE" && (
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white self-start" onClick={handleApplyAgentAction}>
                    Buka Modul Terkait
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Quizzes List */}
        <Card>
          <CardContent className="pt-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-neutral-900">Daftar Kuis Formatif</h3>
                <p className="text-xs text-neutral-500">Hasil dan statistik pengerjaan kuis oleh siswa</p>
              </div>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => navigate("/create")}>
                + Buat Kuis Baru
              </Button>
            </div>

            {isQuizzesLoading ? (
              <div className="flex flex-col gap-2 p-4">
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-full h-4" />
              </div>
            ) : !quizzes || quizzes.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-neutral-200 rounded-md">
                <p className="text-sm font-semibold text-neutral-600">Belum ada kuis yang dibuat</p>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
                  Buat kuis formatif untuk mulai memantau pemahaman siswa secara real-time.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quizzes.map((q) => (
                  <div
                    key={q.id}
                    onClick={() => navigate(`/monitor/${q.id}`)}
                    onKeyDown={(e) => e.key === "Enter" && navigate(`/monitor/${q.id}`)}
                    role="link"
                    tabIndex={0}
                    aria-label={`Lihat detail kuis ${q.title}`}
                    className="p-4 border border-neutral-200 bg-white rounded-md cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-500">{q.subject} · {q.gradeLevel}</span>
                        <span className="text-xs font-mono bg-neutral-100 px-2 py-0.5 border border-neutral-200 rounded">Kode: {q.code}</span>
                      </div>
                      <p className="text-sm font-bold text-neutral-900">{q.title}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                        <span className="text-xs text-neutral-500">{q.totalQuestions} Soal Pilihan Ganda</span>
                        <span className="text-xs font-semibold text-neutral-600">{q.totalStudents} Siswa Mengumpulkan</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};
