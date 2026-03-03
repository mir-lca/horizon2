"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";
import { useAuditLog } from "@/lib/queries";
import type { AuditLogEntry } from "@/lib/types";

function formatTimestamp(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }) + " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function summarizePayload(payload?: Record<string, unknown>): string {
  if (!payload) return "-";
  const str = JSON.stringify(payload);
  return str.length > 80 ? str.slice(0, 80) + "..." : str;
}

interface AuditLogViewerProps {
  entityType: string;
  entityId: string;
}

export function AuditLogViewer({ entityType, entityId }: AuditLogViewerProps) {
  const [expanded, setExpanded] = useState(false);
  const { data: entries = [], isLoading, refetch, isFetching } = useAuditLog(entityType, entityId);

  const handleToggle = () => {
    setExpanded((prev) => !prev);
  };

  const ChevronIcon = expanded ? ChevronDown : ChevronRight;

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/30 transition-colors"
        onClick={handleToggle}
        aria-expanded={expanded}
      >
        <ChevronIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        <span className="text-sm font-medium">Audit log</span>
        {entries.length > 0 && (
          <span className="text-xs text-muted-foreground ml-1">({entries.length} entries)</span>
        )}
      </button>

      {expanded && (
        <div className="border-t">
          <div className="flex items-center justify-end px-3 py-2 bg-muted/20">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {isLoading && (
            <p className="text-sm text-muted-foreground px-3 py-4">Loading...</p>
          )}

          {!isLoading && entries.length === 0 && (
            <p className="text-sm text-muted-foreground italic px-3 py-4">No audit entries</p>
          )}

          {!isLoading && entries.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground whitespace-nowrap">Timestamp</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Actor</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Action</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {entries.map((entry: AuditLogEntry) => (
                    <tr key={entry.id} className="hover:bg-muted/20">
                      <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap font-mono">
                        {formatTimestamp(entry.createdAt)}
                      </td>
                      <td className="px-3 py-2 text-xs truncate max-w-[140px]" title={entry.actor}>
                        {entry.actor}
                      </td>
                      <td className="px-3 py-2 text-xs font-medium">{entry.action}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground font-mono truncate max-w-[240px]" title={summarizePayload(entry.payload)}>
                        {summarizePayload(entry.payload)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
