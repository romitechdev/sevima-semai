import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { useAuth } from "../context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";

export const DashboardPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [agentInput, setAgentInput] = useState("");
  const [agentResult, setAgentResult] = useState<any | null>(null);
  const [agentError, setAgentError] = useState<string | null>(null);

  const { data: quizzes, isLoading } = trpc.quiz.listByTeacher.useQuery(
    { teacherId: user?.id || "" },
    { enabled: !!user }
  );

  const executeAgentMutation = trpc.agent.executeCommand.useMutation();

  const handleAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAgentError(null);
    if (!agentInput || agentInput.trim().length < 3) {
      setAgentError("Masukkan perintah agent minimal 3 karakter");
      return;
    }

    try {
      const res = await executeAgentMutation.mutateAsync({ command: agentInput });
      setAgentResult(res);
    } catch (err: any) {
      setAgentError(err.message || "Gagal memproses perintah AI Agent");
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

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-emerald-600">Semai 🌱</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
                Mini AI Agent OS
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-1">
              Selamat datang, <span className="font-semibold text-slate-700">{user?.email}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button className="bg-purple-600 hover:bg-purple-700 text-xs md:text-sm" onClick={() => navigate("/material")}>
              📚 Materi AI
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-xs md:text-sm" onClick={() => navigate("/essay")}>
              ✍️ Koreksi Esai
            </Button>
            <Button className="bg-amber-600 hover:bg-amber-700 text-xs md:text-sm" onClick={() => navigate("/documents")}>
              📁 Arsip Dokumen
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-xs md:text-sm" onClick={() => navigate("/create")}>
              + Buat Kuis
            </Button>
            <Button variant="outline" className="text-xs md:text-sm" onClick={() => signOut()}>
              Keluar
            </Button>
          </div>
        </header>

        {/* AI Agent Command Center Bar */}
        <Card className="border-2 border-emerald-400 bg-gradient-to-r from-emerald-50 via-teal-50 to-white shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-emerald-900 flex items-center gap-2">
              <span>🤖</span> Semai Agent OS — Command Center Guru
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <form onSubmit={handleAgentSubmit} className="flex flex-col md:flex-row gap-2">
              <input
                type="text"
                placeholder="Ketik perintah apa saja... Contoh: 'Buat kuis pecahan 5 soal dan beri ide ice-breaking 3 menit'"
                className="flex-1 px-4 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                value={agentInput}
                onChange={(e) => setAgentInput(e.target.value)}
              />
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6"
                disabled={executeAgentMutation.isPending}
              >
                {executeAgentMutation.isPending ? "Agent Bekerja..." : "Jalankan Perintah 🚀"}
              </Button>
            </form>

            {agentError && (
              <div className="p-2 bg-red-50 text-red-600 text-xs rounded border border-red-200">
                {agentError}
              </div>
            )}

            {agentResult && (
              <div className="bg-white p-4 rounded-lg border border-emerald-200 space-y-3 mt-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2 py-0.5 rounded font-bold uppercase bg-emerald-100 text-emerald-800">
                    Aksi Agent: {agentResult.actionType}
                  </span>
                  <span className="text-xs text-slate-400">OmniRoute Qwen Agent</span>
                </div>
                <h3 className="font-bold text-slate-800 text-base">{agentResult.title}</h3>
                <p className="text-xs text-slate-600">{agentResult.summary}</p>
                <div className="text-xs bg-slate-50 p-3 rounded border border-slate-200 text-slate-700 whitespace-pre-line">
                  {agentResult.details}
                </div>
                {agentResult.suggestedTargetUrl && agentResult.actionType !== "ADVISE" && (
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                    onClick={handleApplyAgentAction}
                  >
                    Eksekusi di Generator →
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800">Daftar Kuis Anda</h2>

          {isLoading ? (
            <div className="text-slate-500 text-center py-8">Memuat daftar kuis...</div>
          ) : !quizzes || quizzes.length === 0 ? (
            <Card className="border-dashed border-2 border-slate-200 text-center p-8">
              <CardContent className="space-y-3 pt-4">
                <div className="text-4xl">📝</div>
                <CardTitle className="text-lg font-semibold text-slate-700">
                  Belum Ada Kuis
                </CardTitle>
                <p className="text-slate-500 text-sm max-w-sm mx-auto">
                  Buat kuis formatif 5 soal pertama Anda untuk memantau hasil belajar siswa secara real-time.
                </p>
                <Button className="bg-emerald-600 hover:bg-emerald-700 mt-2" onClick={() => navigate("/create")}>
                  Buat Kuis Sekarang
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizzes.map((q) => (
                <Card key={q.id} className="hover:border-emerald-500 transition-all cursor-pointer shadow-sm" onClick={() => navigate(`/monitor/${q.id}`)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                        {q.subject} • {q.gradeLevel}
                      </span>
                      <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        Kode: {q.code}
                      </span>
                    </div>
                    <CardTitle className="text-lg font-bold text-slate-800 mt-2">
                      {q.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t mt-2">
                    <div>{q.totalQuestions} Pertanyaan</div>
                    <div className="font-semibold text-emerald-700">
                      {q.totalStudents} Siswa Mengumpulkan
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
