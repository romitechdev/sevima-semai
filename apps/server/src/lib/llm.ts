export function llmErrorMessage(prefix: string, err: any): { code: "INTERNAL_SERVER_ERROR" | "SERVICE_UNAVAILABLE"; message: string } {
  const msg = err?.message || "";
  const isServiceUnavailable =
    msg.includes("503") ||
    msg.includes("temporarily unavailable") ||
    msg.includes("quota-exhausted") ||
    msg.includes("ALL_TARGETS_SKIPPED") ||
    msg.includes("service_unavailable") ||
    msg.includes("429") ||
    msg.includes("rate limit");
  if (isServiceUnavailable) {
    return { code: "SERVICE_UNAVAILABLE", message: "AI sedang sibuk, coba beberapa saat lagi." };
  }
  return { code: "INTERNAL_SERVER_ERROR", message: `${prefix}: ${msg}` };
}

async function llmFetch(url: string, body: any, apiKey: string): Promise<any> {
  const maxAttempts = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        return await response.json();
      }

      const errText = await response.text();
      lastError = new Error(`LLM API Error (${response.status}): ${errText}`);

      const isRetryable =
        response.status === 429 ||
        response.status >= 500 ||
        errText.includes("ALL_TARGETS_SKIPPED") ||
        errText.includes("quota-exhausted") ||
        errText.includes("temporarily unavailable");

      if (!isRetryable || attempt === maxAttempts) break;

      const delay = Math.min(1000 * 2 ** (attempt - 1), 10000) + Math.random() * 500;
      await new Promise((resolve) => setTimeout(resolve, delay));
    } catch (err: any) {
      lastError = new Error(`LLM network error: ${err.message}`);
      if (attempt === maxAttempts) break;
      const delay = Math.min(1000 * 2 ** (attempt - 1), 10000) + Math.random() * 500;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

function parseLlmJson(content: string, label: string): any {
  const clean = content.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(clean);
  } catch {
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(clean.slice(start, end + 1));
      } catch {
        // fall through
      }
    }
    throw new Error(`Respon AI untuk ${label} bukan JSON valid. Coba lagi.`);
  }
}

