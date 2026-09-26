import React, { useState } from "react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../context/AuthContext";
import { DashboardLayout } from "../components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { MaterialDialog } from "../components/MaterialDialog";

export const MaterialsPage: React.FC = () => {
  const { user } = useAuth();
  const [selected, setSelected] = useState<any | null>(null);
  const [hideTarget, setHideTarget] = useState<any | null>(null);

  const { data: materials, isLoading, refetch } = trpc.material.listByTeacher.useQuery(
    { teacherId: user?.id || "" },
    { enabled: !!user }
  );

  const deleteMutation = trpc.material.delete.useMutation();

  const handleHide = async () => {
    if (!hideTarget) return;
    try {
      await deleteMutation.mutateAsync({ materialId: hideTarget.id });
      setHideTarget(null);
      refetch();
    } catch (err: any) {
      alert(err.message || "Gagal menyembunyikan materi");
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs text-neutral-400">Arsip pembelajaran</p>
            <h1 className="text-xl font-medium tracking-tight text-neutral-950 mt-2">Materi untuk Siswa</h1>
            <p className="text-sm text-neutral-500 mt-1">
              Materi yang sudah dibagikan ke siswa. Sembunyikan untuk menariknya dari daftar bacaan.
            </p>
          </div>
          <Button size="sm" className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-sm" onClick={() => (window.location.href = "/material")}>
            + Generator Materi
          </Button>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="w-full h-16" />
            <Skeleton className="w-full h-16" />
          </div>
        ) : !materials || materials.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-neutral-300">
            <p className="text-sm font-medium text-neutral-700">Belum ada materi dibagikan</p>
            <p className="text-sm text-neutral-500 max-w-sm mx-auto mt-1">
              Susun materi lewat generator AI. Hasilnya langsung tersimpan dan terbuka untuk siswa.
            </p>
            <Button size="sm" className="bg-neutral-900 hover:bg-neutral-800 text-white mt-4 rounded-sm" onClick={() => (window.location.href = "/material")}>
              Buka Generator Materi
            </Button>
          </div>
        ) : (
          <ul className="list-none p-0 m-0 flex flex-col divide-y divide-neutral-200 border border-neutral-200">
            {materials.map((m: any) => (
              <li key={m.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-950 truncate">{m.title}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {m.subject} · {m.grade_level} ·{" "}
                    {new Date(m.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <Button size="sm" variant="outline" className="rounded-sm flex-shrink-0" onClick={() => setSelected(m)}>
                  Lihat
                </Button>
                <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 flex-shrink-0" onClick={() => setHideTarget(m)}>
                  Sembunyikan
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <MaterialDialog material={selected} open={!!selected} onOpenChange={(o) => !o && setSelected(null)} />
      )}

      <Dialog open={!!hideTarget} onOpenChange={(o) => !o && setHideTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Sembunyikan Materi?</DialogTitle>
            <DialogDescription>
              "{hideTarget?.title}" akan ditarik dari daftar bacaan siswa dan dihapus dari arsip. Tindakan ini tidak bisa dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" className="rounded-sm" onClick={() => setHideTarget(null)}>Batal</Button>
            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white rounded-sm" onClick={handleHide} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Memproses..." : "Sembunyikan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};
