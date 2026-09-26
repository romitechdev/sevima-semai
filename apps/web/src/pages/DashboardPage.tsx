import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { useAuth } from "../context/AuthContext";
import { DashboardLayout } from "../components/DashboardLayout";

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

  const totalQuizzes = quizzes?.length || 0;
  const totalStudentsCount = gradebookData?.students?.length || 0;
  const totalGradesCount = gradebookData?.allGrades?.length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Berry Dashboard Metric Banner Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Metric 1: Total Kuis */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                Total Kuis Aktif
              </span>
              <span className="p-2 bg-indigo-500/40 rounded-xl text-lg">📝</span>
            </div>
            <div className="text-3xl font-black mt-3">{totalQuizzes}</div>
            <div className="text-xs text-indigo-100 mt-1 flex items-center gap-1">
              <span>Siap dipantau real-time</span>
            </div>
          </div>

          {/* Metric 2: Total Siswa */}
          <div className="bg-gradient-to-br from-deep-purple-600 to-purple-700 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-200">
                Siswa Terhubung
              </span>
              <span className="p-2 bg-purple-500/40 rounded-xl text-lg">🎓</span>
            </div>
            <div className="text-3xl font-black mt-3">{totalStudentsCount}</div>
            <div className="text-xs text-purple-100 mt-1">Siswa dalam Gradebook</div>
          </div>

          {/* Metric 3: Total Penilaian */}
          <div className="bg-gradient-to-br from-sky-600 to-blue-700 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-200">
                Total Rekap Nilai
              </span>
              <span className="p-2 bg-sky-500/40 rounded-xl text-lg">📊</span>
            </div>
            <div className="text-3xl font-black mt-3">{totalGradesCount}</div>
            <div className="text-xs text-sky-100 mt-1">Kuis, Esai & P5 Terintegrasi</div>
          </div>
        </div>

        {/* Berry Style Agent OS Command Center Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-sm">
                🤖
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Semai Agent OS — Command Center
                </h2>
                <p className="text-xs text-slate-500">
                  Ketik instruksi alami untuk perancangan kuis, bahan ajar, atau konsultasi mengajar.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-100">
              OmniRoute Qwen 27B
            </span>
          </div>

          <form onSubmit={handleAgentSubmit} className="flex flex-col md:flex-row gap-2">
            <input
              type="text"
              placeholder="Contoh: 'Buakan 5 soal kuis fotosintesis kelas 5 SD dan beri ide ice-breaking 3 menit'"
              className="flex-1 px-4 py-3 text-xs md:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
              value={agentInput}
              onChange={(e) => setAgentInput(e.target.value)}
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl text-xs transition-all shadow-xs shrink-0"
              disabled={executeAgentMutation.isPending}
            >
              {executeAgentMutation.isPending ? "Agent Bekerja..." : "Jalankan Agent 🚀"}
            </button>
          </form>

          {agentError && (
            <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100">
              {agentError}
            </div>
          )}

          {agentResult && (
            <div className="bg-slate-50 p-4 rounded-xl border border-indigo-100 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-indigo-100 text-indigo-800">
                  Aksi: {agentResult.actionType}
                </span>
                <span className="text-[11px] text-slate-400">Respon AI Agent</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">{agentResult.title}</h3>
              <p className="text-xs text-slate-600">{agentResult.summary}</p>
              <div className="text-xs bg-white p-3 rounded-lg border border-slate-200 text-slate-700 whitespace-pre-line leading-relaxed font-sans">
                {agentResult.details}
              </div>
              {agentResult.suggestedTargetUrl && agentResult.actionType !== "ADVISE" && (
                <button
                  onClick={handleApplyAgentAction}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-all shadow-xs"
                >
                  Eksekusi ke Tool Terkait →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Active Quizzes List (Berry Card Table) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Daftar Kuis Formatif</h2>
              <p className="text-xs text-slate-500">Kelola dan pantau hasil kuis siswa secara live</p>
            </div>
            <button
              onClick={() => navigate("/create")}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs"
            >
              + Buat Kuis Baru
            </button>
          </div>

          {isQuizzesLoading ? (
            <div className="text-slate-400 text-center py-8 text-xs">Memuat kuis...</div>
          ) : !quizzes || quizzes.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl space-y-2">
              <div className="text-3xl">📝</div>
              <div className="font-bold text-slate-700 text-sm">Belum Ada Kuis Aktif</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Buat kuis formatif 5 soal pertama Anda untuk memantau pemahaman siswa secara real-time di kelas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizzes.map((q) => (
                <div
                  key={q.id}
                  onClick={() => navigate(`/monitor/${q.id}`)}
                  className="bg-slate-50 hover:bg-indigo-50/40 p-4 rounded-xl border border-slate-200/80 hover:border-indigo-300 transition-all cursor-pointer space-y-3 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                      {q.subject} • {q.gradeLevel}
                    </span>
                    <span className="font-mono text-xs text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200 font-bold">
                      Kode: {q.code}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                    {q.title}
                  </h3>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/60">
                    <div>{q.totalQuestions} Soal Pilihan Ganda</div>
                    <div className="font-bold text-indigo-600">
                      {q.totalStudents} Siswa Submit
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
