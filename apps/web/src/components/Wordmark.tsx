import React from "react";
import { cn } from "@/lib/utils";

interface WordmarkProps {
  className?: string;
  taglineClassName?: string;
}

export const Wordmark: React.FC<WordmarkProps> = ({ className, taglineClassName }) => (
  <span className={cn("flex items-baseline gap-1.5 select-none", className)}>
    <span className="wordmark text-[1.15em] font-semibold tracking-tight text-neutral-900">
      Semai
    </span>
    <span className={cn("text-[0.62em] font-medium tracking-[0.18em] uppercase text-neutral-400", taglineClassName)} aria-hidden="true">
      Portal Guru
    </span>
  </span>
);
