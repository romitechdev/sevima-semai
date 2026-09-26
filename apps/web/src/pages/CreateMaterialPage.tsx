import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { DashboardLayout } from "../components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

export const CreateMaterialPage: React.FC = () => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [generatedMaterial, setGeneratedMaterial] = useState<{
    title: string; subject: string; gradeLevel: string; summary: string;
    keyPoints: string[]; explanation: string; interactiveActivity: string;
  } | null>(null);

  const generateMutation = trpc.material.generate.useMutation();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!topic || topic.trim().length < 3) { setError("Masukkan topik materi minimal 3 karakter"); return; }
    try {
      const res = await generateMutation.mutateAsync({ topic });
      setGeneratedMaterial(res);
    } catch (err: any) { setError(err.message || "Gagal membuat materi pembelajaran"); }
  };

  const handleCreateQuizFromMaterial = () => {
    if (!generatedMaterial) return;
    const promptText = `Judul: ${generatedMaterial.title}\nMata Pelajaran: ${generatedMaterial.subject}\nTingkat: ${generatedMaterial.gradeLevel}\nRingkasan: ${generatedMaterial.summary}\nPoin Utama: ${generatedMaterial.keyPoints.join(", ")}`;
    navigate("/create", { state: { initialPrompt: promptText } });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">AI Generator Materi Ajar</h2>
                <p className="text-xs text-neutral-500">Semai · Menyusun Materi & Rencana Kelas Instan</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>Batal</Button>
            </div>
          </CardContent>
        </Card>

        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        {/* Generator Form */}
        <Card>
          <CardContent className="pt-5 flex flex-col gap-4">
            <h3 className="text-base font-semibold text-neutral-900">Buat Bahan Ajar Otomatis</h3>
            <form onSubmit={handleGenerate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <Label>Topik atau Pokok Bahasan</Label>
                <Input
                  placeholder="Contoh: Fotosintesis & Peran Cahaya Matahari untuk Kelas 5 SD"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={generateMutation.isPending}>
                {generateMutation.isPending ? "AI Sedang Menyusun Materi..." : "Susun Materi Pembelajaran"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Generated Material */}
        {generatedMaterial && (
          <Card>
            <CardContent className="pt-5 flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b pb-4">
                <div>
                  <Badge variant="secondary">{generatedMaterial.subject} · {generatedMaterial.gradeLevel}</Badge>
                  <h2 className="text-2xl font-bold text-neutral-900 mt-2">{generatedMaterial.title}</h2>
                </div>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreateQuizFromMaterial}>
                  Buat Kuis Formatif Dari Materi Ini
                </Button>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold text-neutral-500 uppercase">Ringkasan Singkat</p>
                <div className="bg-neutral-50 p-3 border border-neutral-200 rounded">
                  <p className="text-sm text-neutral-700 leading-relaxed">{generatedMaterial.summary}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-neutral-500 uppercase">Poin-Poin Kunci (Key Takeaways)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {generatedMaterial.keyPoints.map((pt, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 bg-white border border-neutral-200 rounded">
                      <span className="text-xs text-blue-600 font-bold">•</span>
                      <span className="text-xs text-neutral-700 font-semibold">{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold text-neutral-500 uppercase">Penjelasan Materi Lengkap</p>
                <div className="bg-white p-4 border border-neutral-200 rounded whitespace-pre-line">
                  <p className="text-sm text-neutral-700 leading-relaxed">{generatedMaterial.explanation}</p>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold text-blue-600 uppercase">Ide Aktivitas Interaktif 5 Menit di Kelas</p>
                <div className="bg-blue-50 p-3 border border-blue-200 rounded">
                  <p className="text-sm text-neutral-700">{generatedMaterial.interactiveActivity}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};