export async function generateQuizWithLLM(
  promptOrMaterial: string,
  numQuestions: number = 5
): Promise<{
  title: string;
  subject: string;
  gradeLevel: string;
  questions: Array<{
    text: string;
    options: [string, string, string, string];
    correctIndex: number;
  }>;
}> {
  const apiKey = process.env.OMNIROUTE_API_KEY;
  const baseUrl = process.env.OMNIROUTE_BASE_URL || "http://10.0.10.223:20128/v1";
  if (!apiKey) throw new Error("OMNIROUTE_API_KEY tidak diset. Pastikan .env sudah dikonfigurasi.");

  const count = Math.max(1, Math.min(20, numQuestions));

  const systemPrompt = `Kamu adalah asisten AI guru profesional Indonesia. Tugasmu adalah membuat kuis pilihan ganda berdasarkan materi/prompt yang diberikan.

Wajib kembalikan format JSON murni tanpa markdown, tanpa penjelasan tambahan.

Format JSON:
{
  "title": "Judul Kuis Singkat",
  "subject": "Mata Pelajaran (misal: IPA / Matematika / Bahasa Indonesia)",
  "gradeLevel": "Kelas / Tingkat (misal: Kelas 5 SD / Kelas 8 SMP)",
  "questions": [
    {
      "text": "Pertanyaan soal nomor 1",
      "options": ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
      "correctIndex": 0
    }
  ]
}

Aturan Penting:
1. Array "questions" HARUS berisi TEPAT ${count} soal pilihan ganda.
2. Setiap "options" harus berisi tepat 4 pilihan jawaban string.
3. "correctIndex" adalah angka 0, 1, 2, atau 3 (posisi pilihan yang benar).
4. Gunakan Bahasa Indonesia yang jelas dan baku.`;

  const data = await llmFetch(
    `${baseUrl}/chat/completions`,
    {
      model: "agent",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Buatkan TEPAT ${count} soal kuis pilihan ganda dari materi/prompt berikut:\n\n${promptOrMaterial}` },
      ],
      temperature: 0.7,
    },
    apiKey
  );

  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Respon AI kosong");
  }

  const parsed = parseLlmJson(content, "kuis");

  const questions = Array.isArray(parsed.questions)
    ? parsed.questions
        .filter((q: any) => q && typeof q.text === "string" && Array.isArray(q.options) && q.options.length === 4)
        .map((q: any, idx: number) => ({
          text: q.text,
          options: q.options.slice(0, 4).map((o: any) => String(o || "")),
          correctIndex: Number.isInteger(q.correctIndex) ? Math.min(3, Math.max(0, q.correctIndex)) : 0,
        }))
    : [];

  if (questions.length === 0) {
    throw new Error("AI tidak menghasilkan soal yang valid. Coba lagi dengan topik yang lebih jelas.");
  }

  return {
    title: typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : "Kuis Formatif",
    subject: typeof parsed.subject === "string" && parsed.subject.trim() ? parsed.subject.trim() : "",
    gradeLevel: typeof parsed.gradeLevel === "string" ? parsed.gradeLevel.trim() : "",
    questions,
  };
}

export async function generateMaterialWithLLM(prompt: string): Promise<{
  title: string;
  subject: string;
  gradeLevel: string;
  summary: string;
  keyPoints: string[];
  explanation: string;
  interactiveActivity: string;
}> {
  const apiKey = process.env.OMNIROUTE_API_KEY;
  const baseUrl = process.env.OMNIROUTE_BASE_URL || "http://10.0.10.223:20128/v1";
  if (!apiKey) throw new Error("OMNIROUTE_API_KEY tidak diset. Pastikan .env sudah dikonfigurasi.");

  const systemPrompt = `Kamu adalah asisten AI kurikulum & penyusun materi pembelajaran interaktif untuk guru di Indonesia. Tugasmu adalah menyusun ringkasan materi ajar yang terstruktur, mudah dipahami siswa, dan siap diajarkan di kelas.

Wajib kembalikan format JSON murni tanpa markdown wrapper, tanpa teks tambahan sebelum/sesudah JSON.

Format JSON:
{
  "title": "Judul Materi Pembelajaran",
  "subject": "Mata Pelajaran",
  "gradeLevel": "Target Kelas/Tingkat",
  "summary": "Ringkasan materi 2-3 kalimat yang menarik",
  "keyPoints": [
    "Poin kunci 1",
    "Poin kunci 2",
    "Poin kunci 3",
    "Poin kunci 4"
  ],
  "explanation": "Penjelasan materi yang terstruktur (dapat terdiri dari beberapa paragraf ringkas)",
  "interactiveActivity": "Ide kegiatan interaktif / diskusi singkat 5 menit di kelas"
}

Gunakan Bahasa Indonesia yang komunikatif, baku, dan sesuai dengan pendekatan Kurikulum Merdeka / Pembelajaran Aktif.`;

  const data = await llmFetch(
    `${baseUrl}/chat/completions`,
    {
      model: "agent",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Buatkan bahan/materi ajar lengkap untuk topik berikut:\n\n${prompt}` },
      ],
      temperature: 0.7,
    },
    apiKey
  );

  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Respon AI kosong");
  }

  const parsed = parseLlmJson(content, "materi");
  return parsed;
}

