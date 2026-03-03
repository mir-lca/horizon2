"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Project } from "@/lib/types";

interface BulkEditDialogProps {
  projectIds: string[];
  onClose: () => void;
  onSuccess: () => void;
}

type FieldKey = "status" | "riskLevel" | "estimateType";

interface FieldConfig {
  label: string;
  options: { value: string; label: string }[];
}

const FIELD_CONFIGS: Record<FieldKey, FieldConfig> = {
  status: {
    label: "Status",
    options: [
      { value: "unfunded", label: "Unfunded" },
      { value: "funded", label: "Funded" },
      { value: "active", label: "Active" },
      { value: "completed", label: "Completed" },
    ],
  },
  riskLevel: {
    label: "Risk level",
    options: [
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" },
      { value: "critical", label: "Critical" },
    ],
  },
  estimateType: {
    label: "Estimate type",
    options: [
      { value: "rough", label: "Rough" },
      { value: "budget", label: "Budget" },
      { value: "definitive", label: "Definitive" },
      { value: "detailed", label: "Detailed" },
    ],
  },
};

const FIELD_KEYS: FieldKey[] = ["status", "riskLevel", "estimateType"];

export function BulkEditDialog({
  projectIds,
  onClose,
  onSuccess,
}: BulkEditDialogProps) {
  const [enabled, setEnabled] = useState<Record<FieldKey, boolean>>({
    status: false,
    riskLevel: false,
    estimateType: false,
  });
  const [values, setValues] = useState<Record<FieldKey, string>>({
    status: "",
    riskLevel: "",
    estimateType: "",
  });
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  const isUpdating = progress !== null;
  const activeFields = FIELD_KEYS.filter((k) => enabled[k] && values[k]);

  const handleSubmit = async () => {
    if (activeFields.length === 0) return;

    const payload: Partial<Project> = {};
    for (const field of activeFields) {
      (payload as Record<string, string>)[field] = values[field];
    }

    setProgress({ current: 0, total: projectIds.length });

    let failed = 0;
    for (let i = 0; i < projectIds.length; i++) {
      const id = projectIds[i];
      setProgress({ current: i + 1, total: projectIds.length });
      try {
        const res = await fetch(`/api/projects/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) failed++;
      } catch {
        failed++;
      }
    }

    setProgress(null);

    if (failed === 0) {
      toast.success(
        `${projectIds.length} project${projectIds.length !== 1 ? "s" : ""} updated`
      );
      onSuccess();
    } else {
      toast.error(`${failed} update${failed !== 1 ? "s" : ""} failed`);
      if (failed < projectIds.length) onSuccess();
    }
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Bulk edit {projectIds.length} project{projectIds.length !== 1 ? "s" : ""}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Check the fields you want to update. Only checked fields will be changed.
          </p>

          {FIELD_KEYS.map((key) => {
            const config = FIELD_CONFIGS[key];
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`enable-${key}`}
                    checked={enabled[key]}
                    onCheckedChange={(checked) =>
                      setEnabled((prev) => ({
                        ...prev,
                        [key]: checked === true,
                      }))
                    }
                  />
                  <Label htmlFor={`enable-${key}`} className="text-sm font-medium cursor-pointer">
                    Update {config.label.toLowerCase()}
                  </Label>
                </div>
                {enabled[key] && (
                  <Select
                    value={values[key]}
                    onValueChange={(v) =>
                      setValues((prev) => ({ ...prev, [key]: v }))
                    }
                  >
                    <SelectTrigger className="ml-6">
                      <SelectValue placeholder={`Select ${config.label.toLowerCase()}...`} />
                    </SelectTrigger>
                    <SelectContent>
                      {config.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            );
          })}

          {isUpdating && progress && (
            <div className="space-y-1.5">
              <p className="text-sm text-muted-foreground">
                Updating {progress.current} of {progress.total} projects...
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
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isUpdating || activeFields.length === 0}
          >
            {isUpdating
              ? `Updating ${progress?.current ?? 0} of ${progress?.total}...`
              : `Apply to ${projectIds.length} project${projectIds.length !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
