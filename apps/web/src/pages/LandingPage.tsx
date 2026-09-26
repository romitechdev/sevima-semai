import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [studentName, setStudentName] = useState("");

  const handleJoinQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    navigate(`/quiz/${code.trim().toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 md:p-8">
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between py-4 border-b">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-black text-emerald-600">Semai 🌱</span>
          <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
            Mini AI Agent OS
          </span>
        </div>
        <div>
          {user ? (
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => navigate("/dashboard")}>
              Masuk Dashboard Guru →
            </Button>
          ) : (
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => navigate("/login")}>
              Login / Daftar Guru
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto w-full my-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left Column: Vision & Pitch */}
        <div className="space-y-6">
          <div className="inline-block bg-emerald-100 text-emerald-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Solusi Pendidikan & AI Berkelanjutan
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
            Menyemai generasi, <br />
            <span className="text-emerald-600">mengefisiensi profesi.</span>
          </h1>
          <p className="text-slate-600 text-base leading-relaxed">
            Platform ekosistem terpadu untuk guru dan siswa di Indonesia. Kuis formatif real-time instan, penyusun materi ajar AI, koreksi esai otomatis, rubrik karakter P5, hingga narasi rapor Kurikulum Merdeka terintegrasi.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="font-bold text-emerald-700 text-lg">⚡ Real-time</div>
              <div className="text-xs text-slate-500">Hasil kuis langsung terdeteksi di kelas</div>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="font-bold text-purple-700 text-lg">🤖 AI Agent</div>
              <div className="text-xs text-slate-500">Materi, esai & rapor otomatis</div>
            </div>
          </div>
        </div>

        {/* Right Column: Portal Siswa (Fast Join Quiz) */}
        <Card className="border-2 border-emerald-500 shadow-xl bg-white p-2">
          <CardHeader className="text-center pb-2">
            <div className="text-4xl mb-1">🎒</div>
            <CardTitle className="text-xl text-slate-800">Portal Siswa — Ikuti Kuis</CardTitle>
            <p className="text-xs text-slate-500">Tanpa perlu login akun. Cukup masukkan kode dari gurumu!</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinQuiz} className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Kode Kuis (6 Karakter)</label>
                <Input
                  placeholder="Contoh: AB12CD"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  required
                  className="uppercase tracking-widest font-mono text-center text-xl h-12 font-bold border-emerald-300 focus:border-emerald-500"
                />
              </div>

              <Button type="submit" className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-base font-bold shadow-md">
                Masuk Kuis Sekarang 🚀
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <footer className="max-w-5xl mx-auto w-full text-center text-xs text-slate-400 border-t pt-4">
        © 2026 Semai 🌱 — Hackathon Project. Dibuat dengan React + Vite + tRPC + Supabase + OmniRoute AI Agent.
      </footer>
    </div>
  );
};