export async function evaluateEssayWithLLM(input: {
  question: string;
  rubricOrKey: string;
  studentAnswer: string;
}): Promise<{
  score: number;
  maxScore: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  suggestedCorrection: string;
}> {
  const apiKey = process.env.OMNIROUTE_API_KEY;
  const baseUrl = process.env.OMNIROUTE_BASE_URL || "http://10.0.10.223:20128/v1";
  if (!apiKey) throw new Error("OMNIROUTE_API_KEY tidak diset. Pastikan .env sudah dikonfigurasi.");

  const systemPrompt = `Kamu adalah asisten AI penilai esai & jawaban teks guru di Indonesia. Tugasmu adalah menilai jawaban esai siswa secara obyektif berdasarkan soal dan kunci jawaban/rubrik yang diberikan.

Wajib kembalikan format JSON murni tanpa markdown wrapper, tanpa teks tambahan sebelum/sesudah JSON.

Format JSON:
{
  "score": 85,
  "maxScore": 100,
  "feedback": "Ulasan singkat dan konstruktif tentang jawaban siswa",
  "strengths": [
    "Kelebihan jawaban 1",
    "Kelebihan jawaban 2"
  ],
  "improvements": [
    "Hal yang perlu ditingkatkan 1"
  ],
  "suggestedCorrection": "Saran perbaikan kalimat / jawaban ideal yang lebih akurat"
}

Gunakan Bahasa Indonesia yang ramah, profesional, dan mendukung pembelajaran siswa.`;

  const userPrompt = `Soal: ${input.question}
Kunci Jawaban / Rubrik Penilaian: ${input.rubricOrKey}
Jawaban Siswa: ${input.studentAnswer}

Berikan penilaian, skor 0-100, ulasan, kelebihan, kekurangan, dan jawaban perbaikan.`;

  const data = await llmFetch(
    `${baseUrl}/chat/completions`,
    {
      model: "agent",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
    },
    apiKey
  );

  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Respon AI kosong");
  }

  const parsed = parseLlmJson(content, "esai");
  return parsed;
}

