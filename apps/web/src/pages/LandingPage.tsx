import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { trpc } from "../lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PublicHeader } from "../components/PublicHeader";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [code, setCode] = useState("");

  const handleJoinQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    navigate(`/quiz/${code.trim().toUpperCase()}`);
  };

  const { data: sharedMaterials } = trpc.material.listShared.useQuery();

  return (
    <div className="min-dvh bg-white text-neutral-900 flex flex-col">
      <PublicHeader active="/" />

      {/* Hero + Portal Siswa */}
      <main id="main-content" className="flex-1">
        <section className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-14 grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12">
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

            <Button
              variant="link"
              className="self-start px-0 text-neutral-950 hover:text-neutral-950 h-auto text-sm"
              onClick={() => navigate("/tentang")}
            >
              Mengapa Semai dibuat? →
            </Button>
          </div>

          {/* Right Column: Portal Siswa */}
          <Card id="portal-siswa" className="scroll-mt-20">
            <CardContent className="pt-6 flex flex-col gap-6">
              <div>
                <div className="border-b border-neutral-200 pb-3">
                  <h2 className="text-sm font-medium text-neutral-950">Ikuti Kuis Formatif</h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    Masukkan kode kuis 6 karakter dari pengajar.
                  </p>
                </div>
                <form onSubmit={handleJoinQuiz} className="flex flex-col gap-3 pt-3" aria-label="Form masuk kuis" noValidate>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="quiz-code">Kode Kuis</Label>
                    <Input
                      id="quiz-code"
                      className="font-mono text-center tracking-widest"
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
              </div>

              <div className="border-t border-neutral-200 pt-5">
                <div className="border-b border-neutral-200 pb-3">
                  <h2 className="text-sm font-medium text-neutral-950">Baca Materi Belajar</h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    Bahan ajar yang dibagikan pengajar, tanpa perlu kode.
                  </p>
                </div>
                <div className="pt-3 flex flex-col gap-3">
                  {sharedMaterials && sharedMaterials.length > 0 ? (
                    <ul className="list-none p-0 m-0 flex flex-col divide-y divide-neutral-100 border border-neutral-200 max-h-48 overflow-y-auto">
                      {sharedMaterials.slice(0, 5).map((m: any) => (
                        <li key={m.id}>
                          <button
                            onClick={() => navigate("/materi")}
                            className="w-full text-left px-3 py-2.5 hover:bg-neutral-50 transition-colors"
                          >
                            <p className="text-sm font-medium text-neutral-950 truncate">{m.title}</p>
                            <p className="text-xs text-neutral-400 mt-0.5">{m.subject} · {m.grade_level}</p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-neutral-400 py-2">Belum ada materi dibagikan.</p>
                  )}
                  <Button variant="outline" className="w-full rounded-sm" onClick={() => navigate("/materi")}>
                    Lihat Semua Materi
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Mengapa Semai */}
        <section id="masalah" className="scroll-mt-20 bg-neutral-50 border-y border-neutral-200">
          <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-16">
            <span className="text-xs uppercase tracking-wider text-neutral-400 select-none">Mengapa Semai</span>
            <h2 className="text-xl sm:text-2xl font-medium text-neutral-950 mt-2 tracking-tight">
              Menyelesaikan beban administratif guru.
            </h2>
            <p className="text-sm text-neutral-600 leading-relaxed max-w-2xl mt-3">
              Semai dibuat untuk menjawab satu masalah nyata: guru menghabiskan waktu berjam-jam untuk hal
              yang seharusnya tidak memakan waktu sebegitu lama — menyusun soal, membuat modul, mengoreksi
              esai, dan menulis narasi rapor. Waktu yang hilang itu adalah waktu yang tidak bisa dipakai
              untuk yang paling penting: mendampingi siswa. Semai mengembalikan waktu itu lewat AI.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-200 border border-neutral-200 overflow-hidden mt-8">
              {[
                {
                  title: "Menyusun kuis itu lama",
                  body: "Menulis soal pilihan ganda, menentukan kunci, dan mengatur nilai sering memakan satu malam penuh. Di Semai, AI menyusun kuis lengkap dari satu topik dalam hitungan detik — tinggal review lalu bagikan.",
                },
                {
                  title: "Modul ajar sulit dibagikan",
                  body: "Bahan ajar tersimpan di chat pribadi, flashdisk, atau folder yang tak ada yang tahu. Semai menyimpan materi di satu tempat, otomatis terbuka untuk siswa, bisa ditarik kapan pun.",
                },
                {
                  title: "Koreksi esai menumpuk",
                  body: "Puluhan esai menumpuk menunggu penilaian, umpan balik sering terlambat. AI menilai esai berdasarkan rubrik yang guru tetapkan, memberi skor dan catatan — guru cukup memverifikasi.",
                },
                {
                  title: "Narasi rapor melelahkan",
                  body: "Menulis deskripsi karakter untuk puluhan siswa di akhir semester. Semai menyusun narasi rapor Kurikulum Merdeka dari data nilai yang sudah tercatat, dengan bahasa yang konsisten.",
                },
              ].map((item) => (
                <div key={item.title} className="p-5 bg-white">
                  <p className="text-sm font-medium text-neutral-950">{item.title}</p>
                  <p className="text-xs text-neutral-500 mt-2 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cara Kerja */}
        <section id="cara-kerja" className="scroll-mt-20">
          <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-16">
            <span className="text-xs uppercase tracking-wider text-neutral-400 select-none">Cara Kerja</span>
            <h2 className="text-xl sm:text-2xl font-medium text-neutral-950 mt-2 tracking-tight">
              Tiga peran, satu alur.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {[
                {
                  step: "01",
                  role: "Pengajar",
                  body: "Masuk lewat akun sekolah, buat kuis atau materi dengan AI, lalu bagikan. Hasil kuis, nilai esai, dan laporan tercatat otomatis di papan nilai.",
                },
                {
                  step: "02",
                  role: "Siswa",
                  body: "Tanpa akun, tanpa unduhan. Siswa membuka beranda, memasukkan kode kuis dari pengajar, atau memilih materi belajar yang sudah dibagikan, lalu langsung mengerjakan di perangkat apa pun.",
                },
                {
                  step: "03",
                  role: "Hasil & Umpan Balik",
                  body: "Pengajar memantau jawaban masuk real-time. Setelah kuis selesai, nilai tercatat otomatis; esai dinilai dengan rubrik; rapor tersusun dari data yang sudah ada.",
                },
              ].map((s) => (
                <div key={s.step} className="flex flex-col gap-3">
                  <span className="font-heading text-2xl text-neutral-300 select-none">{s.step}</span>
                  <p className="text-sm font-medium text-neutral-950">{s.role}</p>
                  <p className="text-xs text-neutral-500 leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full px-4 sm:px-6 text-center py-6 border-t border-neutral-200">
        <p className="text-xs text-neutral-400">© 2026 Semai, Sistem Pembelajaran dan Penilaian Terpadu.</p>
      </footer>
    </div>
  );
};
