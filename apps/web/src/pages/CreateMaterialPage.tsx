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

export const CreateMaterialPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [topic, setTopic] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const generateMutation = trpc.material.generate.useMutation();
  const { refetch: refetchList } = trpc.material.listByTeacher.useQuery(
    { teacherId: user?.id || "" },
    { enabled: !!user }
  );

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSaved(null);
    if (!topic || topic.trim().length < 3) {
      setError("Masukkan topik materi minimal 3 karakter");
      return;
    }
    try {
      const result = await generateMutation.mutateAsync({ teacherId: user.id, topic });
      setSaved(result);
      refetchList();
      setTopic("");
    } catch (err: any) {
      setError(err.message || "Gagal membuat materi pembelajaran");
    }
  };

  const materiUrl = `${window.location.origin}/materi`;
  const handleCopyLink = () => {
    navigator.clipboard.writeText(materiUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const c = saved?.content || {};

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-xl font-medium text-neutral-950 tracking-tight">AI Generator Materi Ajar</h1>
                <p className="text-xs text-neutral-400 mt-1">
                  Materi tersimpan otomatis dan langsung bisa dibaca siswa di halaman Materi.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="rounded-sm" onClick={() => navigate("/materials")}>
                  Arsip Materi
                </Button>
                <Button variant="outline" size="sm" className="rounded-sm" onClick={() => navigate("/dashboard")}>
                  Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        {/* Form generate */}
        <Card>
          <CardContent className="pt-5 flex flex-col gap-4">
            <p className="text-xs uppercase tracking-wider text-neutral-400 select-none">Buat Bahan Ajar Baru</p>
            <form onSubmit={handleGenerate} className="flex flex-col gap-4" noValidate>
              <div className="flex flex-col gap-1">
                <Label htmlFor="material-topic">Topik atau Pokok Bahasan</Label>
                <Input
                  id="material-topic"
                  placeholder="Contoh: Fotosintesis & Peran Cahaya Matahari untuk Kelas 5 SD"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                  style={{ fontSize: "1rem" }}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white rounded-sm"
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? "AI Sedang Menyusun Materi..." : "Susun & Simpan Materi"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Hasil generate + sharing */}
        {saved && (
          <Card className="border-neutral-900">
            <CardContent className="pt-5 flex flex-col gap-5">
              {/* Status */}
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs uppercase tracking-wider text-neutral-400 select-none">Materi Berhasil Dibuat</p>
                  <h2 className="text-lg font-medium text-neutral-950 mt-1 tracking-tight">{saved.title}</h2>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <Badge variant="secondary">{saved.subject}</Badge>
                    <Badge variant="secondary">{saved.grade_level}</Badge>
                    <span className="text-xs text-neutral-400">
                      {new Date(saved.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-sm flex-shrink-0"
                  onClick={() => navigate("/materials")}
                >
                  Lihat Arsip →
                </Button>
              </div>

              {/* Share link box */}
              <div className="flex flex-col gap-2">
                <p className="text-xs uppercase tracking-wider text-neutral-400 select-none">Bagikan ke Siswa</p>
                <p className="text-xs text-neutral-500">
                  Materi ini sudah otomatis muncul di halaman Materi. Bagikan link berikut ke siswa:
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-sm font-mono text-sm text-neutral-700 truncate select-all">
                    {materiUrl}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-sm flex-shrink-0"
                    onClick={handleCopyLink}
                  >
                    {copied ? "✓ Tersalin" : "Salin Link"}
                  </Button>
                  <Button
                    size="sm"
                    className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-sm flex-shrink-0"
                    onClick={() => window.open(materiUrl, "_blank")}
                  >
                    Buka Halaman Materi
                  </Button>
                </div>
                <p className="text-xs text-neutral-400">
                  Siswa bisa langsung membaca tanpa login. Materi juga tampil di beranda portal siswa.
                </p>
              </div>

              {/* Preview konten */}
              <div className="flex flex-col gap-4 border-t border-neutral-100 pt-4">
                <p className="text-xs uppercase tracking-wider text-neutral-400 select-none">Pratinjau Materi</p>

                {c.summary && (
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-medium text-neutral-600">Ringkasan</p>
                    <p className="text-sm text-neutral-700 leading-relaxed">{c.summary}</p>
                  </div>
                )}

                {c.keyPoints && c.keyPoints.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs font-medium text-neutral-600">Poin Utama</p>
                    <ul className="flex flex-col gap-1 list-none p-0 m-0">
                      {c.keyPoints.map((pt: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                          <span className="text-neutral-400 flex-shrink-0 mt-0.5">•</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {c.interactiveActivity && (
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-medium text-neutral-600">Ide Aktivitas Kelas</p>
                    <div className="bg-neutral-50 border border-neutral-200 rounded-sm p-3">
                      <p className="text-sm text-neutral-700">{c.interactiveActivity}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* CTA buat kuis dari materi ini */}
              <div className="border-t border-neutral-100 pt-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-950">Buat Kuis dari Materi Ini?</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Generate soal pilihan ganda otomatis berdasarkan konten materi ini.</p>
                </div>
                <Button
                  size="sm"
                  className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-sm flex-shrink-0"
                  onClick={() =>
                    navigate("/create", {
                      state: {
                        initialPrompt: `Judul: ${saved.title}\nMata Pelajaran: ${saved.subject}\nTingkat: ${saved.grade_level}\nRingkasan: ${c.summary || ""}\nPoin Utama: ${(c.keyPoints || []).join(", ")}`,
                      },
                    })
                  }
                >
                  Buat Kuis Formatif
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};
