"use client";

import { useState } from "react";
import { Plus, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useHeadcountTargets, useUpsertHeadcountTarget } from "@/lib/queries";
import type { HeadcountTarget } from "@/lib/types";

interface WorkforceHeadcountProps {
  businessUnitId: string;
  year: number;
}

interface EditingRow {
  targetId?: string;
  targetFte: string;
  notes: string;
  competenceId?: string;
  roleCategory?: string;
}

function GapBadge({ gap }: { gap: number }) {
  if (gap === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
        gap > 0
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      )}
    >
      {gap > 0 ? `+${gap}` : gap}
    </span>
  );
}

function InlineEditForm({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial: EditingRow;
  onSave: (row: EditingRow) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [targetFte, setTargetFte] = useState(initial.targetFte);
  const [notes, setNotes] = useState(initial.notes);

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min={0}
        step={0.5}
        value={targetFte}
        onChange={(e) => setTargetFte(e.target.value)}
        className="h-7 w-20 text-sm"
        placeholder="FTE"
        aria-label="Target FTE"
      />
      <Input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="h-7 text-sm"
        placeholder="Notes..."
        aria-label="Notes"
      />
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-green-600"
        disabled={isSaving || !targetFte}
        onClick={() => onSave({ ...initial, targetFte, notes })}
        aria-label="Save"
      >
        <Check className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-muted-foreground"
        onClick={onCancel}
        aria-label="Cancel"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function WorkforceHeadcount({
  businessUnitId,
  year,
}: WorkforceHeadcountProps) {
  const { data: targets = [], isLoading } = useHeadcountTargets(
    businessUnitId,
    year
  );
  const upsert = useUpsertHeadcountTarget();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRole, setNewRole] = useState("");

  const handleSave = async (row: EditingRow) => {
    const fte = parseFloat(row.targetFte);
    if (isNaN(fte)) return;

    await upsert.mutateAsync({
      id: row.targetId,
      businessUnitId,
      effectiveYear: year,
      effectiveQuarter: 1,
      targetFte: fte,
      notes: row.notes || undefined,
      competenceId: row.competenceId,
      roleCategory: row.roleCategory || row.competenceId,
    });
    setEditingId(null);
    setShowAddForm(false);
    setNewRole("");
  };

  const handleAddNew = async (row: EditingRow) => {
    if (!newRole.trim() && !row.competenceId) return;
    await handleSave({ ...row, roleCategory: newRole || row.roleCategory });
  };

  // Current FTE is placeholder — would come from HR sync in a real integration
  const currentFte = "—";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Headcount targets for{" "}
          <span className="font-medium text-foreground">
            {businessUnitId}
          </span>{" "}
          — {year}
        </p>
        {!showAddForm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add target
          </Button>
        )}
      </div>

      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">
                Role / competence
              </th>
              <th className="text-center px-3 py-2 font-medium text-muted-foreground text-xs">
                Current FTE
              </th>
              <th className="text-center px-3 py-2 font-medium text-muted-foreground text-xs">
                Target FTE
              </th>
              <th className="text-center px-3 py-2 font-medium text-muted-foreground text-xs">
                Gap
              </th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">
                Notes
              </th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : (
              <>
                {targets.map((target) => {
                  const isEditing = editingId === target.id;
                  const gap = isNaN(Number(currentFte))
                    ? 0
                    : target.targetFte - Number(currentFte);

                  return (
                    <tr
                      key={target.id}
                      className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-3 py-2 font-medium">
                        {target.roleCategory ?? target.competenceId ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-center text-muted-foreground">
                        {currentFte}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {isEditing ? null : target.targetFte}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {isEditing ? null : <GapBadge gap={gap} />}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground text-xs" colSpan={isEditing ? 2 : 1}>
                        {isEditing ? (
                          <InlineEditForm
                            initial={{
                              targetId: target.id,
                              targetFte: String(target.targetFte),
                              notes: target.notes ?? "",
                              competenceId: target.competenceId,
                              roleCategory: target.roleCategory,
                            }}
                            onSave={handleSave}
                            onCancel={() => setEditingId(null)}
                            isSaving={upsert.isPending}
                          />
                        ) : (
                          target.notes ?? "—"
                        )}
                      </td>
                      {!isEditing && (
                        <td className="px-3 py-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground"
                            onClick={() => setEditingId(target.id)}
                            aria-label="Edit target"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  );
                })}

                {targets.length === 0 && !showAddForm && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-8 text-center text-sm text-muted-foreground"
                    >
                      No headcount targets set
                    </td>
                  </tr>
                )}

                {showAddForm && (
                  <tr className="border-b last:border-b-0 bg-muted/10">
                    <td className="px-3 py-2">
                      <Input
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="h-7 text-sm"
                        placeholder="Role or competence..."
                        aria-label="Role or competence"
                      />
                    </td>
                    <td className="px-3 py-2 text-center text-muted-foreground">
                      {currentFte}
                    </td>
                    <td colSpan={4} className="px-3 py-2">
                      <InlineEditForm
                        initial={{
                          targetFte: "",
                          notes: "",
                          roleCategory: newRole,
                        }}
                        onSave={handleAddNew}
                        onCancel={() => {
                          setShowAddForm(false);
                          setNewRole("");
                        }}
                        isSaving={upsert.isPending}
                      />
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
