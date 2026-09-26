import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { useAuth } from "../context/AuthContext";
import { DashboardLayout } from "../components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";

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
    { teacherId: user?.id || "" }, { enabled: !!user }
  );

  const createMutation = trpc.document.create.useMutation();
  const deleteMutation = trpc.document.delete.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!user) return;
    try {
      await createMutation.mutateAsync({ teacherId: user.id, title, type, subject, gradeLevel, content });
      setTitle(""); setSubject(""); setGradeLevel(""); setContent("");
      refetch();
    } catch (err: any) { setError(err.message || "Gagal menyimpan dokumentasi"); }
  };

  const handleDelete = async (id: string) => {
    if (!user || !confirm("Yakin ingin menghapus dokumen ini?")) return;
    try {
      await deleteMutation.mutateAsync({ id, teacherId: user.id });
      if (selectedDoc?.id === id) setSelectedDoc(null);
      refetch();
    } catch (err: any) { alert(err.message || "Gagal menghapus dokumen"); }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">Dokumentasi Materi & Tugas</h1>
                <p className="text-xs text-neutral-500">Semai · Pusat Arsip Pembelajaran & Penugasan Guru</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>Batal</Button>
            </div>
          </CardContent>
        </Card>

        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        <div className="grid grid-cols-1 gap-6">
          {/* Form */}
          <Card>
            <CardContent className="pt-5 flex flex-col gap-4">
              <h3 className="text-base font-semibold text-neutral-800">Tambahkan Arsip Baru</h3>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <Label>Judul Dokumen</Label>
                  <Input placeholder="Misal: Rencana Tugas Bab 3" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Tipe Dokumen</Label>
                  <select className="border border-neutral-300 rounded-md px-3 py-2 text-sm" value={type} onChange={(e) => setType(e.target.value as any)}>
                    <option value="materi">Materi Pembelajaran</option>
                    <option value="tugas">Tugas / Penugasan</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Mata Pelajaran</Label>
                  <Input placeholder="Misal: IPA" value={subject} onChange={(e) => setSubject(e.target.value)} required />
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Kelas / Tingkat</Label>
                  <Input placeholder="Misal: Kelas 7 SMP" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} required />
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Isi Dokumen / Teks Tugas</Label>
                  <Textarea rows={5} placeholder="Ketik detail materi atau rincian instruksi tugas..." value={content} onChange={(e) => setContent(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Simpan..." : "Simpan Arsip"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Document List */}
          <div className="flex flex-col gap-4">
            <h3 className="text-base font-semibold text-neutral-900">Daftar Dokumen Tersimpan</h3>
            {isLoading ? (
              <div className="flex flex-col gap-2 p-4">
                <Skeleton className="w-full h-10" />
                <Skeleton className="w-full h-10" />
                <Skeleton className="w-full h-10" />
              </div>
            ) : !documents || documents.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-neutral-200 rounded-md">
                <p className="text-base font-semibold text-neutral-600">Belum Ada Dokumen</p>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
                  Gunakan form di atas untuk menyimpan dokumentasi materi atau tugas.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {documents.map((doc: any) => (
                  <Card
                    key={doc.id}
                    className={`cursor-pointer transition-colors ${selectedDoc?.id === doc.id ? "border-blue-500 bg-blue-50" : "hover:border-neutral-300"}`}
                    onClick={() => setSelectedDoc(doc)}
                  >
                    <CardContent className="pt-4 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant={doc.type === "materi" ? "default" : "secondary"}>
                              {doc.type === "materi" ? "Materi" : "Tugas"}
                            </Badge>
                            <span className="text-xs text-neutral-500">{doc.subject} · {doc.grade_level}</span>
                          </div>
                          <p className="text-base font-bold text-neutral-900 mt-1">{doc.title}</p>
                        </div>
                        <Button
                          variant="ghost" size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                        >
                          Hapus
                        </Button>
                      </div>
                      <p className="text-xs text-neutral-500 line-clamp-2">{doc.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {selectedDoc && (
              <Card className="border border-blue-300 mt-6">
                <CardContent className="pt-5 flex flex-col gap-4">
                  <div className="border-b pb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={selectedDoc.type === "materi" ? "default" : "secondary"}>
                        {selectedDoc.type === "materi" ? "Materi" : "Tugas"}
                      </Badge>
                      <span className="text-xs text-neutral-500">{selectedDoc.subject} · {selectedDoc.grade_level}</span>
                    </div>
                    <h2 className="text-lg font-bold text-neutral-900 mt-1">{selectedDoc.title}</h2>
                  </div>
                  <div className="bg-neutral-50 p-4 border border-neutral-200 rounded whitespace-pre-line">
                    <p className="text-sm text-neutral-700 leading-relaxed">{selectedDoc.content}</p>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => setSelectedDoc(null)}>Tutup Pratinjau</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
