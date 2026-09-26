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
      <div className="space-y-6">
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-lg border border-slate-200">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Kuis Formatif
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-2">{totalQuizzes}</div>
            <div className="text-xs text-slate-500 mt-1">Kuis terdaftar dalam sistem</div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Siswa Terdaftar
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-2">{totalStudentsCount}</div>
            <div className="text-xs text-slate-500 mt-1">Siswa dalam Gradebook</div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Rekap Nilai
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-2">{totalGradesCount}</div>
            <div className="text-xs text-slate-500 mt-1">Nilai kuis, esai, dan P5</div>
          </div>
        </div>

        {/* Command Center */}
        <div className="bg-white rounded-lg p-5 border border-slate-200 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Pusat Instruksi Pembelajaran</h2>
            <p className="text-xs text-slate-500">
              Ketik perintah untuk otomatisasi pembuatan kuis, bahan ajar, atau analisis kelas.
            </p>
          </div>

          <form onSubmit={handleAgentSubmit} className="flex flex-col md:flex-row gap-2">
            <input
              type="text"
              placeholder="Contoh: Buatkan 5 soal kuis tentang fotosintesis untuk kelas 5 SD"
              className="flex-1 px-3 py-2 text-xs md:text-sm rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
              value={agentInput}
              onChange={(e) => setAgentInput(e.target.value)}
            />
            <button
              type="submit"
              className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold px-4 py-2 rounded text-xs transition-colors shrink-0"
              disabled={executeAgentMutation.isPending}
            >
              {executeAgentMutation.isPending ? "Memproses..." : "Jalankan Instruksi"}
            </button>
          </form>

          {agentError && (
            <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded border border-red-200">
              {agentError}
            </div>
          )}

          {agentResult && (
            <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 uppercase">
                  Tindakan: {agentResult.actionType}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">{agentResult.title}</h3>
              <p className="text-xs text-slate-600">{agentResult.summary}</p>
              <div className="text-xs bg-white p-3 rounded border border-slate-200 text-slate-800 whitespace-pre-line leading-relaxed font-sans">
                {agentResult.details}
              </div>
              {agentResult.suggestedTargetUrl && agentResult.actionType !== "ADVISE" && (
                <button
                  onClick={handleApplyAgentAction}
                  className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded text-xs transition-colors"
                >
                  Buka Modul Terkait →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Active Quizzes List */}
        <div className="bg-white rounded-lg p-5 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Daftar Kuis Formatif</h2>
              <p className="text-xs text-slate-500">Hasil dan statistik pengerjaan kuis oleh siswa</p>
            </div>
            <button
              onClick={() => navigate("/create")}
              className="px-3 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded transition-colors"
            >
              + Buat Kuis Baru
            </button>
          </div>

          {isQuizzesLoading ? (
            <div className="text-slate-400 text-center py-6 text-xs">Memuat data kuis...</div>
          ) : !quizzes || quizzes.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-200 rounded space-y-1">
              <div className="font-bold text-slate-700 text-sm">Belum ada kuis yang dibuat</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Buat kuis formatif untuk mulai memantau pemahaman siswa secara real-time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {quizzes.map((q) => (
                <div
                  key={q.id}
                  onClick={() => navigate(`/monitor/${q.id}`)}
                  className="bg-white hover:bg-slate-50 p-4 rounded border border-slate-200 transition-colors cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-600 uppercase">
                      {q.subject} • {q.gradeLevel}
                    </span>
                    <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Kode: {q.code}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm">{q.title}</h3>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <div>{q.totalQuestions} Soal Pilihan Ganda</div>
                    <div className="font-semibold text-slate-700">
                      {q.totalStudents} Siswa Mengumpulkan
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
