import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { useAuth } from "../context/AuthContext";
import { DashboardLayout } from "../components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

export const CreateMaterialPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [topic, setTopic] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [accessCode, setAccessCode] = useState("");
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [generatedMaterial, setGeneratedMaterial] = useState<{
    title: string; subject: string; gradeLevel: string; summary: string;
    keyPoints: string[]; explanation: string; interactiveActivity: string;
  } | null>(null);

  const generateMutation = trpc.material.generate.useMutation();
  const saveMutation = trpc.material.save.useMutation();
  const { refetch: refetchList } = trpc.material.listByTeacher.useQuery(
    { teacherId: user?.id || "" },
    { enabled: !!user }
  );

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

  const handleSaveMaterial = async () => {
    if (!user || !generatedMaterial) return;
    setSaveMsg(null);
    try {
      const res = await saveMutation.mutateAsync({
        teacherId: user.id,
        title: generatedMaterial.title,
        subject: generatedMaterial.subject,
        gradeLevel: generatedMaterial.gradeLevel,
        summary: generatedMaterial.summary,
        keyPoints: generatedMaterial.keyPoints,
        explanation: generatedMaterial.explanation,
        interactiveActivity: generatedMaterial.interactiveActivity,
        accessCode: accessCode || undefined,
      });
      setSaveOpen(false);
      setAccessCode("");
      setSaveMsg(`Tersimpan. Kode akses: ${(res as any).access_code}`);
      refetchList();
    } catch (err: any) {
      setSaveMsg(err.message || "Gagal menyimpan materi");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-xl font-medium text-neutral-950 tracking-tight">AI Generator Materi Ajar</h1>
                <p className="text-xs text-neutral-400 mt-1">Semai · Menyusun Materi & Rencana Kelas Instan</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" className="rounded-sm" onClick={() => navigate("/dashboard")}>Batal</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {saveMsg && (
          <Alert variant="default"><AlertDescription>{saveMsg}</AlertDescription></Alert>
        )}
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        {/* Generator Form */}
        <Card>
          <CardContent className="pt-5 flex flex-col gap-4">
            <h3 className="text-base font-medium text-neutral-950">Buat Bahan Ajar Otomatis</h3>
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
              <Button type="submit" className="w-full bg-neutral-900 hover:bg-neutral-800 text-white" disabled={generateMutation.isPending}>
                {generateMutation.isPending ? "AI Sedang Menyusun Materi..." : "Susun Materi Pembelajaran"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Generated Material */}
        {generatedMaterial && (
          <Card>
            <CardContent className="pt-5 flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-neutral-200 pb-4">
                <div>
                  <Badge variant="secondary">{generatedMaterial.subject} · {generatedMaterial.gradeLevel}</Badge>
                  <h2 className="text-xl font-medium text-neutral-950 mt-2 tracking-tight">{generatedMaterial.title}</h2>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-sm" onClick={() => setSaveOpen(true)}>
                    Simpan untuk Siswa
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-sm" onClick={handleCreateQuizFromMaterial}>
                    Buat Kuis Dari Ini
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium text-neutral-500 uppercase">Ringkasan Singkat</p>
                <div className="bg-neutral-50 p-3 border border-neutral-200 rounded-sm">
                  <p className="text-sm text-neutral-700 leading-relaxed">{generatedMaterial.summary}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-neutral-500 uppercase">Poin-Poin Kunci (Key Takeaways)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {generatedMaterial.keyPoints.map((pt, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 bg-white border border-neutral-200 rounded-sm">
                      <span className="text-xs text-neutral-900 font-bold">•</span>
                      <span className="text-xs text-neutral-700 font-medium">{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium text-neutral-500 uppercase">Penjelasan Materi Lengkap</p>
                <div className="bg-white p-4 border border-neutral-200 rounded-sm whitespace-pre-line">
                  <p className="text-sm text-neutral-700 leading-relaxed">{generatedMaterial.explanation}</p>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-xs text-neutral-950 uppercase">Ide Aktivitas Interaktif 5 Menit di Kelas</p>
                <div className="bg-neutral-100 p-3 border border-neutral-200 rounded-sm">
                  <p className="text-sm text-neutral-700">{generatedMaterial.interactiveActivity}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Save material modal */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Simpan Materi untuk Siswa</DialogTitle>
            <DialogDescription>
              Materi tersimpan di arsip dan bisa dibuka siswa lewat kode akses. Kode boleh diisi sendiri (min. 4 karakter) atau dibuat otomatis.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1">
            <Label>Kode Akses (opsional)</Label>
            <Input
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              placeholder="Contoh: FOTOSIN5"
              maxLength={10}
              style={{ fontSize: "1rem" }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="rounded-sm" onClick={() => setSaveOpen(false)}>Batal</Button>
            <Button size="sm" className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-sm" onClick={handleSaveMaterial} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Menyimpan..." : "Simpan Materi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};
