# Semai — Hackathon MVP Plan

## Konteks

- **Nama Produk:** Semai
- **Tagline:** "Menyemai generasi, mengefisiensi profesi."
- **Studi kasus:** Feedback hasil belajar siswa di Indonesia menunggu rapor (mingguan/bulanan). Konsep yang tidak dipahami tidak terdeteksi cepat. 60% guru keluh beban kerja, waktu intervensi instan minim. Learning gap menumpuk.
- **Target pengguna:** Guru SD/SMP/SMA (primary), siswa (via browser HP, tanpa login)
- **Sisa waktu:** 7 jam efektif, individual
- **Sustainability angle:** Siswa tidak terus tertinggal, tetap di jalur belajar. Tidak ada yang ditinggal = sustainable education.

## Produk

**Nama:** FormatifLive
**Tagline:** "Tahu siapa yang kesulitan, sebelum mereka benar-benar tertinggal."
**Solusi:** Kuis formatif 5 soal setelah tiap materi. AI analisis hasil secara live, identifikasi konsep yang 40%+ salah, generate micro-remedial 2 menit yang guru bisa langsung jalankan di sisa waktu kelas.

## Tech Stack (fixed)

| Layer | Tech |
|---|---|
| Frontend | React + Vite + TypeScript |
| Backend | tRPC (standalone, Node) |
| Database | Supabase (Postgres + Auth + Realtime) |
| AI | Ollama lokal VM, model Qwen 3.8/27B |
| UI | shadcn/ui |
| Hosting | VM pribadi, tunnel ke `formatiflive.romitech.me` |

## Fitur Inti WAJIB (MVP end-to-end)

1. Guru login (email + password, Supabase Auth)
2. Guru buat kuis: 5 soal (teks soal, 4 opsi, kunci jawaban)
3. Sistem generate quiz code (6 char random)
4. Siswa buka link kuis, input nama + code, jawab 5 soal, submit
5. Hasil masuk database real-time (Supabase)
6. Dashboard guru: progress live (berapa siswa sudah submit, per-soal % benar)
7. AI Agent (Ollama Qwen) — 2 aksi nyata:
   - **Aksi 1:** Analisis hasil kuis, identifikasi spesifik konsep mana yang paling banyak salah
   - **Aksi 2:** Generate micro-remedial 2 menit (penjelasan singkat + 2 soal latihan)
8. Data persist di Supabase (bukan localStorage)

## Fitur Tambahan (HANYA jika core solid)

- Export hasil kuis ke CSV
- Multi-kuis per guru (list kuis)
- Halaman "Sejarah Kuis" guru

## Struktur Monorepo

```
formatiflive/
├── apps/
│   ├── web/                  # React + Vite + TS (frontend)
│   │   ├── src/
│   │   │   ├── components/   # shadcn/ui
│   │   │   ├── pages/        # Login, CreateQuiz, TakeQuiz, Dashboard
│   │   │   ├── lib/          # trpc client, supabase client
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   └── server/               # tRPC backend
│       ├── src/
│       │   ├── routes/       # quiz.ts, answers.ts, ai.ts
│       │   ├── lib/          # supabase.ts, ollama.ts, trpc.ts
│       │   └── index.ts      # entry (standalone server)
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   └── shared/               # shared types (zod schemas, TS types)
│       ├── src/
│       │   └── index.ts
│       └── package.json
├── Dockerfile                # multi-stage
├── docker-compose.yml
├── package.json              # workspaces root
├── tsconfig.base.json
├── .eslintrc.cjs
├── .prettierrc
└── README.md
```

### Keputusan Desain

