import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

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
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between p-6">
      {/* Header */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between pb-6 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">S</div>
          <span className="text-lg font-bold text-neutral-900">Semai</span>
        </div>
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => navigate(user ? "/dashboard" : "/login")}
        >
          {user ? "Buka Dashboard Guru" : "Login / Masuk Guru"}
        </Button>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto w-full my-12 grid grid-cols-2 gap-12">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 border border-blue-200 rounded self-start">
            Platform Pembelajaran Terpadu
          </span>
          <h1 className="text-4xl font-bold text-neutral-900 leading-tight">
            Menyemai generasi, <br />
            <span className="text-blue-600">mengefisiensi profesi.</span>
          </h1>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Sistem terintegrasi untuk pendidik dan peserta didik di Indonesia. Menyediakan penanganan kuis formatif real-time, penyusun materi pembelajaran AI, koreksi esai otomatis, hingga narasi rapor Kurikulum Merdeka.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-white border border-neutral-200 rounded-md">
              <p className="text-sm font-bold text-neutral-900">Respons Real-time</p>
              <p className="text-xs text-neutral-500 mt-1">Pemantauan hasil kuis siswa di kelas</p>
            </div>
            <div className="p-4 bg-white border border-neutral-200 rounded-md">
              <p className="text-sm font-bold text-neutral-900">Modul AI Terpadu</p>
              <p className="text-xs text-neutral-500 mt-1">Otomatisasi materi, esai, & rapor</p>
            </div>
          </div>
        </div>

        {/* Right Column: Portal Siswa */}
        <Card>
          <CardContent className="pt-6 flex flex-col gap-4">
            <div className="border-b pb-4">
              <h2 className="text-lg font-bold text-neutral-900">Portal Siswa · Ikuti Kuis</h2>
              <p className="text-xs text-neutral-500 mt-1">
                Masukkan 6-digit kode kuis yang diberikan oleh guru untuk mulai mengerjakan.
              </p>
            </div>

            <form onSubmit={handleJoinQuiz} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <Label>Kode Kuis (6 Karakter)</Label>
                <Input
                  className="font-mono text-center text-lg tracking-widest"
                  placeholder="AB12CD"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Masuk Kuis
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="max-w-5xl mx-auto w-full text-center py-6 border-t border-neutral-200">
        <p className="text-xs text-neutral-400">© 2026 Semai · Sistem Pembelajaran & Penilaian Terpadu.</p>
      </div>
    </div>
  );
};
