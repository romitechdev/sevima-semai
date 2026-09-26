# Semai — Platform Pengajar Terpadu

> **"Menyemai generasi, mengefisiensi profesi."**

Semai adalah platform berbasis AI untuk tenaga pendidik di Indonesia. Dirancang untuk mengurangi beban administratif guru — menyusun kuis formatif, membuat bahan ajar, mengoreksi esai, merekap nilai, hingga menyusun narasi rapor Kurikulum Merdeka — semuanya dalam satu antarmuka terintegrasi.

Siswa tidak perlu membuat akun. Mereka cukup membuka browser di HP, memasukkan kode kuis dari guru, dan langsung mengerjakan.

---

## Daftar Isi

- [Fitur](#fitur)
- [Tech Stack](#tech-stack)
- [Arsitektur](#arsitektur)
- [Struktur Monorepo](#struktur-monorepo)
- [Prasyarat](#prasyarat)
- [Instalasi & Menjalankan Lokal](#instalasi--menjalankan-lokal)
- [Environment Variables](#environment-variables)
- [Database — Setup Supabase](#database--setup-supabase)
- [Skema Database](#skema-database)
- [API Reference (tRPC)](#api-reference-trpc)
- [WebSocket Real-time](#websocket-real-time)
- [Integrasi LLM / AI](#integrasi-llm--ai)
- [Halaman & Routing Frontend](#halaman--routing-frontend)
- [Menjalankan dengan Docker](#menjalankan-dengan-docker)
- [CI/CD](#cicd)
- [Testing](#testing)
- [Keputusan Arsitektur](#keputusan-arsitektur)
- [Kontribusi](#kontribusi)

---

## Fitur

### Untuk Guru (Login Diperlukan)

| Fitur | Deskripsi |
|---|---|
| **Kuis Formatif Real-time** | Buat kuis pilihan ganda (1–50 soal), bagikan via kode 6 karakter, pantau jawaban masuk secara live |
| **Generator Kuis AI** | Generate soal otomatis dari topik/materi menggunakan LLM (1–20 soal sekali generate) |
| **Monitor Kuis Live** | Dashboard per-soal: persentase benar, distribusi pilihan jawaban, flag intervensi jika <60% benar |
| **Generator Materi Ajar** | Buat bahan ajar terstruktur (ringkasan, poin kunci, penjelasan, ide aktivitas) dari satu topik |
| **Koreksi Esai AI** | Nilai jawaban esai siswa berdasarkan rubrik guru: skor 0–100, feedback, kelebihan, area perbaikan |
| **AI Agent (Pusat Instruksi)** | Ketik perintah natural language → AI routing ke modul yang tepat (buat kuis/materi/arsip/saran) |
| **Gradebook Terintegrasi** | Rekap nilai dari kuis, esai, unjuk kerja, dan P5 dalam satu tabel per siswa |
| **Narasi Rapor AI** | Generate narasi rapor perkembangan siswa bergaya Kurikulum Merdeka dari data nilai tersimpan |
| **Arsip Dokumentasi** | Simpan dan kelola dokumen materi pembelajaran serta tugas/penugasan |

### Untuk Siswa (Tanpa Akun)

| Fitur | Deskripsi |
|---|---|
| **Ikuti Kuis** | Masukkan kode 6 karakter + nama → langsung kerjakan kuis di browser HP manapun |
| **Baca Materi Belajar** | Akses bahan ajar yang dibagikan guru di `/materi` — tanpa login, tanpa kode |
| **Skor Instan** | Setelah submit, siswa langsung melihat skor dan jumlah jawaban benar |

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend** | React 19, Vite 8, TypeScript 6 |
| **Backend** | tRPC v11 (standalone Node HTTP server) |
| **Database** | Supabase (PostgreSQL + Auth + Realtime) |
| **UI Components** | shadcn/ui, Tailwind CSS v4, Base UI, Lucide React |
| **State & Data Fetching** | TanStack Query v5 + tRPC React Query |
| **Autentikasi** | Supabase Auth (email/password + Google OAuth) |
| **AI / LLM** | OpenAI-compatible API (Ollama / OmniRoute) |
| **Real-time** | WebSocket (`ws` library) + Supabase Realtime |
| **Validasi** | Zod v3 (shared frontend & backend) |
| **Monorepo** | npm workspaces |
| **Testing** | Vitest + @vitest/coverage-v8 |
| **Containerisasi** | Docker multi-stage + Docker Compose |
| **CI/CD** | GitHub Actions |
| **Reverse Proxy** | nginx (di dalam container web) |

---

## Arsitektur

```
┌─────────────────────────────────────────────────────────┐
│                      Browser (Siswa/Guru)                │
│                React 19 + Vite + Tailwind CSS            │
│                   tRPC Client + TanStack Query           │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP /trpc  &  WS /ws
┌───────────────────────▼─────────────────────────────────┐
│               tRPC Node Server (port 3002)               │
│   ┌─────────────────────────────────────────────────┐   │
│   │  Routes: quiz · material · essay · gradebook    │   │
│   │          document · agent · health              │   │
│   └──────────────────┬──────────────────────────────┘   │
│   ┌──────────────────▼──────────────────────────────┐   │
│   │         WebSocket Server (/ws)                  │   │
│   │  Broadcast real-time quiz submissions           │   │
│   └─────────────────────────────────────────────────┘   │
└──────┬──────────────────────────────────────┬───────────┘
       │ Supabase SDK (service role)          │ Fetch API
┌──────▼──────────────┐              ┌────────▼────────────┐
│  Supabase Postgres  │              │   LLM API Endpoint   │
│  7 tables + RLS     │              │ (Ollama / OmniRoute) │
│  Auth + Realtime    │              │  OpenAI-compatible   │
└─────────────────────┘              └─────────────────────┘
```

**Alur kunci:**
- Guru membuat kuis → server menyimpan ke Supabase → code dibagikan ke siswa
- Siswa submit jawaban → server grades → broadcast via WebSocket → guru lihat live di monitor
- Nilai dari kuis/esai otomatis masuk ke tabel `student_grades`
- Semua panggilan LLM terjadi di server — data siswa tidak keluar dari server

---

## Struktur Monorepo

```
formatiflive/
├── apps/
│   ├── server/                   # tRPC backend Node.js
│   │   ├── src/
│   │   │   ├── index.ts          # Entry point: HTTP + WebSocket server
│   │   │   ├── lib/
│   │   │   │   ├── llm.ts        # Semua fungsi panggilan LLM
│   │   │   │   ├── supabase.ts   # Supabase admin client
│   │   │   │   ├── trpc.ts       # tRPC init
│   │   │   │   └── ws-broadcast.ts # WebSocket broadcast logic
│   │   │   └── routes/
│   │   │       ├── index.ts      # Root appRouter
│   │   │       ├── quiz.ts
│   │   │       ├── material.ts
│   │   │       ├── essay.ts
│   │   │       ├── gradebook.ts
│   │   │       ├── document.ts
│   │   │       └── agent.ts
│   │   ├── test/                 # Vitest tests
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                      # React + Vite frontend
│       ├── src/
│       │   ├── App.tsx            # Router + tRPC provider setup
│       │   ├── main.tsx
│       │   ├── index.css          # Tailwind v4 + custom styles
│       │   ├── components/
│       │   │   ├── DashboardLayout.tsx  # Sidebar + header layout
│       │   │   ├── PublicHeader.tsx     # Header halaman publik
│       │   │   ├── MaterialDialog.tsx   # Dialog preview materi
│       │   │   ├── Wordmark.tsx
│       │   │   └── ui/            # shadcn/ui components
│       │   ├── pages/
│       │   │   ├── LandingPage.tsx
│       │   │   ├── LoginPage.tsx
│       │   │   ├── DashboardPage.tsx
│       │   │   ├── CreateQuizPage.tsx
│       │   │   ├── CreateMaterialPage.tsx
│       │   │   ├── MaterialsPage.tsx
│       │   │   ├── TakeQuizPage.tsx
│       │   │   ├── TakeMaterialPage.tsx
│       │   │   ├── MonitorQuizPage.tsx
│       │   │   ├── EssayGraderPage.tsx
│       │   │   ├── GradebookPage.tsx
│       │   │   ├── DocumentPage.tsx
│       │   │   └── AboutPage.tsx
│       │   ├── context/
│       │   │   └── AuthContext.tsx
│       │   └── lib/
│       │       ├── trpc.ts        # tRPC client
│       │       ├── supabase.ts    # Supabase browser client
│       │       └── utils.ts
│       ├── public/
│       │   ├── favicon.svg        # Favicon lingkaran biru "S"
│       │   └── icons.svg
│       ├── index.html
│       ├── Dockerfile
│       ├── nginx.conf
│       ├── package.json
│       └── vite.config.ts
│
├── packages/
│   └── shared/                   # Tipe dan Zod schema bersama
│       └── src/
│           └── index.ts          # createQuizSchema, submitAnswerSchema, dll.
│
├── supabase/
│   └── migrations/               # SQL migrations (dijalankan manual di Supabase)
│       ├── 20260926000000_init.sql           # Core tables: profiles, quizzes, questions, answers
│       ├── 20260926000001_documents.sql      # Tabel documents
│       ├── 20260926000002_student_grades.sql # Tabel student_grades
│       └── 20260926000003_materials.sql      # Tabel materials + CASCADE constraints
│
├── schema.sql                    # Schema referensi lengkap (gabungan)
├── docker-compose.yml
├── .github/
│   └── workflows/
│       └── ci.yml                # CI/CD pipeline
├── package.json                  # Root workspace
├── tsconfig.base.json
├── eslint.config.js
├── .prettierrc
└── PLAN.md
```

---

## Prasyarat

- **Node.js** v22 atau lebih baru
- **npm** v10 atau lebih baru
- Akun **Supabase** (gratis di [supabase.com](https://supabase.com))
- Akses ke **LLM API** yang kompatibel OpenAI (Ollama lokal, atau layanan lain)
- **Docker** dan **Docker Compose** (opsional, untuk deployment)

---

## Instalasi & Menjalankan Lokal

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/<username>/formatiflive.git
cd formatiflive
npm ci
```

### 2. Buat File Environment

**Server** — buat file `apps/server/.env`:

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
PORT=3002
OMNIROUTE_API_KEY=<your-llm-api-key>
OMNIROUTE_BASE_URL=http://localhost:11434/v1
```

**Web** — buat file `apps/web/.env.local`:

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_TRPC_URL=http://localhost:3002/trpc
```

> **Catatan:** `SUPABASE_SERVICE_ROLE_KEY` digunakan hanya di server (bypass RLS). `VITE_SUPABASE_ANON_KEY` adalah kunci publik yang aman digunakan di browser.

### 3. Setup Database

Buka **Supabase Dashboard → SQL Editor** dan jalankan file-file berikut secara berurutan:

```
1. supabase/migrations/20260926000000_init.sql
2. supabase/migrations/20260926000001_documents.sql
3. supabase/migrations/20260926000002_student_grades.sql
4. supabase/migrations/20260926000003_materials.sql
```

Atau jalankan `schema.sql` sekaligus untuk setup penuh dalam satu langkah.

> Pastikan juga **Supabase Realtime** diaktifkan untuk tabel `answers` di Dashboard → Database → Replication.

### 4. Build Shared Package

```bash
npm run build --workspace=packages/shared
```

### 5. Jalankan Dev Server

```bash
npm run dev
```

Perintah ini menjalankan dua proses secara bersamaan:
- **Frontend** (React/Vite): `http://localhost:5173`
- **Backend** (tRPC): `http://localhost:3002`

### Skrip yang Tersedia

| Perintah | Deskripsi |
|---|---|
| `npm run dev` | Jalankan web + server bersamaan (development) |
| `npm run build` | Build lengkap: shared → server → web |
| `npm run test` | Jalankan unit test server (Vitest) |
| `npm run lint` | ESLint seluruh workspace |
| `npm run preview` | Preview build produksi web |

---

## Environment Variables

### Server (`apps/server/.env`)

| Variabel | Wajib | Default | Deskripsi |
|---|---|---|---|
| `SUPABASE_URL` | ✅ | — | URL project Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | — | Service role key (server-side, bypass RLS) |
| `PORT` | ❌ | `3002` | Port HTTP server |
| `OMNIROUTE_API_KEY` | ✅ | — | API key untuk LLM endpoint |
| `OMNIROUTE_BASE_URL` | ❌ | `http://10.0.10.223:20128/v1` | Base URL LLM API (OpenAI-compatible) |

### Web (`apps/web/.env.local`)

| Variabel | Wajib | Default | Deskripsi |
|---|---|---|---|
| `VITE_SUPABASE_URL` | ✅ | — | URL project Supabase (sama dengan server) |
| `VITE_SUPABASE_ANON_KEY` | ✅ | — | Anon/public key Supabase (aman di browser) |
| `VITE_TRPC_URL` | ❌ | `/trpc` | URL tRPC server (default untuk nginx proxy) |

> Di production dengan Docker, `VITE_TRPC_URL` tidak perlu di-set karena nginx mem-proxy `/trpc` ke container server secara otomatis.

---

## Database — Setup Supabase

### Membuat Project Baru

1. Buka [app.supabase.com](https://app.supabase.com) → New Project
2. Catat **Project URL** dan dua kunci: **anon key** (untuk browser) dan **service_role key** (untuk server)
3. Buka **SQL Editor** dan jalankan migrations secara berurutan (lihat langkah 3 di atas)

### Konfigurasi Realtime

Buka **Dashboard → Database → Replication** dan pastikan tabel `answers` terdaftar di `supabase_realtime` publication. Migrasi `20260926000000_init.sql` sudah menyertakan perintah ini, tapi verifikasi manual disarankan.

### Konfigurasi Auth

Buka **Authentication → Providers**:
- **Email**: aktifkan
- **Google** (opsional): aktifkan, isi Client ID dan Secret dari Google Cloud Console

---

## Skema Database

Semai menggunakan 7 tabel di PostgreSQL dengan Row Level Security (RLS) aktif di semua tabel.

### Diagram Relasi

```
auth.users
    │
    └── profiles (1:1, via trigger)
            │
            ├── quizzes (1:N)
            │       │
            │       ├── questions (1:N)
            │       │       │
            │       │       └── answers (1:N) ◄── siswa submit (no login)
            │       │
            │       └── answers (1:N) ◄── juga FK langsung ke quiz
            │
            ├── documents (1:N)
            ├── materials (1:N)
            └── student_grades (1:N)
```

### Tabel: `profiles`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK | = `auth.users.id` |
| `email` | TEXT | |
| `name` | TEXT | |
| `role` | TEXT | default: `teacher` |
| `created_at` | TIMESTAMPTZ | |

Auto-dibuat via trigger `on_auth_user_created` saat user baru mendaftar.

### Tabel: `quizzes`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK | |
| `teacher_id` | UUID FK | → `profiles.id` ON DELETE CASCADE |
| `title` | TEXT | |
| `subject` | TEXT | |
| `grade_level` | TEXT | |
| `code` | TEXT UNIQUE | Kode 6 karakter (A–Z, 2–9) untuk siswa |
| `created_at` | TIMESTAMPTZ | |

### Tabel: `questions`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK | |
| `quiz_id` | UUID FK | → `quizzes.id` ON DELETE CASCADE |
| `text` | TEXT | Teks soal |
| `options` | JSONB | Array 4 string pilihan jawaban |
| `correct_index` | INT | 0–3, CHECK constraint |
| `order` | INT | Urutan tampil |
| `created_at` | TIMESTAMPTZ | |

### Tabel: `answers`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK | |
| `quiz_id` | UUID FK | → `quizzes.id` ON DELETE CASCADE |
| `question_id` | UUID FK | → `questions.id` ON DELETE CASCADE |
| `student_name` | TEXT | Tidak perlu login, cukup nama |
| `selected_index` | INT | 0–3 |
| `is_correct` | BOOLEAN | Dihitung server saat submit |
| `submitted_at` | TIMESTAMPTZ | |

> Tabel ini diaktifkan di Supabase Realtime untuk live monitoring kuis.

### Tabel: `documents`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK | |
| `teacher_id` | UUID FK | → `profiles.id` ON DELETE CASCADE |
| `title` | TEXT | |
| `type` | TEXT | `materi` atau `tugas` |
| `subject` | TEXT | |
| `grade_level` | TEXT | |
| `content` | TEXT | Isi dokumen |
| `created_at` | TIMESTAMPTZ | |

### Tabel: `student_grades`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK | |
| `teacher_id` | UUID FK | → `profiles.id` ON DELETE CASCADE |
| `student_name` | TEXT | |
| `source_type` | TEXT | `KUIS`, `ESAI`, `UNJUK_KERJA`, atau `P5` |
| `source_id` | UUID | FK opsional → `quizzes.id` |
| `title` | TEXT | Deskripsi penilaian |
| `score` | NUMERIC(5,2) | |
| `max_score` | NUMERIC(5,2) | default 100 |
| `feedback` | TEXT | Catatan guru / AI |
| `created_at` | TIMESTAMPTZ | |

Diisi otomatis dari: submit kuis, koreksi esai, dan input manual guru.

### Tabel: `materials`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK | |
| `teacher_id` | UUID FK | → `profiles.id` ON DELETE CASCADE |
| `title` | TEXT | |
| `subject` | TEXT | |
| `grade_level` | TEXT | |
| `content` | JSONB | `{summary, keyPoints[], explanation, interactiveActivity}` |
| `created_at` | TIMESTAMPTZ | |

Bisa dibaca publik tanpa auth (policy `SELECT: true`) — siswa langsung akses.

### RLS Policies

| Tabel | Policy |
|---|---|
| `profiles` | SELECT + UPDATE: pemilik sendiri (`auth.uid() = id`) |
| `quizzes` | ALL: pemilik; SELECT: siapapun (untuk lookup kode) |
| `questions` | ALL: pemilik via quiz; SELECT: siapapun |
| `answers` | INSERT: siapapun (siswa tanpa login); SELECT: pemilik via quiz |
| `documents` | ALL: pemilik (`auth.uid() = teacher_id`) |
| `student_grades` | ALL: pemilik (`auth.uid() = teacher_id`) |
| `materials` | SELECT + INSERT + DELETE: siapapun (open untuk MVP) |

---

## API Reference (tRPC)

Semua endpoint berada di `/trpc` menggunakan HTTP batch. Client menggunakan `@trpc/client` + `@trpc/react-query`.

### `health`

| Prosedur | Tipe | Input | Output |
|---|---|---|---|
| `health.ping` | query | — | `{ok: true, timestamp: string}` |

### `quiz`

| Prosedur | Tipe | Input | Output |
|---|---|---|---|
| `quiz.create` | mutation | `{teacherId, title, subject, gradeLevel, questions[]}` | `{quiz, questions}` |
| `quiz.getByCode` | query | `{code: string}` | `{quiz, questions[]}` |
| `quiz.submitAnswers` | mutation | `{quizCode, studentName, answers[{questionId, selectedIndex}]}` | `{score, correctCount, totalQuestions}` |
| `quiz.getProgress` | query | `{quizId}` | `{quiz, totalStudents, totalSubmissions, questions[stats]}` |
| `quiz.listByTeacher` | query | `{teacherId}` | `QuizRow[]` dengan `totalQuestions` dan `totalStudents` |
| `quiz.generateWithAI` | mutation | `{prompt, numQuestions?: 1–20}` | `{title, subject, gradeLevel, questions[]}` |
| `quiz.update` | mutation | `{quizId, title?, subject?, gradeLevel?, code?}` | Quiz yang diupdate |
| `quiz.delete` | mutation | `{quizId}` | `{deleted: true}` |

### `material`

| Prosedur | Tipe | Input | Output |
|---|---|---|---|
| `material.generate` | mutation | `{teacherId, topic}` | Material yang tersimpan (termasuk `content` JSONB) |
| `material.listByTeacher` | query | `{teacherId}` | `Material[]` |
| `material.listShared` | query | — | `{id, title, subject, grade_level, created_at}[]` (public) |
| `material.getById` | query | `{materialId}` | Material lengkap dengan `content` |
| `material.delete` | mutation | `{materialId}` | `{deleted: true}` |

### `essay`

| Prosedur | Tipe | Input | Output |
|---|---|---|---|
| `essay.evaluate` | mutation | `{question, rubricOrKey, studentAnswer, studentName?, teacherId?}` | `{score, maxScore, feedback, strengths[], improvements[], suggestedCorrection}` |

> Jika `teacherId` dan `studentName` diberikan, hasil evaluasi otomatis tersimpan ke `student_grades`.

### `document`

| Prosedur | Tipe | Input | Output |
|---|---|---|---|
| `document.create` | mutation | `{teacherId, title, type: 'materi'|'tugas', subject, gradeLevel, content}` | Document tersimpan |
| `document.listByTeacher` | query | `{teacherId}` | `Document[]` |
| `document.delete` | mutation | `{id, teacherId}` | `{success: true}` |

### `agent`

| Prosedur | Tipe | Input | Output |
|---|---|---|---|
| `agent.executeCommand` | mutation | `{command: string}` | `{actionType, title, summary, details, suggestedTargetUrl, actionPayload?}` |

`actionType` bisa berupa: `CREATE_QUIZ`, `CREATE_MATERIAL`, `ADVISE`, atau `DOCU_NOTE`.

### `gradebook`

| Prosedur | Tipe | Input | Output |
|---|---|---|---|
| `gradebook.record` | mutation | `{teacherId, studentName, sourceType, title, score, maxScore?, feedback?}` | Grade tersimpan |
| `gradebook.listByTeacher` | query | `{teacherId}` | `{allGrades[], students[{studentName, gradesCount, avgScore, grades[]}]}` |
| `gradebook.generateReportDigest` | mutation | `{teacherId, studentName}` | `{studentName, overallScore, gradeCategory, holisticNarrative, strengths[], recommendations[]}` |
| `gradebook.deleteGrade` | mutation | `{gradeId}` | `{deleted: true}` |

---

## WebSocket Real-time

Server membuka WebSocket di `ws://<host>/ws`.

### Protokol Pesan

**Client → Server (subscribe):**
```json
{ "type": "subscribe", "quizId": "<uuid>" }
```

**Server → Client (konfirmasi):**
```json
{ "type": "subscribed", "quizId": "<uuid>" }
```

**Server → Client (snapshot awal):**
```json
{ "type": "snapshot", "quizId": "<uuid>", "answers": [...] }
```

**Server → Client (update real-time):**
```json
{
  "type": "update",
  "payload": {
    "type": "new_submission",
    "studentName": "Ahmad Rizky",
    "answers": [...],
    "timestamp": "2026-09-26T10:30:00Z"
  }
}
```

Monitor kuis (`/monitor/:id`) juga menggunakan **Supabase Realtime** sebagai fallback — subscribe ke perubahan tabel `answers` untuk refetch data terbaru.

---

## Integrasi LLM / AI

Semua panggilan AI dilakukan **server-side** di `apps/server/src/lib/llm.ts`. Client frontend tidak pernah berkomunikasi langsung dengan LLM.

### Konfigurasi

| Env Var | Deskripsi |
|---|---|
| `OMNIROUTE_API_KEY` | API key LLM |
| `OMNIROUTE_BASE_URL` | Base URL LLM (format OpenAI-compatible: `http://host/v1`) |

Sistem menggunakan model `"agent"` dengan format request identik OpenAI Chat Completions API. Kompatibel dengan:
- **Ollama** (lokal): `OMNIROUTE_BASE_URL=http://localhost:11434/v1`
- **OmniRoute** atau proxy OpenAI-compatible lainnya
- **OpenAI** langsung: `OMNIROUTE_BASE_URL=https://api.openai.com/v1`, `OMNIROUTE_API_KEY=sk-...`

### Fungsi LLM

| Fungsi | Model Behavior | Temperature |
|---|---|---|
| `generateQuizWithLLM(prompt, n)` | Generate N soal pilihan ganda dalam JSON | 0.7 |
| `generateMaterialWithLLM(topic)` | Buat bahan ajar terstruktur dalam JSON | 0.7 |
| `evaluateEssayWithLLM({question, rubric, answer})` | Nilai esai 0–100 dengan feedback | 0.5 |
| `runAgentCommandWithLLM(command)` | Parse natural language → action type | 0.6 |
| `generateStudentHolisticReportWithLLM({name, grades})` | Narasi rapor Kurikulum Merdeka | 0.6 |

Semua fungsi mengembalikan JSON murni. Server mem-parse dan memvalidasi output sebelum mengembalikan ke client.

---

## Halaman & Routing Frontend

### Halaman Publik (Tanpa Login)

| Path | Komponen | Deskripsi |
|---|---|---|
| `/` | `LandingPage` | Hero, portal siswa (kuis + materi), penjelasan fitur |
| `/tentang` | `AboutPage` | Latar belakang dan misi Semai |
| `/login` | `LoginPage` | Email/password + Google OAuth |
| `/quiz` | `TakeQuizPage` | Form input kode kuis + nama siswa |
| `/quiz/:code` | `TakeQuizPage` | Langsung masuk kuis dengan kode dari URL |
| `/materi` | `TakeMaterialPage` | Daftar semua materi yang dibagikan guru |

### Halaman Dashboard (Login Diperlukan)

| Path | Komponen | Deskripsi |
|---|---|---|
| `/dashboard` | `DashboardPage` | Ringkasan metrik, AI agent, daftar kuis |
| `/create` | `CreateQuizPage` | Buat kuis manual atau generate AI |
| `/material` | `CreateMaterialPage` | Generate materi ajar + preview + share link |
| `/materials` | `MaterialsPage` | Arsip semua materi yang dibuat |
| `/essay` | `EssayGraderPage` | Koreksi jawaban esai siswa |
| `/documents` | `DocumentPage` | Arsip dokumen materi/tugas |
| `/gradebook` | `GradebookPage` | Rekap nilai + generate narasi rapor |
| `/monitor/:id` | `MonitorQuizPage` | Live monitoring per-soal kuis aktif |

### Navigasi Sidebar Dashboard

```
Ringkasan          → /dashboard
Kuis Formatif      → /create
Generator Materi   → /material
Materi Siswa       → /materials
Koreksi Esai AI    → /essay
Arsip Dokumentasi  → /documents
Gradebook & Rapor  → /gradebook
```

Sidebar otomatis kolaps menjadi drawer overlay di layar mobile (<768px), dengan backdrop klik-tutup dan `inert` attribute pada main content untuk aksesibilitas.

---

## Menjalankan dengan Docker

### Build & Run

```bash
# Build dan jalankan semua service
docker compose up --build

# Atau jalankan di background
docker compose up --build -d
```

| Service | Port | Deskripsi |
|---|---|---|
| `web` | `3000` | Frontend (nginx serve static + proxy /trpc) |
| `server` | `3002` | tRPC backend + WebSocket |

Akses: `http://localhost:3000`

### `docker-compose.yml` — Konfigurasi

```yaml
services:
  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
      args:                         # VITE_ vars di-bake saat build
        VITE_SUPABASE_URL: ...
        VITE_SUPABASE_ANON_KEY: ...
    ports:
      - "3000:80"
    depends_on:
      - server

  server:
    build:
      context: .
      dockerfile: apps/server/Dockerfile
    environment:                    # Runtime env vars
      PORT: "3002"
      SUPABASE_URL: ...
      SUPABASE_SERVICE_ROLE_KEY: ...
```

> **Penting:** Ubah nilai-nilai secret di `docker-compose.yml` sebelum deploy ke production. Gunakan file `.env` terpisah atau secrets manager.

### Dockerfile

**Web** (`apps/web/Dockerfile`): Multi-stage build
1. Stage `build`: Node 22 Alpine, install deps, build Vite
2. Stage `production`: nginx Alpine, copy static dist, apply `nginx.conf`

**Server** (`apps/server/Dockerfile`): Multi-stage build
1. Stage `build`: Node 22 Alpine, install deps, compile TypeScript
2. Stage `production`: Node 22 Alpine slim, copy dist, jalankan `node dist/index.js`

---

## CI/CD

GitHub Actions workflow di `.github/workflows/ci.yml` berjalan pada setiap push dan pull request ke branch `main`.

### Jobs

```
push/PR to main
      │
      ▼
  ┌──────────┐
  │   test   │  npm ci → vitest --coverage → assert >80% statement coverage
  └────┬─────┘
       │
       ▼
  ┌──────────┐
  │  build   │  build shared → server → web → upload artifacts
  └────┬─────┘
       │
       ▼
  ┌──────────┐
  │  docker  │  docker buildx build (web + server, no push) — validasi image
  └──────────┘
```

### Detail Jobs

**Job `test`:**
- Jalankan `npm ci` (cache npm)
- `npm run test --workspace=apps/server -- --coverage`
- Upload coverage report sebagai artifact
- Assert statement coverage ≥ 80% (script Node inline)

**Job `build`** (butuh `test` lulus):
- Build `packages/shared` → `apps/server` → `apps/web`
- Upload `apps/server/dist` + `apps/web/dist` sebagai artifact

**Job `docker`** (butuh `build` lulus):
- `docker buildx build` untuk image web dan server
- Menggunakan GitHub Actions cache (`type=gha`) untuk mempercepat build
- Tidak push ke registry (validasi build saja)

---

## Testing

### Menjalankan Tests

```bash
# Semua tests sekali jalan
npm run test

# Watch mode
npm run test --workspace=apps/server -- --watch

# Dengan coverage report
npm run test --workspace=apps/server -- --coverage
```

Coverage report HTML tersedia di `apps/server/coverage/index.html` setelah dijalankan.

### Cakupan Test

Tests berada di `apps/server/test/` mencakup:

| File | Deskripsi |
|---|---|
| `router.test.ts` | Unit test prosedur tRPC router |
| `routes.test.ts` | Integration test semua routes |
| `quiz.test.ts` | Test logika quiz: create, getByCode, submitAnswers, scoring |
| `errors.test.ts` | Test error handling dan validasi input |
| `supabase.test.ts` | Test Supabase client setup |
| `ws-broadcast.test.ts` | Test WebSocket broadcast logic |

Target coverage: **≥ 80% statement coverage** (di-enforce di CI).

---

## Keputusan Arsitektur

### Monorepo npm Workspaces
Satu repository, satu pipeline CI/CD, shared types antara frontend dan backend tanpa duplikasi. Package `packages/shared` berisi Zod schemas yang digunakan di kedua sisi — perubahan validasi di satu tempat langsung berlaku di mana-mana.

### tRPC (bukan REST)
Type-safety end-to-end tanpa code generation. Frontend tahu persis shape data dari backend saat development (TypeScript inference). Error handling dan input validation built-in via Zod. Tidak perlu OpenAPI spec, Swagger, atau maintena manual interface.

### Supabase sebagai Platform Tunggal
Satu layanan yang mengcover tiga kebutuhan berbeda: PostgreSQL (persistensi), Auth (autentikasi email + OAuth), dan Realtime (live monitoring kuis). Mengurangi jumlah service yang harus di-manage.

### Service Role Key di Server, Anon Key di Browser
Server menggunakan `SUPABASE_SERVICE_ROLE_KEY` yang bypass RLS — memungkinkan operasi lintas user seperti menyimpan nilai siswa dari server setelah quiz. Browser menggunakan `VITE_SUPABASE_ANON_KEY` yang tunduk pada RLS — hanya untuk auth flow. Data sensitif tidak pernah di-expose ke client.

### Siswa Tanpa Akun
Siswa mengakses kuis hanya dengan kode 6 karakter + nama. Tidak perlu registrasi, tidak perlu install app. Friction minimum → partisipasi maksimum. RLS pada tabel `answers` memungkinkan INSERT tanpa auth.

### Semua LLM Calls di Server
Panggilan ke LLM API hanya terjadi di `apps/server/src/lib/llm.ts`. API key tidak pernah dikirim ke browser. Data jawaban siswa tidak keluar dari server ke third-party. Privasi-by-design.

### WebSocket untuk Live Monitoring
Guru tidak perlu refresh halaman untuk melihat siswa baru yang submit. Server broadcast update ke semua client yang subscribe ke quiz ID tersebut. Supabase Realtime digunakan sebagai secondary mechanism untuk konsistensi data.

### Auto-Gradebook Integration
Setiap submit kuis dan evaluasi esai secara otomatis menulis ke `student_grades`. Guru tidak perlu input nilai manual untuk aktivitas yang sudah terintegrasi — data terkumpul passively.

---

## Kontribusi

1. Fork repository ini
2. Buat branch baru: `git checkout -b feature/nama-fitur`
3. Pastikan tests lulus: `npm run test`
4. Pastikan linting bersih: `npm run lint`
5. Commit dengan pesan deskriptif
6. Buat Pull Request ke branch `main`

### Konvensi

- **Bahasa kode:** TypeScript strict
- **Formatter:** Prettier (config di `.prettierrc`)
- **Linter:** ESLint (config di `eslint.config.js`)
- **Commit messages:** Bahasa Indonesia atau Inggris, format imperatif
- **Branch naming:** `feature/`, `fix/`, `chore/`, `docs/`

---

## Lisensi

Proyek ini dibuat sebagai submission hackathon. Hak cipta © 2026 Romi.

---

*Semai — Menyemai generasi, mengefisiensi profesi.*
