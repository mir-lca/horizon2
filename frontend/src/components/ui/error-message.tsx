"use client";

import Link from "next/link";
import { Button } from "tr-workspace-components";

export function ErrorMessage({
  message,
  backHref,
  backLabel = "Go back",
}: {
  message: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
      <p className="text-sm text-destructive">{message}</p>
      {backHref && (
        <Button asChild variant="outline">
          <Link href={backHref}>{backLabel}</Link>
        </Button>
      )}
    </div>
  );
}
