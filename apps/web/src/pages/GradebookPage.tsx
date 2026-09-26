import React, { useState } from "react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../context/AuthContext";
import { DashboardLayout } from "../components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const TYPES = ["KUIS", "ESAI", "UNJUK_KERJA", "P5"] as const;
const TYPE_LABELS: Record<string, string> = {
  KUIS: "Kuis",
  ESAI: "Esai",
  UNJUK_KERJA: "Unjuk Kerja",
  P5: "P5",
};

export const GradebookPage: React.FC = () => {
  const { user } = useAuth();

  const [inputOpen, setInputOpen] = useState(false);
  const [aiReport, setAiReport] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [activeType, setActiveType] = useState<(typeof TYPES)[number] | "SEMUA">("SEMUA");

  const [form, setForm] = useState({
    studentName: "",
    sourceType: "UNJUK_KERJA" as (typeof TYPES)[number],
    title: "",
    score: 85,
    feedback: "",
  });

  const { data, isLoading, refetch } = trpc.gradebook.listByTeacher.useQuery(
    { teacherId: user?.id || "" },
    { enabled: !!user }
  );

  const recordGradeMutation = trpc.gradebook.record.useMutation();
  const deleteGradeMutation = trpc.gradebook.deleteGrade.useMutation();
  const generateReportMutation = trpc.gradebook.generateReportDigest.useMutation();

  const rekapData = data?.students.map((st) => {
    const byType: Record<string, { total: number; count: number }> = {};
    for (const g of st.grades) {
      if (!byType[g.source_type]) byType[g.source_type] = { total: 0, count: 0 };
      byType[g.source_type].total += (g.score / g.max_score) * 100;
      byType[g.source_type].count += 1;
    }
    return { studentName: st.studentName, gradesCount: st.gradesCount, avgScore: st.avgScore, byType };
  }) || [];

  const kelasAvg = data && data.students.length > 0
    ? Math.round(data.students.reduce((acc, s) => acc + s.avgScore, 0) / data.students.length)
    : 0;

  const typeCounts: Record<string, number> = { SEMUA: data?.allGrades?.length || 0 };
  for (const t of TYPES) {
    typeCounts[t] = data?.allGrades?.filter((g: any) => g.source_type === t).length || 0;
  }

  const visibleStudents = data?.students || [];

  const handleGenerateReport = async (studentName: string) => {
    if (!user) return;
    setAiReport(null);
    try {
      const res = await generateReportMutation.mutateAsync({ teacherId: user.id, studentName });
      setAiReport(res);
    } catch (err: any) {
      alert(err.message || "Gagal menyusun narasi rapor AI");
    }
  };

  const handleAddManualGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.studentName || !form.title) return;
    try {
      await recordGradeMutation.mutateAsync({
        teacherId: user.id,
        studentName: form.studentName,
        sourceType: form.sourceType,
        title: form.title,
        score: form.score,
        maxScore: 100,
        feedback: form.feedback || undefined,
      });
      setInputOpen(false);
      setForm({ studentName: "", sourceType: "UNJUK_KERJA", title: "", score: 85, feedback: "" });
      refetch();
    } catch (err: any) {
      alert(err.message || "Gagal mencatat nilai");
    }
  };

  const handleDeleteGrade = async () => {
    if (!deleteTarget) return;
    try {
      await deleteGradeMutation.mutateAsync({ gradeId: deleteTarget.id });
      setDeleteTarget(null);
      refetch();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus nilai");
    }
  };

  const scoreColor = (avg: number | null) => {
    if (avg === null) return "#a3a3a3";
    if (avg >= 75) return "#15803d";
    if (avg >= 60) return "#a16207";
    return "#b91c1c";
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs text-neutral-400">Rekap nilai terintegrasi</p>
            <h1 className="text-xl font-medium text-neutral-950 tracking-tight mt-2">Gradebook & Rapor</h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-sm" onClick={() => setInputOpen(true)}>
              + Input Nilai Manual
            </Button>
          </div>
        </div>

        {/* Type category tabs */}
        <div className="flex gap-px bg-neutral-200 border border-neutral-200 overflow-x-auto" role="tablist" aria-label="Kategori penilaian">
          {(["SEMUA", ...TYPES] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={activeType === t}
              onClick={() => setActiveType(t)}
              className={`flex-shrink-0 px-4 py-2.5 text-sm whitespace-nowrap transition-colors ${
                activeType === t
                  ? "bg-neutral-900 text-white"
                  : "bg-white text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {t === "SEMUA" ? "Semua" : TYPE_LABELS[t]}
              <span className={`ml-2 text-xs tabular-nums ${activeType === t ? "text-white/60" : "text-neutral-400"}`}>
                {typeCounts[t]}
              </span>
            </button>
          ))}
        </div>

        {/* Class summary */}
        {data && data.students.length > 0 && (
          <Card>
            <CardContent className="pt-4 px-4 flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm text-neutral-600">
                Rata-rata kelas: <span className="text-neutral-950 font-medium tabular-nums">{kelasAvg}</span>
              </p>
              <p className="text-xs text-neutral-400">{data.students.length} siswa tercatat</p>
            </CardContent>
          </Card>
        )}

        {/* AI Report */}
        {aiReport && (
          <Card className="border-neutral-300">
            <CardContent className="pt-5 flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-neutral-200 pb-3">
                <div>
                  <p className="text-xs text-neutral-400 uppercase tracking-wider select-none">Draft Narasi Rapor Kurikulum Merdeka AI</p>
                  <h3 className="text-base font-medium text-neutral-950 mt-1">Rapor Perkembangan: {aiReport.studentName}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-2xl font-medium text-neutral-950 tabular-nums">{aiReport.overallScore}</p>
                    <p className="text-xs text-neutral-400">{aiReport.gradeCategory}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="rounded-sm" onClick={() => setAiReport(null)}>Tutup</Button>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-xs text-neutral-400 uppercase tracking-wider select-none">Narasi Deskriptif (Capaian Pembelajaran)</p>
                <div className="bg-white p-3.5 border border-neutral-200 rounded-sm">
                  <p className="text-sm text-neutral-700 leading-relaxed">{aiReport.holisticNarrative}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-neutral-400 uppercase tracking-wider select-none">Keunggulan & Karakter Positif</p>
                  <div className="flex flex-col gap-1">
                    {(aiReport.strengths || []).map((s: string, idx: number) => (
                      <div key={idx} className="p-2 bg-white border border-neutral-200 rounded-sm text-xs text-neutral-700">✓ {s}</div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-neutral-400 uppercase tracking-wider select-none">Rekomendasi Tindak Lanjut</p>
                  <div className="flex flex-col gap-1">
                    {(aiReport.recommendations || []).map((r: string, idx: number) => (
                      <div key={idx} className="p-2 bg-white border border-neutral-200 rounded-sm text-xs text-neutral-700">• {r}</div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Student list */}
        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="w-full h-16" />
            <Skeleton className="w-full h-16" />
            <Skeleton className="w-full h-16" />
          </div>
        ) : !data || data.students.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-neutral-300">
            <p className="text-sm font-medium text-neutral-700">Belum Ada Catatan Nilai</p>
            <p className="text-sm text-neutral-500 max-w-sm mx-auto mt-1">
              Nilai otomatis masuk saat siswa mengerjakan kuis formatif atau esai, atau saat Anda menginput penilaian manual.
            </p>
            <Button size="sm" className="bg-neutral-900 hover:bg-neutral-800 text-white mt-4 rounded-sm" onClick={() => setInputOpen(true)}>
              Input Nilai Manual
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleStudents.map((st: any) => {
              const grades = (st.grades || []).filter((g: any) => activeType === "SEMUA" || g.source_type === activeType);
              if (grades.length === 0) return null;
              return (
                <Card key={st.studentName}>
                  <CardContent className="pt-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between pb-1">
                      <div className="flex items-center gap-3 min-w-0">
                        <h4 className="text-sm font-medium text-neutral-950 truncate">{st.studentName}</h4>
                        <Badge variant="secondary" className="text-xs flex-shrink-0">{grades.length} catatan</Badge>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-lg font-medium text-neutral-950 tabular-nums">{st.avgScore}</span>
                        <Button size="sm" variant="outline" className="rounded-sm" onClick={() => handleGenerateReport(st.studentName)} disabled={generateReportMutation.isPending}>
                          {generateReportMutation.isPending ? "AI Menyusun..." : "Narasi Rapor AI"}
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col divide-y divide-neutral-100 border border-neutral-200">
                      {grades.map((g: any) => (
                        <div key={g.id} className="flex items-center gap-3 px-3 py-2.5">
                          <Badge variant="secondary" className="text-xs flex-shrink-0 w-24 justify-center">{TYPE_LABELS[g.source_type]}</Badge>
                          <p className="text-sm text-neutral-700 truncate flex-1">{g.title}</p>
                          {g.feedback && (
                            <p className="text-xs text-neutral-400 truncate max-w-[160px] hidden md:block">{g.feedback}</p>
                          )}
                          <span className="text-sm font-medium text-neutral-950 tabular-nums flex-shrink-0">{g.score}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 rounded-sm flex-shrink-0"
                            onClick={() => setDeleteTarget(g)}
                            aria-label={`Hapus nilai ${g.title}`}
                          >
                            Hapus
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual input modal */}
      <Dialog open={inputOpen} onOpenChange={setInputOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Input Nilai Manual</DialogTitle>
            <DialogDescription>
              Catat penilaian unjuk kerja, P5, kuis, atau esai. Nilai langsung masuk rekap per siswa.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddManualGrade} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-neutral-600" htmlFor="mg-name">Nama Siswa</label>
              <Input id="mg-name" placeholder="Contoh: Ahmad Rizky" value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-neutral-600" htmlFor="mg-type">Tipe Penilaian</label>
                <select
                  id="mg-type"
                  className="border border-neutral-300 rounded-sm px-3 py-2 text-sm bg-white"
                  value={form.sourceType}
                  onChange={(e) => setForm({ ...form, sourceType: e.target.value as any })}
                >
                  <option value="UNJUK_KERJA">Unjuk Kerja / Praktikum</option>
                  <option value="P5">Penilaian Karakter P5</option>
                  <option value="KUIS">Kuis Formatif</option>
                  <option value="ESAI">Penilaian Esai</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-neutral-600" htmlFor="mg-score">Skor (0-100)</label>
                <Input id="mg-score" type="number" min={0} max={100} value={form.score} onChange={(e) => setForm({ ...form, score: Number(e.target.value) })} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-neutral-600" htmlFor="mg-title">Judul Penilaian</label>
              <Input id="mg-title" placeholder="Contoh: Praktikum Kelompok Bab 2" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-neutral-600" htmlFor="mg-feedback">Catatan / Feedback (opsional)</label>
              <Input id="mg-feedback" placeholder="Aspek yang dinilai atau catatan perkembangan..." value={form.feedback} onChange={(e) => setForm({ ...form, feedback: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" className="rounded-sm" onClick={() => setInputOpen(false)}>Batal</Button>
              <Button type="submit" size="sm" className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-sm" disabled={recordGradeMutation.isPending}>
                {recordGradeMutation.isPending ? "Menyimpan..." : "Simpan Nilai"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete grade confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Catatan Nilai?</DialogTitle>
            <DialogDescription>
              "{deleteTarget?.title}" ({deleteTarget ? TYPE_LABELS[deleteTarget.source_type] : ""}, skor {deleteTarget?.score}) akan dihapus dari rekap.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" className="rounded-sm" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white rounded-sm" onClick={handleDeleteGrade} disabled={deleteGradeMutation.isPending}>
              {deleteGradeMutation.isPending ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};
