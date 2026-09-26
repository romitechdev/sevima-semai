import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "../components/PublicHeader";

const VALUES = [
  {
    title: "Waktu guru adalah waktu siswa",
    body: "Setiap jam yang habis untuk administratif adalah jam yang hilang dari kelas. Semai memangkas waktu itu agar pengajar kembali fokus pada mendampingi, bukan mengetik.",
  },
  {
    title: "AI asisten, bukan pengganti",
    body: "Semai menyusun draf kuis, materi, penilaian esai, dan narasi rapor. Yang menentukan isi, rubrik, dan keputusan akhir tetap pengajar — AI hanya mempercepat pekerjaan rutin.",
  },
  {
    title: "Siswa tanpa hambatan akses",
    body: "Siswa tidak perlu membuat akun, mengunduh aplikasi, atau mengingat password. Satu kode kuis di papan tulis dan mereka langsung bisa mengerjakan, dari HP apa pun.",
  },
  {
    title: "Data penilaian dalam satu tempat",
    body: "Hasil kuis, nilai esai, unjuk kerja, dan P5 tercatat otomatis dalam papan nilai yang sama, sehingga narasi rapor tersusun dari data yang konsisten, bukan ingatan.",
  },
];

export const AboutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-dvh bg-white text-neutral-900 flex flex-col">
      <PublicHeader active="/tentang" showLogin={false} />

      <main id="main-content" className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-16">
        <span className="text-xs uppercase tracking-wider text-neutral-400 select-none">Tentang Semai</span>
        <h1 className="text-2xl sm:text-3xl font-medium text-neutral-950 mt-2 leading-tight tracking-tight">
          Mengapa Semai dibuat.
        </h1>

        <div className="flex flex-col gap-4 mt-6 text-sm text-neutral-600 leading-relaxed max-w-2xl">
          <p>
            Semai lahir dari observasi sederhana: sebagian besar beban guru bukan pada mengajar, melainkan pada
            pekerjaan administratif yang mengitarinya. Menyusun soal, membuat modul, mengoreksi esai satu per satu,
            dan menulis narasi rapor untuk puluhan siswa — semua itu dikerjakan di luar jam mengajar, sering di malam hari.
          </p>
          <p>
            Nama <em className="font-medium text-neutral-950">Semai</em> diambil dari kata "menyemai": menanam benih
            dengan sabar agar tumbuh menjadi tanaman. Visinya sama — teknologi yang tepat tidak menggantikan guru,
            melainkan menyiapkan tanah agar benih belajar tumbuh lebih sehat.
          </p>
          <p>
            Semai dibangun sebagai platform terpadu untuk pendidik di Indonesia, mengikuti prinsip Kurikulum Merdeka:
            kuis formatif real-time, materi berbasis AI, koreksi esai otomatis, dan narasi rapor — semuanya terhubung
            dalam satu alur data yang sama.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-neutral-200 border border-neutral-200 overflow-hidden mt-10">
          {VALUES.map((v) => (
            <div key={v.title} className="p-5 bg-white">
              <p className="text-sm font-medium text-neutral-950">{v.title}</p>
              <p className="text-xs text-neutral-500 mt-2 leading-relaxed">{v.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-4 border border-neutral-200 bg-neutral-50 p-5">
          <div className="flex-1">
            <p className="text-sm font-medium text-neutral-950">Siap mencoba?</p>
            <p className="text-xs text-neutral-500 mt-1">
              {user
                ? "Dashboard Anda sudah siap. Kuis dan materi tersimpan di sana."
                : "Masuk dengan akun pengajar untuk mulai membuat kuis dan materi pertama Anda."}
            </p>
          </div>
          <Button
            className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-sm"
            onClick={() => navigate(user ? "/dashboard" : "/login")}
          >
            {user ? "Buka Dashboard" : "Masuk Pengajar"}
          </Button>
        </div>
      </main>

      <footer className="text-center py-6 border-t border-neutral-200">
        <p className="text-xs text-neutral-400">© 2026 Semai, Sistem Pembelajaran dan Penilaian Terpadu.</p>
      </footer>
    </div>
  );
};
