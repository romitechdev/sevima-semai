import React from "react";
import { Link } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicHeader } from "../components/PublicHeader";

export const TakeMaterialPage: React.FC = () => {
  const { data: materials, isLoading } = trpc.material.listShared.useQuery();

  return (
    <div className="min-h-dvh bg-neutral-50 flex flex-col">
      <PublicHeader active="/materi" />
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
                    <Link
                      to={`/materi/${m.id}`}
                      className="w-full flex items-center gap-4 group"
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
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
