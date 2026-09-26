import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { useAuth } from "../context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";

export const GradebookPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [aiReport, setAiReport] = useState<any | null>(null);
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

  const handleGenerateReport = async (studentName: string) => {
    if (!user) return;
    setSelectedStudent(studentName);
    setAiReport(null);
    try {
      const res = await generateReportMutation.mutateAsync({
        teacherId: user.id,
        studentName,
      });
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
        teacherId: user.id,
        studentName: manualName,
        sourceType: manualType,
        title: manualTitle,
        score: manualScore,
        maxScore: 100,
        feedback: manualFeedback,
      });

      setShowManualForm(false);
      setManualName("");
      setManualTitle("");
      setManualFeedback("");
      refetch();
    } catch (err: any) {
      alert(err.message || "Gagal mencatat nilai");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Gradebook & Rapor Terintegrasi</h1>
            <p className="text-slate-500 text-sm">Semai 🌱 — Rekap Nilai Kuis, Esai, P5 & Narasi AI Rapor</p>
          </div>
          <div className="flex items-center gap-2">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-xs md:text-sm" onClick={() => setShowManualForm(true)}>
              + Input Nilai Manual
            </Button>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Kembali
            </Button>
          </div>
        </div>

        {showManualForm && (
          <Card className="border-emerald-200 bg-white shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-emerald-900">Catat Nilai Baru</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddManualGrade} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="sName">Nama Siswa</Label>
                  <Input
                    id="sName"
                    placeholder="Contoh: Ahmad Rizky"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="sType">Tipe Penilaian</Label>
                  <select
                    id="sType"
                    className="w-full p-2.5 text-sm border rounded-md border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={manualType}
                    onChange={(e) => setManualType(e.target.value as any)}
                  >
                    <option value="UNJUK_KERJA">🧪 Unjuk Kerja / Praktikum</option>
                    <option value="P5">🌱 Penilaian Karakter P5</option>
                    <option value="KUIS">📝 Kuis Formatif</option>
                    <option value="ESAI">✍️ Penilaian Esai</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="sTitle">Judul Penilaian</Label>
                  <Input
                    id="sTitle"
                    placeholder="Contoh: Praktikum Kelompok Bab 2"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="sScore">Skor (0-100)</Label>
                  <Input
                    id="sScore"
                    type="number"
                    min={0}
                    max={100}
                    value={manualScore}
                    onChange={(e) => setManualScore(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="sFeedback">Catatan / Feedback Guru</Label>
                  <Input
                    id="sFeedback"
                    placeholder="Catatan perkembangan atau aspek yang dinilai..."
                    value={manualFeedback}
                    onChange={(e) => setManualFeedback(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                  <Button variant="outline" type="button" onClick={() => setShowManualForm(false)}>
                    Batal
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                    Simpan Nilai Terintegrasi
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Holistic AI Report Modal */}
        {aiReport && (
          <Card className="border-2 border-purple-400 bg-gradient-to-r from-purple-50 to-white shadow-lg">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-3">
              <div>
                <div className="text-xs font-bold text-purple-700 uppercase tracking-wide">
                  Draft Narasi Rapor Kurikulum Merdeka AI
                </div>
                <CardTitle className="text-xl font-bold text-purple-950 mt-1">
                  Rapor Perkembangan: {aiReport.studentName}
                </CardTitle>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-2xl font-black text-purple-900">{aiReport.overallScore}</div>
                  <div className="text-[10px] text-purple-700 font-bold uppercase">{aiReport.gradeCategory}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setAiReport(null)}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <h4 className="text-xs font-bold text-purple-900 uppercase mb-1">Narasi Deskriptif Rapor (Capaian Pembelajaran)</h4>
                <p className="text-sm text-slate-800 bg-white p-3.5 rounded border border-purple-200 leading-relaxed font-sans">
                  {aiReport.holisticNarrative}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <h4 className="font-bold text-emerald-800 mb-1">Keunggulan & Karakter Positif</h4>
                  <ul className="space-y-1">
                    {(aiReport.strengths || []).map((s: string, idx: number) => (
                      <li key={idx} className="bg-white p-2 rounded border border-emerald-200 text-emerald-950 font-medium">
                        ✓ {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-amber-800 mb-1">Rekomendasi Tindak Lanjut</h4>
                  <ul className="space-y-1">
                    {(aiReport.recommendations || []).map((r: string, idx: number) => (
                      <li key={idx} className="bg-white p-2 rounded border border-amber-200 text-amber-950 font-medium">
                        • {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Ringkasan Performa Siswa (Nilai Terintegrasi)</h2>

          {isLoading ? (
            <div className="text-slate-500 text-center py-8">Memuat data nilai terintegrasi...</div>
          ) : !data || data.students.length === 0 ? (
            <Card className="border-dashed border-2 border-slate-200 text-center p-8">
              <CardContent className="space-y-2 pt-2">
                <div className="text-3xl">📊</div>
                <CardTitle className="text-base text-slate-700">Belum Ada Catatan Nilai</CardTitle>
                <p className="text-slate-500 text-xs">
                  Nilai otomatis masuk saat siswa mengerjakan Kuis Formatif, Esai, atau saat Anda menginput penilaian manual.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.students.map((st) => (
                <Card key={st.studentName} className="border-slate-200 bg-white shadow-sm hover:border-emerald-500 transition-all">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-bold text-slate-800">
                        {st.studentName}
                      </CardTitle>
                      <span className="text-lg font-black text-emerald-600">{st.avgScore}</span>
                    </div>
                    <div className="text-xs text-slate-500">{st.gradesCount} catatan nilai terhubung</div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-2">
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {st.grades.map((g: any) => (
                        <div key={g.id} className="p-2 rounded bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
                          <div>
                            <span className="font-bold text-[10px] px-1.5 py-0.5 rounded mr-1 bg-emerald-100 text-emerald-800">
                              {g.source_type}
                            </span>
                            <span className="text-slate-700 line-clamp-1">{g.title}</span>
                          </div>
                          <span className="font-bold text-slate-900">{g.score}</span>
                        </div>
                      ))}
                    </div>

                    <Button
                      size="sm"
                      className="w-full bg-purple-600 hover:bg-purple-700 text-xs font-semibold"
                      onClick={() => handleGenerateReport(st.studentName)}
                      disabled={generateReportMutation.isPending && selectedStudent === st.studentName}
                    >
                      {generateReportMutation.isPending && selectedStudent === st.studentName
                        ? "AI Menyusun Rapor..."
                        : "✨ Generate Narasi Rapor AI"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
