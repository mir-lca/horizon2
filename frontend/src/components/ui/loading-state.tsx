"use client";

import { cn } from "@/lib/utils";

export function LoadingState({
  message = "Loading...",
  showBackdrop = false,
}: {
  message?: string;
  showBackdrop?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-muted-foreground",
        showBackdrop && "fixed inset-0 z-50 bg-background/70 backdrop-blur-sm"
      )}
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/40 border-t-primary" />
      <div className="text-sm">{message}</div>
    </div>
  );
}
