# Tentang Semai

**Semai** adalah platform pembelajaran dan penilaian terpadu untuk pengajar Indonesia, dibangun dengan AI untuk mengambil alih beban administratif.

> Menyemai generasi, mengefisiensi profesi.

## Masalah

Pengajar di Indonesia menyita lebih dari 40% waktu kerja untuk urusan administrasi instansi (PMM, MyASN, e-kinerja, BOS) di luar tugas mengajar. Di atas itu, beban akademik klasik (kuis, koreksi esai, narasi rapor) tetap menumpuk, dan monitoring kuis di kelas masih manual.

## Solusi

Semai menggabungkan seluruh alur penilaian dalam satu portal:

- **Kuis formatif real-time** : siswa membuka portal dengan kode 6 digit, jawaban terpantau langsung di layar pengajar via WebSocket.
- **Generator soal & materi AI** : dari topik/kompetensi menjadi soal, kunci, dan bahan ajar terstruktur.
- **Koreksi esai otomatis** : nilai berdasarkan rubrik dengan umpan balik per aspek.
- **Gradebook terintegrasi** : semua skor (kuis, esai, tugas) dalam satu tabel, plus generator narasi rapor AI.
- **Semai Agent OS** : asisten AI yang mengeksekusi perintah (buat kuis, koreksi esai, buatkan materi) sebagai aksi nyata di sistem, bukan chatbot.

Siswa tidak perlu membuat akun. Cukup kode 6 digit dari pengajar.

## Tech Stack

React 19 + Vite + Tailwind 4 + shadcn/ui (web), Node 22 + tRPC + zod (server), Supabase (Postgres, Auth, Realtime), WebSocket untuk real-time, Docker + GitHub Actions untuk deploy dan CI/CD.

Monorepo npm workspaces: `apps/web`, `apps/server`, `packages/shared`.

## Menjalankan Lokal

```bash
git clone https://github.com/romitechdev/sevima-semai.git
cd sevima-semai
npm install
docker compose up --build
```

Web: http://localhost:3000
Server tRPC: http://localhost:3002/trpc
WebSocket: ws://localhost:3002/ws

Lihat `README.md` untuk detail environment variable dan setup Supabase.

## Demo Langsung

<https://semai.romitech.me>

## Lisensi

Proyek hackathon SEMESTA 8, Tech Career Academy by Sevima.
