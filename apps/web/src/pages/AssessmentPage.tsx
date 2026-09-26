import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";

export const AssessmentPage: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [assessmentType, setAssessmentType] = useState<"P5_KARAKTER" | "UNJUK_KERJA" | "DIAGNOSTIK">("P5_KARAKTER");
  const [targetGrade, setTargetGrade] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [result, setResult] = useState<{
    title: string;
    typeLabel: string;
    targetGrade: string;
    description: string;
    criteria: Array<{
      name: string;
      description: string;
      descriptors: {
        sangatBaik: string;
        baik: string;
        cukup: string;
        perluBimbingan: string;
      };
    }>;
    scoringGuidance: string;
  } | null>(null);

  const generateMutation = trpc.assessment.generate.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title || !targetGrade) {
      setError("Silakan isi Judul dan Target Kelas");
      return;
    }

    try {
      const res = await generateMutation.mutateAsync({
        title,
        assessmentType,
        targetGrade,
        notes,
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Gagal menyusun modul penilaian khusus");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Modul Penilaian Khusus</h1>
            <p className="text-slate-500 text-sm">Semai 🌱 — Rubrik P5, Asesmen Diagnostik & Unjuk Kerja AI</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Kembali ke Dashboard
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-200">
            {error}
          </div>
        )}

        <Card className="border-teal-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-teal-900 flex items-center gap-2">
              <span>📊</span> Generator Rubrik & Modul Asesmen Khusus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="title">Judul Kegiatan / Topik Penilaian</Label>
                  <Input
                    id="title"
                    placeholder="Contoh: Projek Pengolahan Sampah Plastik / Praktikum IPA Sains"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="grade">Target Kelas / Fase</Label>
                  <Input
                    id="grade"
                    placeholder="Contoh: Kelas 4 SD / Fase B"
                    value={targetGrade}
                    onChange={(e) => setTargetGrade(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="type">Tipe Modul Penilaian Khusus</Label>
                <select
                  id="type"
                  className="w-full p-2.5 text-sm border rounded-md border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={assessmentType}
                  onChange={(e) => setAssessmentType(e.target.value as any)}
                >
                  <option value="P5_KARAKTER">🌱 Rubrik Karakter P5 (Profil Pelajar Pancasila)</option>
                  <option value="UNJUK_KERJA">🧪 Rubrik Asesmen Unjuk Kerja / Praktikum / Kinerja</option>
                  <option value="DIAGNOSTIK">🔍 Instrumen Asesmen Diagnostik Awal Pembelajaran</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="notes">Catatan Indikator Khusus (Opsional)</Label>
                <textarea
                  id="notes"
                  rows={2}
                  className="w-full p-2.5 text-sm border rounded-md border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Contoh: Fokus pada dimensi Gotong Royong dan Kreativitas"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 font-semibold"
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? "AI Sedang Menyusun Rubrik..." : "Generate Modul & Rubrik Penilaian ✨"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <Card className="border-teal-300 bg-white shadow-md">
            <CardHeader className="border-b pb-4 bg-teal-50/50">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-0.5 rounded font-bold uppercase bg-teal-200 text-teal-900">
                  {result.typeLabel}
                </span>
                <span className="text-xs text-slate-500">{result.targetGrade}</span>
              </div>
              <CardTitle className="text-2xl font-bold text-slate-800 mt-2">
                {result.title}
              </CardTitle>
              <p className="text-xs text-slate-600 mt-1">{result.description}</p>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-teal-900 uppercase tracking-wide">
                  Matriks Rubrik Penilaian Empat Tingkat (Descriptors)
                </h3>

                <div className="space-y-4">
                  {result.criteria.map((c, i) => (
                    <div key={i} className="border rounded-lg p-4 bg-slate-50/50 space-y-3">
                      <div>
                        <div className="font-bold text-slate-800 text-base">{c.name}</div>
                        <div className="text-xs text-slate-500">{c.description}</div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded">
                          <div className="font-bold text-emerald-800 mb-1">Sangat Baik (Skor 4)</div>
                          <div className="text-slate-700">{c.descriptors.sangatBaik}</div>
                        </div>
                        <div className="p-2.5 bg-blue-50 border border-blue-200 rounded">
                          <div className="font-bold text-blue-800 mb-1">Baik (Skor 3)</div>
                          <div className="text-slate-700">{c.descriptors.baik}</div>
                        </div>
                        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded">
                          <div className="font-bold text-amber-800 mb-1">Cukup (Skor 2)</div>
                          <div className="text-slate-700">{c.descriptors.cukup}</div>
                        </div>
                        <div className="p-2.5 bg-red-50 border border-red-200 rounded">
                          <div className="font-bold text-red-800 mb-1">Perlu Bimbingan (1)</div>
                          <div className="text-slate-700">{c.descriptors.perluBimbingan}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-teal-900 uppercase tracking-wide mb-1">
                  📋 Petunjuk Pengolahan Nilai Bagi Guru
                </h3>
                <div className="text-slate-800 text-xs bg-slate-100 p-3 rounded border border-slate-200 leading-relaxed font-mono whitespace-pre-line">
                  {result.scoringGuidance}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
