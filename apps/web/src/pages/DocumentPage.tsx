import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { useAuth } from "../context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";

export const DocumentPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [type, setType] = useState<"materi" | "tugas">("materi");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  const { data: documents, isLoading, refetch } = trpc.document.listByTeacher.useQuery(
    { teacherId: user?.id || "" },
    { enabled: !!user }
  );

  const createMutation = trpc.document.create.useMutation();
  const deleteMutation = trpc.document.delete.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) return;

    try {
      await createMutation.mutateAsync({
        teacherId: user.id,
        title,
        type,
        subject,
        gradeLevel,
        content,
      });

      setTitle("");
      setSubject("");
      setGradeLevel("");
      setContent("");
      refetch();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan dokumentasi");
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !confirm("Yakin ingin menghapus dokumen ini?")) return;
    try {
      await deleteMutation.mutateAsync({ id, teacherId: user.id });
      if (selectedDoc?.id === id) setSelectedDoc(null);
      refetch();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus dokumen");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Dokumentasi Materi & Tugas</h1>
            <p className="text-slate-500 text-sm">Semai 🌱 — Pusat Arsip Pembelajaran & Penugasan Guru</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 border-slate-200 shadow-sm h-fit">
            <CardHeader>
              <CardTitle className="text-base text-slate-800">Tambahkan Arsip Baru</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="title">Judul Dokumen</Label>
                  <Input
                    id="title"
                    placeholder="Misal: Rencana Tugas Bab 3"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="type">Tipe Dokumen</Label>
                  <select
                    id="type"
                    className="w-full p-2 text-sm border rounded-md border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={type}
                    onChange={(e) => setType(e.target.value as "materi" | "tugas")}
                  >
                    <option value="materi">📖 Materi Pembelajaran</option>
                    <option value="tugas">📝 Tugas / Penugasan</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="subject">Mata Pelajaran</Label>
                  <Input
                    id="subject"
                    placeholder="Misal: IPA"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="gradeLevel">Kelas / Tingkat</Label>
                  <Input
                    id="gradeLevel"
                    placeholder="Misal: Kelas 7 SMP"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="content">Isi Dokumen / Teks Tugas</Label>
                  <textarea
                    id="content"
                    rows={5}
                    className="w-full p-2.5 text-sm border rounded-md border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ketik detail materi atau rincian instruksi tugas..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 font-semibold"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Simpan..." : "Simpan Arsip 📁"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Daftar Dokumen Tersimpan</h2>

            {isLoading ? (
              <div className="text-slate-500 text-center py-8">Memuat arsip...</div>
            ) : !documents || documents.length === 0 ? (
              <Card className="border-dashed border-2 border-slate-200 text-center p-8">
                <CardContent className="space-y-2 pt-2">
                  <div className="text-3xl">📁</div>
                  <CardTitle className="text-base text-slate-700">Belum Ada Dokumen</CardTitle>
                  <p className="text-slate-500 text-xs">
                    Gunakan form di samping untuk menyimpan dokumentasi materi atau tugas.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {documents.map((doc: any) => (
                  <Card
                    key={doc.id}
                    className={`border transition-all cursor-pointer ${
                      selectedDoc?.id === doc.id ? "border-emerald-500 bg-emerald-50/30" : "border-slate-200 bg-white"
                    }`}
                    onClick={() => setSelectedDoc(doc)}
                  >
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                              doc.type === "materi" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {doc.type === "materi" ? "📖 Materi" : "📝 Tugas"}
                          </span>
                          <span className="text-xs text-slate-500">
                            {doc.subject} • {doc.grade_level}
                          </span>
                        </div>
                        <CardTitle className="text-base font-bold text-slate-800 mt-1">
                          {doc.title}
                        </CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(doc.id);
                        }}
                      >
                        Hapus
                      </Button>
                    </CardHeader>
                    <CardContent className="text-xs text-slate-600 line-clamp-2 pt-0">
                      {doc.content}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {selectedDoc && (
              <Card className="border-emerald-300 bg-white mt-6 shadow-md">
                <CardHeader className="border-b pb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${
                        selectedDoc.type === "materi" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {selectedDoc.type === "materi" ? "📖 Materi" : "📝 Tugas"}
                    </span>
                    <span className="text-xs text-slate-500">
                      {selectedDoc.subject} • {selectedDoc.grade_level}
                    </span>
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-800 mt-1">
                    {selectedDoc.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="text-sm text-slate-800 whitespace-pre-line leading-relaxed font-sans bg-slate-50 p-4 rounded border border-slate-200">
                    {selectedDoc.content}
                  </div>
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => setSelectedDoc(null)}>
                      Tutup Pratinjau
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
