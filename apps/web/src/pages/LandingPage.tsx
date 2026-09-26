import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [code, setCode] = useState("");

  const handleJoinQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    navigate(`/quiz/${code.trim().toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-6 md:p-12 text-slate-900 font-sans">
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-emerald-800 text-white font-bold flex items-center justify-center text-sm">
            S
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">Semai</span>
        </div>
        <div>
          {user ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded transition-colors"
            >
              Buka Dashboard Guru →
            </button>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded transition-colors"
            >
              Login / Masuk Guru
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto w-full my-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left Column */}
        <div className="space-y-6">
          <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100/60 inline-block px-3 py-1 rounded border border-emerald-200">
            Platform Pembelajaran Terpadu
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
            Menyemai generasi, <br />
            <span className="text-emerald-800">mengefisiensi profesi.</span>
          </h1>
          <p className="text-slate-600 text-sm leading-relaxed">
            Sistem terintegrasi untuk pendidik dan peserta didik di Indonesia. Menyediakan penanganan kuis formatif real-time, penyusun materi pembelajaran AI, koreksi esai otomatis, hingga narasi rapor Kurikulum Merdeka.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-white rounded border border-slate-200">
              <div className="font-bold text-slate-900 text-sm">Respons Real-time</div>
              <div className="text-xs text-slate-500 mt-1">Pemantauan hasil kuis siswa di kelas</div>
            </div>
            <div className="p-4 bg-white rounded border border-slate-200">
              <div className="font-bold text-slate-900 text-sm">Modul AI Terpadu</div>
              <div className="text-xs text-slate-500 mt-1">Otomatisasi materi, esai, & rapor</div>
            </div>
          </div>
        </div>

        {/* Right Column: Portal Siswa */}
        <div className="bg-white rounded-lg border border-slate-300 p-6 shadow-sm space-y-4">
          <div className="border-b pb-4">
            <h2 className="text-lg font-bold text-slate-900">Portal Siswa — Ikuti Kuis</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Masukkan 6-digit kode kuis yang diberikan oleh guru untuk mulai mengerjakan.
            </p>
          </div>

          <form onSubmit={handleJoinQuiz} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="quizCodeInput" className="text-xs font-semibold text-slate-700 uppercase">
                Kode Kuis (6 Karakter)
              </label>
              <input
                id="quizCodeInput"
                placeholder="AB12CD"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                required
                className="w-full h-12 text-center text-xl font-mono uppercase tracking-widest font-bold border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <button
              type="submit"
              className="w-full h-11 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-sm rounded transition-colors"
            >
              Masuk Kuis
            </button>
          </form>
        </div>
      </main>

      <footer className="max-w-5xl mx-auto w-full text-center text-xs text-slate-400 border-t border-slate-200 pt-6">
        © 2026 Semai — Sistem Pembelajaran & Penilaian Terpadu.
      </footer>
    </div>
  );
};
