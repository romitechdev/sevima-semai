export async function generateQuizWithLLM(promptOrMaterial: string): Promise<{
  title: string;
  subject: string;
  gradeLevel: string;
  questions: Array<{
    text: string;
    options: [string, string, string, string];
    correctIndex: number;
  }>;
}> {
  const apiKey = process.env.OMNIROUTE_API_KEY || "sk-1a2610a1aca72e66-2f1f9d-f1fd9906";
  const baseUrl = process.env.OMNIROUTE_BASE_URL || "http://10.0.10.223:20128/v1";

  const systemPrompt = `Kamu adalah asisten AI guru profesional Indonesia. Tugasmu adalah membuat kuis formatif 5 soal pilihan ganda berdasarkan materi/prompt yang diberikan.

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
    },
    ... (total persis 5 soal)
  ]
}

Aturan:
1. "questions" harus berisi tepat 5 soal.
2. "options" harus berisi tepat 4 pilihan jawaban string.
3. "correctIndex" adalah angka 0, 1, 2, atau 3 (posisi pilihan yang benar).
4. Gunakan Bahasa Indonesia yang jelas dan baku.`;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "agent",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Buatkan 5 soal kuis dari materi/prompt berikut:\n\n${promptOrMaterial}` },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`LLM API Error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as any;
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Respon AI kosong");
  }

  const cleanJson = content.replace(/```json/g, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(cleanJson);

  return parsed;
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
  const apiKey = process.env.OMNIROUTE_API_KEY || "sk-1a2610a1aca72e66-2f1f9d-f1fd9906";
  const baseUrl = process.env.OMNIROUTE_BASE_URL || "http://10.0.10.223:20128/v1";

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

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "agent",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Buatkan bahan/materi ajar lengkap untuk topik berikut:\n\n${prompt}` },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`LLM API Error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as any;
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Respon AI kosong");
  }

  const cleanJson = content.replace(/```json/g, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(cleanJson);

  return parsed;
}
