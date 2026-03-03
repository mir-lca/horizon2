/**
 * Business Unit Badge Component
 *
 * Displays business unit name and headcount by fetching from org data.
 * Uses React Query for caching to avoid repeated API calls.
 */

"use client";

import React from "react";
import { useBusinessUnit } from "@/contexts/org-data-context";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface BusinessUnitBadgeProps {
  buId: string | undefined;
  showHeadcount?: boolean;
  className?: string;
}

export function BusinessUnitBadge({
  buId,
  showHeadcount = true,
  className = "",
}: BusinessUnitBadgeProps) {
  const { data: bu, isLoading, error } = useBusinessUnit(buId);

  if (!buId) {
    return (
      <Badge variant="outline" className={className}>
        No BU
      </Badge>
    );
  }

  if (isLoading) {
    return (
      <Badge variant="outline" className={className}>
        <Loader2 className="h-3 w-3 animate-spin mr-1" />
        Loading...
      </Badge>
    );
  }

  if (error || !bu) {
    return (
      <Badge variant="destructive" className={className}>
        {buId} (not found)
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={className}>
      {bu.name}
      {showHeadcount && (
        <span className="text-xs ml-1 opacity-70">({bu.headcount})</span>
      )}
    </Badge>
  );
}

/**
 * Simple text version (no badge styling)
 */
export function BusinessUnitText({ buId }: { buId: string | undefined }) {
  const { data: bu, isLoading } = useBusinessUnit(buId);

  if (!buId) return <span className="text-muted-foreground">No BU</span>;
  if (isLoading) return <span className="text-muted-foreground">Loading...</span>;
  if (!bu) return <span className="text-muted-foreground">{buId}</span>;

  return <span>{bu.name}</span>;
}
