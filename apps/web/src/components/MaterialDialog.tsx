import React, { useState } from "react";
import { trpc } from "../lib/trpc";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Material {
  id: string;
  title: string;
  subject: string;
  grade_level: string;
  access_code: string;
  content: {
    summary?: string;
    keyPoints?: string[];
    explanation?: string;
    interactiveActivity?: string;
  };
  created_at: string;
}

export const MaterialDialog: React.FC<{
  material: Material;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ material, open, onOpenChange }) => {
  const [showFull, setShowFull] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(material.access_code);
    } catch {
      /* clipboard not available */
    }
  };

  const c = material.content || {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">{material.subject}</Badge>
            <Badge variant="secondary">{material.grade_level}</Badge>
          </div>
          <DialogTitle>{material.title}</DialogTitle>
          <DialogDescription>
            Dibagikan oleh pengajar · Kode akses{" "}
            <button
              onClick={copyCode}
              className="font-mono text-neutral-950 underline underline-offset-2 hover:no-underline"
              aria-label="Salin kode akses"
            >
              {material.access_code}
            </button>{" "}
            untuk membuka materi ini.
          </DialogDescription>
        </DialogHeader>

        {c.summary && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs uppercase tracking-wider text-neutral-400 select-none">Ringkasan</p>
            <p className="text-sm text-neutral-700 leading-relaxed">{c.summary}</p>
          </div>
        )}

        {c.keyPoints && c.keyPoints.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs uppercase tracking-wider text-neutral-400 select-none">Poin Utama</p>
            <ul className="flex flex-col gap-1.5 list-none p-0 m-0">
              {c.keyPoints.map((pt, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                  <span className="text-neutral-400 flex-shrink-0 mt-0.5">•</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {c.explanation && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs uppercase tracking-wider text-neutral-400 select-none">Penjelasan Lengkap</p>
            <div className="bg-neutral-50 border border-neutral-200 rounded-sm p-4 max-h-72 overflow-y-auto">
              <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
                {showFull ? c.explanation : c.explanation.slice(0, 700) + (c.explanation.length > 700 ? "…" : "")}
              </p>
            </div>
            {c.explanation.length > 700 && (
              <Button variant="ghost" size="sm" className="self-start px-0" onClick={() => setShowFull(!showFull)}>
                {showFull ? "Tampilkan ringkas" : "Tampilkan seluruh penjelasan"}
              </Button>
            )}
          </div>
        )}

        {c.interactiveActivity && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs uppercase tracking-wider text-neutral-400 select-none">Aktivitas Interaktif</p>
            <div className="bg-neutral-100 border border-neutral-200 rounded-sm p-4">
              <p className="text-sm text-neutral-700">{c.interactiveActivity}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
