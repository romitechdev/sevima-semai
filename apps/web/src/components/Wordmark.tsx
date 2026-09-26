import React from "react";
import { cn } from "@/lib/utils";

interface WordmarkProps {
  className?: string;
  taglineClassName?: string;
}

export const Wordmark: React.FC<WordmarkProps> = ({ className, taglineClassName }) => (
  <span className={cn("flex items-baseline gap-1.5 select-none", className)}>
    <span className="font-heading text-[1.1em] font-semibold tracking-tight text-neutral-950">
      Semai
    </span>
    <span className={cn("text-[0.6em] font-medium tracking-[0.14em] uppercase text-neutral-400", taglineClassName)} aria-hidden="true">
      Pengajar
    </span>
  </span>
);
