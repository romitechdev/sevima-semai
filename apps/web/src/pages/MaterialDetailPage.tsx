import React from "react";
import { useParams, Link } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicHeader } from "../components/PublicHeader";

export const MaterialDetailPage: React.FC = () => {
  const { materialId } = useParams<{ materialId: string }>();

  const { data: material, isLoading, error } = trpc.material.getById.useQuery(
    { materialId: materialId! },
    { enabled: !!materialId }
  );

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-neutral-50 flex flex-col">
        <PublicHeader active="/materi" />
        <main id="main-content" className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            <Skeleton className="w-32 h-8 mb-6" />
            <Skeleton className="w-3/4 h-10 mb-4" />
            <Skeleton className="w-1/2 h-6 mb-8" />
            <Skeleton className="w-full h-24 mb-4" />
            <Skeleton className="w-full h-48" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="min-h-dvh bg-neutral-50 flex flex-col">
        <PublicHeader active="/materi" />
        <main id="main-content" className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
            <p className="text-lg font-medium text-neutral-950">Materi tidak ditemukan</p>
            <p className="text-sm text-neutral-500 mt-2">
              Materi mungkin sudah dihapus atau link salah.
            </p>
            <Link to="/materi">
              <Button size="sm" className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-sm mt-6">
                Kembali ke Daftar Materi
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const c = material.content || {};

  return (
    <div className="min-h-dvh bg-neutral-50 flex flex-col">
      <PublicHeader active="/materi" />
      <main id="main-content" className="flex-1">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <Link
            to="/materi"
            className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-950 transition-colors mb-6"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Semua Materi
          </Link>

          <header className="mb-8">
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {material.subject && <Badge variant="secondary">{material.subject}</Badge>}
              {material.grade_level && <Badge variant="secondary">{material.grade_level}</Badge>}
            </div>
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-neutral-950 leading-snug">
              {material.title}
            </h1>
            <p className="text-sm text-neutral-400 mt-2">
              Dibagikan oleh pengajar · {new Date(material.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </header>

          {c.summary && (
            <section className="mb-8">
              <h2 className="text-xs uppercase tracking-wider text-neutral-400 select-none mb-2">Ringkasan</h2>
              <p className="text-base text-neutral-700 leading-relaxed">{c.summary}</p>
            </section>
          )}

          {c.keyPoints && c.keyPoints.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xs uppercase tracking-wider text-neutral-400 select-none mb-3">Poin Utama</h2>
              <ul className="flex flex-col gap-2 list-none p-0 m-0">
                {c.keyPoints.map((pt: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-sm sm:text-base text-neutral-700">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-neutral-900 text-white text-xs flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {c.explanation && (
            <section className="mb-8">
              <h2 className="text-xs uppercase tracking-wider text-neutral-400 select-none mb-3">Penjelasan Lengkap</h2>
              <div className="bg-white border border-neutral-200 rounded-sm p-5 sm:p-6">
                <p className="text-sm sm:text-base text-neutral-700 leading-relaxed whitespace-pre-line">
                  {c.explanation}
                </p>
              </div>
            </section>
          )}

          {c.interactiveActivity && (
            <section className="mb-8">
              <h2 className="text-xs uppercase tracking-wider text-neutral-400 select-none mb-3">Aktivitas Interaktif</h2>
              <div className="bg-neutral-100 border border-neutral-200 rounded-sm p-5 sm:p-6">
                <p className="text-sm sm:text-base text-neutral-700 leading-relaxed">{c.interactiveActivity}</p>
              </div>
            </section>
          )}

          <footer className="border-t border-neutral-200 pt-6 mt-4">
            <Link to="/materi">
              <Button variant="outline" size="sm" className="rounded-sm">
                Kembali ke Daftar Materi
              </Button>
            </Link>
          </footer>
        </article>
      </main>
    </div>
  );
};
