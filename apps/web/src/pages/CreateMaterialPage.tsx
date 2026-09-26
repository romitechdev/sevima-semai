import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { DashboardLayout } from "../components/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";

export const CreateMaterialPage: React.FC = () => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [generatedMaterial, setGeneratedMaterial] = useState<{
    title: string;
    subject: string;
    gradeLevel: string;
    summary: string;
    keyPoints: string[];
    explanation: string;
    interactiveActivity: string;
  } | null>(null);

  const generateMutation = trpc.material.generate.useMutation();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!topic || topic.trim().length < 3) {
      setError("Masukkan topik materi minimal 3 karakter");
      return;
    }

    try {
      const res = await generateMutation.mutateAsync({ topic });
      setGeneratedMaterial(res);
    } catch (err: any) {
      setError(err.message || "Gagal membuat materi pembelajaran");
    }
  };

  const handleCreateQuizFromMaterial = () => {
    if (!generatedMaterial) return;
    const promptText = `Judul: ${generatedMaterial.title}\nMata Pelajaran: ${generatedMaterial.subject}\nTingkat: ${generatedMaterial.gradeLevel}\nRingkasan: ${generatedMaterial.summary}\nPoin Utama: ${generatedMaterial.keyPoints.join(", ")}`;
    navigate("/create", { state: { initialPrompt: promptText } });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div>
            <h1 className="text-xl font-bold text-slate-900">AI Generator Materi Ajar</h1>
            <p className="text-slate-500 text-xs">Semai 🌱 — Menyusun Materi & Rencana Kelas Instan</p>
          </div>
          <Button variant="outline" className="text-xs rounded-xl" onClick={() => navigate("/dashboard")}>
            Batal
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-200">
            {error}
          </div>
        )}

        <Card className="border-purple-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-purple-900 flex items-center gap-2">
              <span>📚</span> Buat Bahan Ajar Otomatis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="topic">Topik atau Pokok Bahasan</Label>
                <Input
                  id="topic"
                  placeholder="Contoh: Fotosintesis & Peran Cahaya Matahari untuk Kelas 5 SD"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 font-semibold"
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? "AI Sedang Menyusun Materi..." : "Susun Materi Pembelajaran ✨"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {generatedMaterial && (
          <div className="space-y-4">
            <Card className="border-emerald-200 bg-emerald-50/20">
              <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold uppercase">
                      {generatedMaterial.subject} • {generatedMaterial.gradeLevel}
                    </span>
                  </div>
                  <CardTitle className="text-2xl font-bold text-slate-800 mt-2">
                    {generatedMaterial.title}
                  </CardTitle>
                </div>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  onClick={handleCreateQuizFromMaterial}
                >
                  🚀 Buat Kuis Formatif Dari Materi Ini
                </Button>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <div>
                  <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wide mb-1">
                    Ringkasan Singkat
                  </h3>
                  <p className="text-slate-700 text-sm leading-relaxed bg-white p-3 rounded border border-emerald-100">
                    {generatedMaterial.summary}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wide mb-2">
                    Poin-Poin Kunci (Key Takeaways)
                  </h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {generatedMaterial.keyPoints.map((pt, i) => (
                      <li key={i} className="bg-white p-3 rounded border border-slate-200 text-xs font-semibold text-slate-800 flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wide mb-1">
                    Penjelasan Materi Lengkap
                  </h3>
                  <div className="text-slate-800 text-sm leading-relaxed bg-white p-4 rounded border border-slate-200 whitespace-pre-line">
                    {generatedMaterial.explanation}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-purple-800 uppercase tracking-wide mb-1">
                    💡 Ide Aktivitas Interaktif 5 Menit di Kelas
                  </h3>
                  <div className="text-purple-950 text-sm bg-purple-50 p-3 rounded border border-purple-200">
                    {generatedMaterial.interactiveActivity}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
