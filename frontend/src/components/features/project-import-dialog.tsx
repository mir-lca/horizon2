"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Download, Upload, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MockBadge } from "@/components/horizon-ui/mock-badge";

interface ProjectImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CSV_HEADERS = [
  "name",
  "description",
  "businessUnitId",
  "status",
  "riskLevel",
  "startYear",
  "startQuarter",
  "durationQuarters",
  "totalCost",
] as const;

interface ParsedRow {
  name: string;
  description?: string;
  businessUnitId: string;
  status?: string;
  riskLevel?: string;
  startYear?: string;
  startQuarter?: string;
  durationQuarters?: string;
  totalCost?: string;
  _error?: string;
}

function downloadTemplate() {
  const header = CSV_HEADERS.join(",");
  const example = [
    "Example project",
    "A sample project description",
    "ur",
    "funded",
    "medium",
    "2026",
    "1",
    "4",
    "500000",
  ].join(",");
  const csv = `${header}\n${example}\n`;
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "horizon-projects-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function parseCsv(text: string): ParsedRow[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const headers = headerLine.split(",").map((h) => h.trim().toLowerCase());

  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? "";
    });

    const parsed: ParsedRow = {
      name: row["name"] ?? "",
      description: row["description"] || undefined,
      businessUnitId: row["businessunitid"] ?? row["businessunitId"] ?? row["businessUnitId"] ?? "",
      status: row["status"] || undefined,
      riskLevel: row["risklevel"] ?? row["riskLevel"] || undefined,
      startYear: row["startyear"] ?? row["startYear"] || undefined,
      startQuarter: row["startquarter"] ?? row["startQuarter"] || undefined,
      durationQuarters:
        row["durationquarters"] ?? row["durationQuarters"] || undefined,
      totalCost: row["totalcost"] ?? row["totalCost"] || undefined,
    };

    if (!parsed.name) parsed._error = "Missing name";
    if (!parsed.businessUnitId) parsed._error = parsed._error
      ? `${parsed._error}, missing businessUnitId`
      : "Missing businessUnitId";

    return parsed;
  });
}

export function ProjectImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: ProjectImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mppInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  const isImporting = progress !== null;
  const validRows = parsedRows.filter((r) => !r._error);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setParsedRows(parseCsv(text));
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setProgress({ current: 0, total: validRows.length });

    let failed = 0;
    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      setProgress({ current: i + 1, total: validRows.length });
      try {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: row.name,
            description: row.description,
            businessUnitId: row.businessUnitId,
            status: row.status ?? "unfunded",
            riskLevel: row.riskLevel ?? "medium",
            startYear: row.startYear ? parseInt(row.startYear) : undefined,
            startQuarter: row.startQuarter ? parseInt(row.startQuarter) : undefined,
            durationQuarters: row.durationQuarters
              ? parseInt(row.durationQuarters)
              : undefined,
            totalCost: row.totalCost ? parseFloat(row.totalCost) : 0,
          }),
        });
        if (!res.ok) failed++;
      } catch {
        failed++;
      }
    }

    setProgress(null);

    if (failed === 0) {
      toast.success(
        `${validRows.length} project${validRows.length !== 1 ? "s" : ""} imported`
      );
      setParsedRows([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onSuccess();
      onOpenChange(false);
    } else {
      toast.error(`${failed} import${failed !== 1 ? "s" : ""} failed`);
      if (failed < validRows.length) onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import projects</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="csv" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="w-fit">
            <TabsTrigger value="csv">CSV import</TabsTrigger>
            <TabsTrigger value="msproject">From MS Project</TabsTrigger>
          </TabsList>

          <TabsContent value="csv" className="flex-1 overflow-y-auto space-y-4 mt-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Download template
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Choose CSV file
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
                aria-label="Select CSV file"
              />
            </div>

            {parsedRows.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Preview ({Math.min(parsedRows.length, 10)} of {parsedRows.length} rows,{" "}
                  {validRows.length} valid)
                </p>
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Name</th>
                        <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">BU ID</th>
                        <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Status</th>
                        <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Risk</th>
                        <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Start</th>
                        <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Cost</th>
                        <th className="text-left px-2 py-1.5 font-medium text-muted-foreground" />
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.slice(0, 10).map((row, i) => (
                        <tr
                          key={i}
                          className={
                            row._error
                              ? "border-b bg-red-50 dark:bg-red-950/20"
                              : "border-b last:border-b-0 hover:bg-muted/30"
                          }
                        >
                          <td className="px-2 py-1.5">{row.name || "—"}</td>
                          <td className="px-2 py-1.5">{row.businessUnitId || "—"}</td>
                          <td className="px-2 py-1.5">{row.status || "—"}</td>
                          <td className="px-2 py-1.5">{row.riskLevel || "—"}</td>
                          <td className="px-2 py-1.5">
                            {row.startYear
                              ? `${row.startYear} Q${row.startQuarter ?? "?"}`
                              : "—"}
                          </td>
                          <td className="px-2 py-1.5">{row.totalCost || "—"}</td>
                          <td className="px-2 py-1.5 text-red-600 dark:text-red-400 text-[10px]">
                            {row._error}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {isImporting && progress && (
                  <div className="space-y-1.5">
                    <p className="text-sm text-muted-foreground">
                      Importing {progress.current} of {progress.total} projects...
                    </p>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{
                          width: `${(progress.current / progress.total) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={handleImport}
                    disabled={isImporting || validRows.length === 0}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-1.5" />
                    {isImporting
                      ? `Importing ${progress?.current ?? 0} of ${progress?.total}...`
                      : `Import ${validRows.length} project${validRows.length !== 1 ? "s" : ""}`}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="msproject" className="mt-4 space-y-4">
            <div className="flex items-center gap-2">
              <MockBadge system="Microsoft Project" />
            </div>
            <p className="text-sm text-muted-foreground">
              Schedule will be imported once Microsoft Project integration is configured.
            </p>
            <div className="rounded-md border bg-muted/30 p-6 flex flex-col items-center gap-3 text-center">
              <FileSpreadsheet className="h-10 w-10 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">
                Upload an .mpp file to import your project schedule
              </p>
              <Button
                variant="outline"
                size="sm"
                disabled
                onClick={() => mppInputRef.current?.click()}
                title="Microsoft Project integration not yet configured"
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Choose .mpp file
              </Button>
              <input
                ref={mppInputRef}
                type="file"
                accept=".mpp"
                className="hidden"
                aria-label="Select MPP file"
              />
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                disabled
                title="Microsoft Project integration not yet configured"
              >
                Configure MS Project
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
