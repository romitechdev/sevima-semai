import React, { useState } from "react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../context/AuthContext";
import { DashboardLayout } from "../components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MaterialDialog } from "../components/MaterialDialog";

export const MaterialsPage: React.FC = () => {
  const { user } = useAuth();
  const [selected, setSelected] = useState<any | null>(null);

  const { data: materials, isLoading, refetch } = trpc.material.listByTeacher.useQuery(
    { teacherId: user?.id || "" },
    { enabled: !!user }
  );

  const deleteMutation = trpc.material.delete.useMutation();

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Hapus materi "${title}"? Kode aksesnya akan tidak bisa dipakai lagi.`)) return;
    try {
      await deleteMutation.mutateAsync({ materialId: id });
      refetch();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus materi");
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-xs text-neutral-400">Arsip pembelajaran</p>
          <h1 className="text-xl font-medium tracking-tight text-neutral-950 mt-2">Materi untuk Siswa</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Materi hasil generator AI yang sudah disimpan. Siswa membuka lewat kode akses.
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="w-full h-16" />
            <Skeleton className="w-full h-16" />
          </div>
        ) : !materials || materials.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-neutral-300">
            <p className="text-sm font-medium text-neutral-700">Belum ada materi tersimpan</p>
            <p className="text-sm text-neutral-500 max-w-sm mx-auto mt-1">
              Susun materi lewat generator AI, lalu simpan agar bisa dibagikan ke siswa lewat kode akses.
            </p>
            <Button size="sm" className="bg-neutral-900 hover:bg-neutral-800 text-white mt-4 rounded-sm" onClick={() => (window.location.href = "/material")}>
              Buka Generator Materi
            </Button>
          </div>
        ) : (
          <ul className="list-none p-0 m-0 flex flex-col divide-y divide-neutral-200 border border-neutral-200">
            {materials.map((m: any) => (
              <li key={m.id} className="flex items-center gap-4 px-4 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-950 truncate">{m.title}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {m.subject} · {m.grade_level}
                  </p>
                </div>
                <Badge variant="secondary" className="font-mono flex-shrink-0 hidden sm:inline-flex">{m.access_code}</Badge>
                <Button size="sm" variant="outline" className="rounded-sm flex-shrink-0" onClick={() => setSelected(m)}>
                  Buka
                </Button>
                <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 flex-shrink-0" onClick={() => handleDelete(m.id, m.title)}>
                  Hapus
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <MaterialDialog material={selected} open={!!selected} onOpenChange={(o) => !o && setSelected(null)} />
      )}
    </DashboardLayout>
  );
};
