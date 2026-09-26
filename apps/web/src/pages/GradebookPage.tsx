import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { useAuth } from "../context/AuthContext";
import { DashboardLayout } from "../components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";

export const GradebookPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [aiReport, setAiReport] = useState<any | null>(null);
  const [showRekap, setShowRekap] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [manualScore, setManualScore] = useState<number>(85);
  const [manualType, setManualType] = useState<"KUIS" | "ESAI" | "UNJUK_KERJA" | "P5">("UNJUK_KERJA");
  const [manualFeedback, setManualFeedback] = useState("");
  const [showManualForm, setShowManualForm] = useState(false);

  const { data, isLoading, refetch } = trpc.gradebook.listByTeacher.useQuery(
    { teacherId: user?.id || "" },
    { enabled: !!user }
  );

  const recordGradeMutation = trpc.gradebook.record.useMutation();
  const generateReportMutation = trpc.gradebook.generateReportDigest.useMutation();

  const TYPE_LABELS: Record<string, string> = { KUIS: "Kuis", ESAI: "Esai", UNJUK_KERJA: "Unjuk Kerja", P5: "P5" };

  const rekapData = data?.students.map((st) => {
    const byType: Record<string, { total: number; count: number }> = {};
    for (const g of st.grades) {
      if (!byType[g.source_type]) byType[g.source_type] = { total: 0, count: 0 };
      byType[g.source_type].total += g.score;
      byType[g.source_type].count += 1;
    }
    const bestType = Object.entries(byType).sort((a, b) => b[1].total / b[1].count - a[1].total / a[1].count)[0]?.[0];
    return { studentName: st.studentName, gradesCount: st.gradesCount, avgScore: st.avgScore, byType, bestType };
  }) || [];

  const kelasAvg = data && data.students.length > 0
    ? Math.round(data.students.reduce((acc, s) => acc + s.avgScore, 0) / data.students.length)
    : 0;

  const handleGenerateReport = async (studentName: string) => {
    if (!user) return;
    setSelectedStudent(studentName);
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
    if (!user || !manualName || !manualTitle) return;
    try {
      await recordGradeMutation.mutateAsync({
        teacherId: user.id, studentName: manualName, sourceType: manualType,
        title: manualTitle, score: manualScore, maxScore: 100, feedback: manualFeedback,
      });
      setShowManualForm(false);
      setManualName(""); setManualTitle(""); setManualFeedback("");
      refetch();
    } catch (err: any) { alert(err.message || "Gagal mencatat nilai"); }
  };

  const scoreColor = (avg: number | null) => {
    if (avg === null) return "#d4d4d8";
    if (avg >= 75) return "#15803d";
    if (avg >= 60) return "#a16207";
    return "#b91c1c";
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">Gradebook & Rapor Terintegrasi</h1>
                <p className="text-xs text-neutral-500">Semai · Rekap Nilai Kuis, Esai, P5 & Narasi AI Rapor</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowRekap(!showRekap)}>Rekap Nilai</Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setShowManualForm(true)}>+ Input Nilai Manual</Button>
                <Button size="sm" variant="outline" onClick={() => navigate("/dashboard")}>Batal</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manual Grade Form */}
        {showManualForm && (
          <Card>
            <CardContent className="pt-5 flex flex-col gap-4">
              <h3 className="text-base font-semibold text-neutral-800">Catat Nilai Baru</h3>
              <form onSubmit={handleAddManualGrade}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <Label>Nama Siswa</Label>
                    <Input placeholder="Contoh: Ahmad Rizky" value={manualName} onChange={(e) => setManualName(e.target.value)} required />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label>Tipe Penilaian</Label>
                    <select className="border border-neutral-300 rounded-md px-3 py-2 text-sm" value={manualType} onChange={(e) => setManualType(e.target.value as any)}>
                      <option value="UNJUK_KERJA">Unjuk Kerja / Praktikum</option>
                      <option value="P5">Penilaian Karakter P5</option>
                      <option value="KUIS">Kuis Formatif</option>
                      <option value="ESAI">Penilaian Esai</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label>Judul Penilaian</Label>
                    <Input placeholder="Contoh: Praktikum Kelompok Bab 2" value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} required />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label>Skor (0-100)</Label>
                    <Input type="number" min={0} max={100} value={manualScore} onChange={(e) => setManualScore(Number(e.target.value))} />
                  </div>
                  <div className="flex flex-col gap-1 col-span-2">
                    <Label>Catatan / Feedback Guru</Label>
                    <Input placeholder="Catatan perkembangan atau aspek yang dinilai..." value={manualFeedback} onChange={(e) => setManualFeedback(e.target.value)} />
                  </div>
                  <div className="col-span-2 flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowManualForm(false)}>Batal</Button>
                    <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">Simpan Nilai Terintegrasi</Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* AI Report */}
        {aiReport && (
          <Card className="border-2 border-blue-400">
            <CardContent className="pt-5 flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b pb-3">
                <div>
                  <p className="text-xs font-semibold text-blue-600 uppercase">Draft Narasi Rapor Kurikulum Merdeka AI</p>
                  <h3 className="text-lg font-bold text-neutral-900 mt-1">Rapor Perkembangan: {aiReport.studentName}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-2xl font-black text-neutral-900">{aiReport.overallScore}</p>
                    <p className="text-xs font-semibold text-blue-600">{aiReport.gradeCategory}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setAiReport(null)}>Tutup</Button>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold text-neutral-500 uppercase">Narasi Deskriptif Rapor (Capaian Pembelajaran)</p>
                <div className="bg-white p-3.5 border border-neutral-200 rounded">
                  <p className="text-sm text-neutral-700 leading-relaxed">{aiReport.holisticNarrative}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-semibold text-green-700 uppercase">Keunggulan & Karakter Positif</p>
                  <div className="flex flex-col gap-1">
                    {(aiReport.strengths || []).map((s: string, idx: number) => (
                      <div key={idx} className="p-2 bg-white border border-neutral-200 rounded text-xs text-neutral-700 font-medium">✓ {s}</div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-semibold text-amber-700 uppercase">Rekomendasi Tindak Lanjut</p>
                  <div className="flex flex-col gap-1">
                    {(aiReport.recommendations || []).map((r: string, idx: number) => (
                      <div key={idx} className="p-2 bg-white border border-neutral-200 rounded text-xs text-neutral-700 font-medium">• {r}</div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Student Summary */}
        <div className="flex flex-col gap-4">
          <h3 className="text-base font-semibold text-neutral-900">Ringkasan Performa Siswa (Nilai Terintegrasi)</h3>

          {/* Rekap Table */}
          {showRekap && data && data.students.length > 0 && (
            <Card>
              <CardContent className="pt-0 p-0">
                <div className="flex items-center justify-between flex-wrap gap-2 p-4 border-b">
                  <h4 className="text-sm font-semibold text-neutral-700">Rekap Nilai per Siswa</h4>
                  <p className="text-xs text-neutral-500">
                    Rata-rata kelas: <span className="text-blue-600 font-bold">{kelasAvg}</span> · {data.students.length} siswa
                  </p>
                </div>
                <div className="overflow-x-auto p-2">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        {["Siswa", "Jml", "Kuis", "Esai", "Unjuk Kerja", "P5", "Rata-rata"].map((h) => (
                          <th key={h} className="p-2.5 text-left font-semibold border-b border-neutral-200 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rekapData.map((row) => (
                        <tr key={row.studentName}>
                          <td className="p-2.5 font-semibold border-b border-neutral-100">{row.studentName}</td>
                          <td className="p-2.5 text-center border-b border-neutral-100">{row.gradesCount}</td>
                          {(["KUIS", "ESAI", "UNJUK_KERJA", "P5"] as const).map((t) => {
                            const cell = row.byType[t];
                            const avg = cell ? Math.round(cell.total / cell.count) : null;
                            return (
                              <td key={t} className="p-2.5 text-center border-b border-neutral-100 font-bold" style={{ color: scoreColor(avg) }}>
                                {avg !== null ? avg : "—"}
                              </td>
                            );
                          })}
                          <td className="p-2.5 text-center font-black border-b border-neutral-100">
                            {row.avgScore}
                            {row.bestType && <div className="text-[9px] font-medium text-neutral-500">terkuat: {TYPE_LABELS[row.bestType]}</div>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Student Cards */}
          {isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              <Skeleton className="w-full h-16" />
              <Skeleton className="w-full h-16" />
              <Skeleton className="w-full h-16" />
            </div>
          ) : !data || data.students.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-neutral-200 rounded-md">
              <p className="text-base font-semibold text-neutral-600">Belum Ada Catatan Nilai</p>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
                Nilai otomatis masuk saat siswa mengerjakan Kuis Formatif, Esai, atau saat Anda menginput penilaian manual.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {data.students.map((st) => (
                <Card key={st.studentName}>
                  <CardContent className="pt-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between pb-2">
                      <h4 className="text-sm font-bold text-neutral-900">{st.studentName}</h4>
                      <span className="text-lg font-black text-blue-600">{st.avgScore}</span>
                    </div>
                    <p className="text-xs text-neutral-500">{st.gradesCount} catatan nilai terhubung</p>
                    <div className="max-h-36 overflow-y-auto flex flex-col gap-1.5">
                      {st.grades.map((g: any) => (
                        <div key={g.id} className="flex justify-between items-center p-2 bg-neutral-50 border border-neutral-200 rounded">
                          <div>
                            <Badge variant="secondary" className="text-xs">{g.source_type}</Badge>
                            <p className="text-xs text-neutral-600 truncate max-w-[120px]">{g.title}</p>
                          </div>
                          <span className="text-xs font-bold text-neutral-900">{g.score}</span>
                        </div>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => handleGenerateReport(st.studentName)}
                      disabled={generateReportMutation.isPending && selectedStudent === st.studentName}
                    >
                      {generateReportMutation.isPending && selectedStudent === st.studentName
                        ? "AI Menyusun Rapor..."
                        : "Generate Narasi Rapor AI"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