| Keputusan | Alasan |
|---|---|
| Monorepo npm workspaces | 1 repo (panitia minta 1 link), 1 build, dependency sharing |
| `apps/server` = standalone Node | Deploy di VM pribadi, bukan serverless |
| `packages/shared` untuk zod schemas | Frontend + backend validate sama, type-safe end-to-end |
| Supabase untuk DB + Auth + Realtime | 1 service cover 3 challenge point (#1, #2, #6) |
| Ollama di VM sama, panggil via `localhost:11434` | Tidak perlu expose ke internet, server call Ollama internal |
| Frontend static build, serve via nginx di Docker | Produksi: nginx serve `apps/web/dist` + proxy `/trpc/*` ke server |

## Database Schema (ERD)

### Tabel

```
profiles
├── id          uuid PK = auth.users.id
├── email       text
├── name        text
├── role        text ('teacher')
└── created_at  timestamptz

quizzes
├── id          uuid PK
├── teacher_id  uuid FK -> profiles.id
├── title       text
├── subject     text
├── grade_level text
├── code        text UNIQUE (6 char, untuk siswa akses)
└── created_at  timestamptz

questions
├── id            uuid PK
├── quiz_id       uuid FK -> quizzes.id CASCADE
├── text          text
├── options       jsonb (array of 4 strings)
├── correct_index int (0-3)
└── order         int

answers
├── id              uuid PK
├── quiz_id         uuid FK -> quizzes.id CASCADE
├── question_id     uuid FK -> questions.id CASCADE
├── student_name    text
├── selected_index  int (0-3)
├── is_correct      boolean
└── submitted_at    timestamptz
```

### Relasi

```
profiles 1──N quizzes
quizzes  1──N questions
quizzes  1──N answers
questions 1──N answers
```

### RLS Policies

| Tabel | Policy |
|---|---|
| `profiles` | SELECT: authenticated (self). INSERT: authenticated (self, via trigger on auth.users). UPDATE: authenticated (self) |
| `quizzes` | SELECT: authenticated (owner) OR anon (by code). INSERT: authenticated (owner). UPDATE: authenticated (owner). DELETE: authenticated (owner) |
| `questions` | SELECT: authenticated (owner via quiz) OR anon (via quiz code). INSERT: authenticated (owner via quiz) |
| `answers` | INSERT: anon (siswa tanpa login, validasi quiz code). SELECT: authenticated (owner via quiz) |

## 8 Challenge Point

| # | Challenge | Estimasi | Status |
|---|---|---|---|
| 1 | Database & Persistensi (Supabase) | 30 min | pending |
| 2 | Autentikasi (Supabase Auth) | 30 min | pending |
| 3 | Multi-platform / Responsive | 20 min | pending |
| 4 | Aksesibilitas (a11y) | 20 min | pending |
| 5 | Unit testing >80% coverage | 45 min | pending |
| 6 | Real-time (Supabase Realtime) | 30 min | pending |
| 7 | Deploy & CI/CD & Docker | 45 min | pending |
| 8 | AI Agent Fungsional (2 aksi) | 45 min | pending |

## Urutan Pengerjaan

### PHASE 2 — Foundation (45 min)
- [ ] 2.1 Init monorepo: root `package.json` (workspaces), `tsconfig.base.json`
- [ ] 2.2 Scaffold `apps/web`: React + Vite + TS
- [ ] 2.3 Scaffold `apps/server`: tRPC standalone
- [ ] 2.4 Scaffold `packages/shared`: zod schemas + types
- [ ] 2.5 Install deps: trpc, zod, supabase-js, react-query, shadcn/ui
- [ ] 2.6 Setup ESLint + Prettier di root
- [ ] 2.7 Setup Vitest di `apps/server`
- [ ] 2.8 Setup shadcn/ui di `apps/web`
- [ ] 2.9 Verify: dev server jalan, tRPC ping respond

### PHASE 3 — Backend (60 min)
- [ ] 3.1 Supabase: buat project, catat URL + keys
- [ ] 3.2 Buat 4 table (profiles, quizzes, questions, answers)
- [ ] 3.3 Enable RLS + policies
- [ ] 3.4 tRPC setup (context, supabase client)
- [ ] 3.5 Routes: quiz.create, quiz.getByCode, answer.submit, quiz.getResults, quiz.getProgress
- [ ] 3.6 Verify: procedures jalan, data masuk Supabase

### PHASE 4 — Features (120 min)
- [ ] 4.1 Auth: halaman login/register
- [ ] 4.2 Create Quiz: form 5 soal
- [ ] 4.3 Generate quiz code
- [ ] 4.4 Take Quiz: input nama + code, jawab, submit
- [ ] 4.5 Dashboard: progress live
- [ ] 4.6 Routing: react-router-dom
- [ ] 4.7 Verify end-to-end

### PHASE 5 — Quality (45 min)
- [ ] 5.1 Zod validation semua input
- [ ] 5.2 Error handling + toast
- [ ] 5.3 Loading state
- [ ] 5.4 Empty state
- [ ] 5.5 Responsive (375px, 768px, 1280px)
- [ ] 5.6 A11y (aria, focus, contrast, keyboard)
- [ ] 5.7 Unit test tRPC procedures, >80% coverage

### PHASE 6 — DevOps (45 min)
- [ ] 6.1 Dockerfile multi-stage
- [ ] 6.2 docker-compose.yml
- [ ] 6.3 GitHub Actions: ci.yml + deploy.yml
- [ ] 6.4 Verify: docker build + compose up

### PHASE 7 — Deployment (30 min)
- [ ] 7.1 Push ke GitHub
- [ ] 7.2 VM: docker compose up -d
- [ ] 7.3 Cloudflare Tunnel: formatiflive.romitech.me
- [ ] 7.4 Verify full flow di domain live

### PHASE 8 — Final (30 min)
- [ ] 8.1 README.md (cara run, link live, screenshot)
- [ ] 8.2 Rapikan UX (loading/error/empty)
- [ ] 8.3 Siapkan demo flow untuk rekam video
- [ ] 8.4 Commit final

## Strategi Time-Box

| Sisa Waktu | Aksi |
|---|---|
| > 4 jam | Kerjakan semua 8 challenge |
| 3-4 jam | Drop challenge #8 (AI) jika core belum stabil. AI adalah nilai tambah, bukan core. |
| 2-3 jam | Drop challenge #7 (Deploy) jika Docker belum ready. Deploy manual di VM. |
| < 2 jam | Hentikan semua challenge. Fokus: core jalan + README + demo video. |

**Aturan:** Jangan korbankan stabilitas aplikasi utama demi poin bonus. Aplikasi yang jalan > aplikasi yang punya semua fitur tapi crash.

## Perubahan Arah

(log di sini setiap kali ada perubahan besar)

| Waktu | Perubahan | Alasan |
|---|---|---|
| — | — | — |

## Catatan untuk Narasi Teknis

- Monorepo npm workspaces: 1 repo, 1 build pipeline, shared types antar frontend/backend
- tRPC standalone: bukan serverless, deploy di VM sebagai Node process
- Supabase: 1 service untuk 3 kebutuhan (DB, Auth, Realtime) — efisiensi infrastruktur
- Ollama local: AI tidak keluar VM, data siswa tidak dikirim ke third party (privasi)
- RLS di database level: security bukan hanya di aplikasi layer
- Quiz code: siswa tidak perlu akun, cukup code + nama — fricción minimal untuk siswa
