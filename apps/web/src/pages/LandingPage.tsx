import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Wordmark } from "@/components/Wordmark";

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
    <div className="min-dvh bg-white text-neutral-900 flex flex-col justify-between p-4 sm:p-6">
      {/* Header */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between pb-4 sm:pb-6 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <span className="text-xl">
            <Wordmark taglineClassName="hidden sm:inline" />
          </span>
        </div>
        <Button
          size="sm"
          className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-sm"
          onClick={() => navigate(user ? "/dashboard" : "/login")}
        >
          {user ? "Dashboard Guru" : "Masuk Guru"}
        </Button>
      </header>

      {/* Main Content */}
      <main id="main-content" className="max-w-5xl mx-auto w-full my-8 sm:my-12 grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          <span className="text-xs uppercase tracking-wider text-neutral-400 select-none">
            Platform Pembelajaran Terpadu
          </span>
          <h1 className="text-2xl sm:text-3xl font-medium text-neutral-950 leading-tight tracking-tight">
            Menyemai generasi, <br />
            mengefisiensi profesi.
          </h1>
          <p className="text-sm text-neutral-600 leading-relaxed max-w-lg">
            Portal terintegrasi untuk pendidik di Indonesia: kuis formatif real-time, penyusunan materi berbasis AI, koreksi esai otomatis, dan narasi rapor Kurikulum Merdeka.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-neutral-200 border border-neutral-200 overflow-hidden">
            <div className="p-4 bg-white">
              <p className="text-sm font-medium text-neutral-950">Respons Real-time</p>
              <p className="text-xs text-neutral-400 mt-1">Pemantauan hasil kuis siswa di kelas</p>
            </div>
            <div className="p-4 bg-white">
              <p className="text-sm font-medium text-neutral-950">Modul AI Terpadu</p>
              <p className="text-xs text-neutral-400 mt-1">Otomatisasi materi, esai, dan rapor</p>
            </div>
          </div>
        </div>

        {/* Right Column: Portal Siswa */}
        <Card>
          <CardContent className="pt-6 flex flex-col gap-4">
            <div className="border-b border-neutral-200 pb-4">
              <h2 className="text-sm font-medium text-neutral-950">Portal Siswa, Ikuti Kuis</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Masukkan kode kuis 6 karakter dari guru untuk mulai mengerjakan.
              </p>
            </div>

            <form onSubmit={handleJoinQuiz} className="flex flex-col gap-4" aria-label="Form masuk kuis" noValidate>
              <div className="flex flex-col gap-1">
                <Label htmlFor="quiz-code">Kode Kuis (6 Karakter)</Label>
                <Input
                  id="quiz-code"
                  className="font-mono text-center text-lg tracking-widest"
                  placeholder="AB12CD"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  required
                  autoComplete="off"
                  inputMode="text"
                  enterKeyHint="go"
                  style={{ fontSize: "1rem" }}
                />
              </div>
              <Button type="submit" className="w-full bg-neutral-900 hover:bg-neutral-800 text-white rounded-sm">
                Masuk Kuis
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full text-center py-6 border-t border-neutral-200">
        <p className="text-xs text-neutral-400">© 2026 Semai, Sistem Pembelajaran dan Penilaian Terpadu.</p>
      </footer>
    </div>
  );
};