export async function runAgentCommandWithLLM(command: string): Promise<{
  actionType: "CREATE_QUIZ" | "CREATE_MATERIAL" | "ADVISE" | "DOCU_NOTE";
  title: string;
  summary: string;
  details: string;
  suggestedTargetUrl: string;
  actionPayload?: any;
}> {
  const apiKey = process.env.OMNIROUTE_API_KEY;
  const baseUrl = process.env.OMNIROUTE_BASE_URL || "http://10.0.10.223:20128/v1";
  if (!apiKey) throw new Error("OMNIROUTE_API_KEY tidak diset. Pastikan .env sudah dikonfigurasi.");

  const systemPrompt = `Kamu adalah Semai Agent OS — AI Orchestrator & Asisten Pintar Guru Indonesia.
Tugasmu adalah menganalisis instruksi/perintah guru dan menentukan tindakan terbaik yang harus diambil oleh platform Semai, LALU mengekstrak semua detail dari perintah guru ke dalam actionPayload agar modul terkait bisa langsung terisi otomatis.

Wajib kembalikan format JSON murni tanpa markdown wrapper.

Format JSON:
{
  "actionType": "CREATE_QUIZ" | "CREATE_MATERIAL" | "ADVISE" | "DOCU_NOTE",
  "title": "Judul Hasil Tindakan Agent (singkat, maks 8 kata)",
  "summary": "Ringkasan tindakan yang diambil Agent 1-2 kalimat",
  "details": "Detail saran / materi / rekomendasi instruksional untuk guru",
  "suggestedTargetUrl": "/create" atau "/material" atau "/documents" atau "/dashboard",
  "actionPayload": { ... }
}

Struktur actionPayload per actionType:

CREATE_QUIZ (target /create):
{
  "topic": "topik kuis yang diekstrak dari perintah guru",
  "promptText": "teks prompt lengkap siap pakai untuk generator kuis AI, termasuk konteks topik dan target kelas",
  "numQuestions": 5,
  "subject": "mata pelajaran (misal: IPA, Matematika, Bahasa Indonesia)",
  "gradeLevel": "target kelas (misal: Kelas 5 SD, Kelas 8 SMP)"
}
- numQuestions: angka 1-20. Ambil dari perintah guru jika disebut (misal "5 soal" = 5), default 5.
- promptText harus cukup detail agar generator AI langsung bisa membuat soal tanpa input tambahan.

CREATE_MATERIAL (target /material):
{
  "topic": "topik materi yang diekstrak dari perintah guru, termasuk target kelas jika disebut",
  "subject": "mata pelajaran",
  "gradeLevel": "target kelas"
}
- topic harus spesifik dan siap dipakai langsung di form materi.

DOCU_NOTE (target /documents):
{
  "title": "judul dokumen arsip",
  "type": "materi" atau "tugas",
  "subject": "mata pelajaran",
  "gradeLevel": "target kelas",
  "content": "isi dokumen / rincian instruksi tugas lengkap"
}
- type: "tugas" jika guru menyebut tugas/penugasan/PR, "materi" jika dokumentasi materi.
- content: tulis lengkap berdasarkan perintah guru, bukan ringkasan.

ADVISE (target /dashboard):
{
  "topic": "topik saran yang diekstrak"
}

Aturan ekstraksi:
1. Ambil SEMUA detail yang disebut guru: topik, jumlah soal, kelas, mata pelajaran.
2. Jika guru menyebut angka soal ("5 soal", "10 pertanyaan"), ekstrak ke numQuestions.
3. Jika guru menyebut kelas ("kelas 5 SD", "kelas 8 SMP"), ekstrak ke gradeLevel.
4. Jika guru menyebut mapel ("IPA", "Matematika"), ekstrak ke subject.
5. Jika detail tidak disebut, biarkan field kosong string "" atau null, JANGAN mengarang.
6. promptText untuk CREATE_QUIZ harus menggabungkan topik + konteks kelas + mapel jadi satu kalimat prompt yang lengkap.

Panduan actionType:
- CREATE_QUIZ: jika guru ingin membuat soal/kuis (target: /create)
- CREATE_MATERIAL: jika guru ingin bahan ajar/rangkuman materi (target: /material)
- ADVISE: jika guru minta ide ice breaking, strategi kelas, remedial, atau saran mengajar (target: /dashboard)
- DOCU_NOTE: jika guru ingin mengarsipkan instruksi, tugas, PR, atau dokumentasi (target: /documents)`;

  const data = await llmFetch(
    `${baseUrl}/chat/completions`,
    {
      model: "agent",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Perintah Guru: "${command}"` },
      ],
      temperature: 0.6,
    },
    apiKey
  );

  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Respon Agent AI kosong");
  }

  const parsed = parseLlmJson(content, "agent");
  return parsed;
}

export async function generateStudentHolisticReportWithLLM(input: {
  studentName: string;
  grades: Array<{
    source_type: string;
    title: string;
    score: number;
    max_score: number;
    feedback?: string;
  }>;
}): Promise<{
  studentName: string;
  overallScore: number;
  gradeCategory: string;
  holisticNarrative: string;
  strengths: string[];
  recommendations: string[];
}> {
  const apiKey = process.env.OMNIROUTE_API_KEY;
  const baseUrl = process.env.OMNIROUTE_BASE_URL || "http://10.0.10.223:20128/v1";
  if (!apiKey) throw new Error("OMNIROUTE_API_KEY tidak diset. Pastikan .env sudah dikonfigurasi.");

  const systemPrompt = `Kamu adalah Asisten AI Wali Kelas Kurikulum Merdeka Indonesia. Tugasmu adalah menganalisis seluruh rekap nilai siswa (Kuis, Esai, Penilaian Khusus P5) dan menyusun Narasi Rapor Perkembangan Siswa secara terpadu dan holistik.

Wajib kembalikan format JSON murni tanpa markdown wrapper.

Format JSON:
{
  "studentName": "Nama Siswa",
  "overallScore": 88.5,
  "gradeCategory": "Sangat Baik" | "Baik" | "Cukup" | "Perlu Bimbingan",
  "holisticNarrative": "Paragraf narasi rapor resmi Kurikulum Merdeka (3-4 kalimat deskriptif perkembangan karakter & kognitif)",
  "strengths": ["Poin keunggulan 1", "Poin keunggulan 2"],
  "recommendations": ["Rekomendasi tindak lanjut 1", "Rekomendasi tindak lanjut 2"]
}`;

  const gradesSummary = input.grades
    .map((g) => `- ${g.source_type} (${g.title}): Nilai ${g.score}/${g.max_score} (${g.feedback || "tanpa catatan"})`)
    .join("\n");

  const userPrompt = `Nama Siswa: ${input.studentName}\nRekap Nilai Terintegrasi:\n${gradesSummary}`;

  const data = await llmFetch(
    `${baseUrl}/chat/completions`,
    {
      model: "agent",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.6,
    },
    apiKey
  );

  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Respon AI kosong");
  }

  const parsed = parseLlmJson(content, "rapor");
  return parsed;
}
