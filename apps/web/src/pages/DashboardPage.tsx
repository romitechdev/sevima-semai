import React, { useState } from "react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../context/AuthContext";
import { DashboardLayout } from "../components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface QuizRow {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  code: string;
  createdAt: string;
  totalQuestions: number;
  totalStudents: number;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [agentInput, setAgentInput] = useState("");
  const [agentResult, setAgentResult] = useState<any | null>(null);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<QuizRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QuizRow | null>(null);

  const { data: quizzes, isLoading: isQuizzesLoading, refetch } = trpc.quiz.listByTeacher.useQuery(
    { teacherId: user?.id || "" },
    { enabled: !!user }
  );

  const { data: gradebookData } = trpc.gradebook.listByTeacher.useQuery(
    { teacherId: user?.id || "" },
    { enabled: !!user }
  );

  const { data: materials } = trpc.material.listByTeacher.useQuery(
    { teacherId: user?.id || "" },
    { enabled: !!user }
  );

  const executeAgentMutation = trpc.agent.executeCommand.useMutation();
  const updateQuizMutation = trpc.quiz.update.useMutation();
  const deleteQuizMutation = trpc.quiz.delete.useMutation();

  const handleAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAgentError(null);
    if (!agentInput || agentInput.trim().length < 3) {
      setAgentError("Masukkan instruksi minimal 3 karakter.");
      return;
    }
    try {
      const res = await executeAgentMutation.mutateAsync({ command: agentInput });
      setAgentResult(res);
    } catch (err: any) {
      setAgentError(err.message || "Gagal memproses instruksi.");
    }
  };

  const handleApplyAgentAction = () => {
    if (!agentResult) return;
    if (agentResult.actionType === "CREATE_QUIZ") {
      window.location.href = "/create";
    } else if (agentResult.actionType === "CREATE_MATERIAL") {
      window.location.href = "/material";
    } else if (agentResult.actionType === "DOCU_NOTE") {
      window.location.href = "/documents";
    }
  };

  const totalQuizzes = quizzes?.length || 0;
  const totalStudentsCount = gradebookData?.students?.length || 0;
  const totalGradesCount = gradebookData?.allGrades?.length || 0;
  const totalMaterials = materials?.length || 0;
  const submittedCount = quizzes?.reduce((sum, q) => sum + (q.totalStudents || 0), 0) || 0;
  const recentQuizzes = (quizzes || []).slice(0, 5);

  const teacherName = user?.user_metadata?.name as string | undefined;
  const greeting = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs text-neutral-400">{greeting}</p>
            <h1 className="text-xl font-medium tracking-tight text-neutral-950 mt-2">
              Selamat datang, {teacherName?.split(" ")[0] || "Pengajar"}
            </h1>
          </div>
          <Button className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-sm w-full sm:w-auto" onClick={() => (window.location.href = "/create")}>
            Buat Kuis Formatif
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-200 border border-neutral-200 overflow-hidden">
          {[
            { label: "Kuis Formatif", value: totalQuizzes, desc: "kuis terdaftar", link: "/create" },
            { label: "Materi Tersimpan", value: totalMaterials, desc: "bisa dibuka siswa", link: "/materials" },
            { label: "Siswa Terdaftar", value: totalStudentsCount, desc: "dalam gradebook", link: "/gradebook" },
            { label: "Rekap Nilai", value: totalGradesCount, desc: "nilai tersimpan", link: "/gradebook" },
          ].map((m) => (
            <a key={m.label} href={m.link} className="bg-white p-4 sm:p-5 hover:bg-neutral-50 transition-colors block">
              <p className="text-xs uppercase tracking-wider text-neutral-400 select-none">{m.label}</p>
              <p className="text-2xl sm:text-3xl font-medium tracking-tight text-neutral-950 mt-2 tabular-nums">{m.value}</p>
              <p className="text-xs text-neutral-400 mt-1">{m.desc}</p>
            </a>
          ))}
        </div>

        <Card>
          <CardContent className="pt-5 flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-xs uppercase tracking-wider text-neutral-400 select-none">Instruksi AI</h3>
                <p className="text-sm text-neutral-500 mt-1.5">Ketik perintah untuk membuat kuis, materi, atau arsip kelas.</p>
              </div>
              <Badge variant="secondary" className="font-mono">Agent</Badge>
            </div>
            <form onSubmit={handleAgentSubmit} noValidate>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Contoh: Buatkan 5 soal kuis tentang fotosintesis untuk kelas 5 SD"
                  aria-label="Instruksi untuk AI Agent"
                  value={agentInput}
                  onChange={(e) => setAgentInput(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" className="bg-neutral-900 hover:bg-neutral-800 text-white sm:w-auto rounded-sm" disabled={executeAgentMutation.isPending}>
                  {executeAgentMutation.isPending ? "Memproses..." : "Jalankan"}
                </Button>
              </div>
            </form>
            {agentError && <Alert variant="destructive"><AlertDescription>{agentError}</AlertDescription></Alert>}
            {agentResult && (
              <div className="bg-neutral-50 p-4 border border-neutral-200 rounded-sm flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono">{agentResult.actionType}</Badge>
                  <p className="text-sm font-medium text-neutral-950">{agentResult.title}</p>
                </div>
                <p className="text-sm text-neutral-600">{agentResult.summary}</p>
                <div className="bg-white p-3 border border-neutral-200 rounded-sm text-sm text-neutral-700 whitespace-pre-line leading-relaxed">
                  {agentResult.details}
                </div>
                {agentResult.suggestedTargetUrl && agentResult.actionType !== "ADVISE" && (
                  <Button size="sm" className="bg-neutral-900 hover:bg-neutral-800 text-white self-start rounded-sm" onClick={handleApplyAgentAction}>
                    Buka Modul Terkait
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-xs uppercase tracking-wider text-neutral-400 select-none">Kuis Formatif</h3>
                <p className="text-sm text-neutral-500 mt-1.5">Kuis terbaru. Klik judul untuk memantau, atau gunakan aksi edit dan hapus.</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-sm" onClick={() => (window.location.href = "/create")}>
                Buat Kuis Baru
              </Button>
            </div>

            {isQuizzesLoading ? (
              <div className="flex flex-col gap-3 p-1">
                <Skeleton className="w-full h-16" />
                <Skeleton className="w-full h-16" />
                <Skeleton className="w-full h-16" />
              </div>
            ) : !quizzes || quizzes.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-neutral-300">
                <p className="text-sm font-medium text-neutral-700">Belum ada kuis</p>
                <p className="text-sm text-neutral-500 max-w-sm mx-auto mt-1">
                  Buat kuis formatif pertama untuk mulai memantau pemahaman siswa secara real-time.
                </p>
                <Button size="sm" className="bg-neutral-900 hover:bg-neutral-800 text-white mt-4 rounded-sm" onClick={() => (window.location.href = "/create")}>
                  Buat Kuis Pertama
                </Button>
              </div>
            ) : (
              <ul className="list-none p-0 m-0 flex flex-col divide-y divide-neutral-200 border border-neutral-200">
                {recentQuizzes.map((q) => (
                  <li key={q.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-neutral-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => (window.location.href = `/monitor/${q.id}`)}
                        className="text-sm font-medium text-neutral-950 truncate hover:underline underline-offset-2"
                        aria-label={`Lihat detail kuis ${q.title}`}
                      >
                        {q.title}
                      </button>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {q.subject} · {q.gradeLevel} · {q.totalQuestions} soal
                      </p>
                    </div>
                    <span className="text-xs font-mono text-neutral-400 flex-shrink-0 hidden sm:inline">{q.code}</span>
                    <span className="text-sm font-medium text-neutral-700 tabular-nums flex-shrink-0">
                      {q.totalStudents} <span className="text-xs text-neutral-400 font-normal">siswa</span>
                    </span>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="sm" variant="ghost" className="rounded-sm" onClick={() => setEditTarget(q)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 rounded-sm" onClick={() => setDeleteTarget(q)}>
                        Hapus
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {editTarget && (
        <QuizEditModal
          key={editTarget.id}
          quiz={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => { setEditTarget(null); refetch(); }}
        />
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Kuis?</DialogTitle>
            <DialogDescription>
              Kuis "{deleteTarget?.title}" (kode {deleteTarget?.code}) akan dihapus permanen bersama seluruh jawaban siswa dan nilai terkait.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" className="rounded-sm" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white rounded-sm"
              disabled={deleteQuizMutation.isPending}
              onClick={async () => {
                if (!deleteTarget) return;
                try {
                  await deleteQuizMutation.mutateAsync({ quizId: deleteTarget.id });
                  setDeleteTarget(null);
                  refetch();
                } catch (err: any) {
                  alert(err.message || "Gagal menghapus kuis");
                }
              }}
            >
              {deleteQuizMutation.isPending ? "Menghapus..." : "Hapus Permanen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

const QuizEditModal: React.FC<{
  quiz: QuizRow;
  onClose: () => void;
  onSaved: () => void;
}> = ({ quiz, onClose, onSaved }) => {
  const [title, setTitle] = useState(quiz.title);
  const [subject, setSubject] = useState(quiz.subject);
  const [gradeLevel, setGradeLevel] = useState(quiz.gradeLevel);
  const [code, setCode] = useState(quiz.code);
  const [error, setError] = useState<string | null>(null);

  const updateMutation = trpc.quiz.update.useMutation();

  const handleSave = async () => {
    setError(null);
    try {
      await updateMutation.mutateAsync({
        quizId: quiz.id,
        title: title.trim() || undefined,
        subject: subject.trim() || undefined,
        gradeLevel: gradeLevel.trim() || undefined,
        code: code.trim() || undefined,
      });
      onSaved();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan perubahan");
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Kuis</DialogTitle>
          <DialogDescription>
            Ubah judul, mata pelajaran, kelas, atau kode akses. Perubahan kode membuat siswa pakai kode baru.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2 flex flex-col gap-1">
            <label className="text-sm text-neutral-600" htmlFor="edit-title">Judul</label>
            <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-neutral-600" htmlFor="edit-subject">Mata Pelajaran</label>
            <Input id="edit-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-neutral-600" htmlFor="edit-grade">Kelas</label>
            <Input id="edit-grade" placeholder="Contoh: Kelas 5 SD" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-neutral-600" htmlFor="edit-code">Kode Akses</label>
            <Input id="edit-code" className="font-mono" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={10} />
          </div>
        </div>
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        <DialogFooter>
          <Button variant="outline" size="sm" className="rounded-sm" onClick={onClose}>Batal</Button>
          <Button size="sm" className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-sm" onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
