import React, { useState } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicHeader } from "../components/PublicHeader";
import { MaterialDialog } from "../components/MaterialDialog";

export const TakeMaterialPage: React.FC = () => {
  const [selected, setSelected] = useState<any | null>(null);

  const { data: materials, isLoading } = trpc.material.listShared.useQuery();

  return (
    <div className="min-dvh bg-neutral-50 flex flex-col">
      <PublicHeader active="/materi" showLogin={false} />
      <main id="main-content" className="flex-1 p-4">
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          <div>
            <h1 className="text-xl font-medium tracking-tight text-neutral-950">Materi Belajar</h1>
            <p className="text-sm text-neutral-500 mt-1">
              Kumpulan bahan ajar yang dibagikan pengajar. Klik judul untuk membaca.
            </p>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="w-full h-20" />
              <Skeleton className="w-full h-20" />
              <Skeleton className="w-full h-20" />
            </div>
          ) : !materials || materials.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-neutral-300">
              <p className="text-sm font-medium text-neutral-700">Belum ada materi dibagikan</p>
              <p className="text-sm text-neutral-500 max-w-sm mx-auto mt-1">
                Cek kembali nanti. Materi baru akan muncul di sini saat pengajar membagikannya.
              </p>
              <Button size="sm" variant="outline" className="rounded-sm mt-4" onClick={() => (window.location.href = "/")}>
                Kembali ke Beranda
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {materials.map((m: any) => (
                <Card key={m.id}>
                  <CardContent className="pt-4">
                    <button
                      onClick={() => setSelected(m)}
                      className="w-full text-left flex items-center gap-4 group"
                      aria-label={`Baca materi ${m.title}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-950 truncate group-hover:underline underline-offset-2">
                          {m.title}
                        </p>
                        <p className="text-xs text-neutral-400 mt-1">
                          {m.subject} · {m.grade_level} ·{" "}
                          {new Date(m.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>
                      <span className="text-xs text-neutral-400 flex-shrink-0">Baca →</span>
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {selected && (
        <MaterialDetail materialId={selected.id} open onOpenChange={(o) => !o && setSelected(null)} />
      )}
    </div>
  );
};

const MaterialDetail: React.FC<{
  materialId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ materialId, open, onOpenChange }) => {
  const { data: material, isLoading } = trpc.material.getById.useQuery(
    { materialId },
    { enabled: open }
  );

  if (isLoading || !material) {
    return (
      <MaterialDialog
        material={{ id: materialId, title: "Memuat...", subject: "", grade_level: "", content: {}, created_at: new Date().toISOString() }}
        open={open}
        onOpenChange={onOpenChange}
      />
    );
  }
  return <MaterialDialog material={material} open={open} onOpenChange={onOpenChange} />;
};
