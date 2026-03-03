"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Lock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useGovernanceStages, useUpsertGovernanceStage, useDeleteGovernanceStage } from "@/lib/queries";
import type { GovernanceStage } from "@/lib/types";

interface StageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stage?: GovernanceStage;
  nextSortOrder: number;
}

function StageDialog({ open, onOpenChange, stage, nextSortOrder }: StageDialogProps) {
  const [name, setName] = useState(stage?.name ?? "");
  const [description, setDescription] = useState(stage?.description ?? "");
  const [criteria, setCriteria] = useState(stage?.criteria ?? "");
  const [requiresApproval, setRequiresApproval] = useState(stage?.requiresApproval ?? false);
  const [sortOrder, setSortOrder] = useState(stage?.sortOrder?.toString() ?? nextSortOrder.toString());

  const upsertStage = useUpsertGovernanceStage();
  const deleteStage = useDeleteGovernanceStage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await upsertStage.mutateAsync({
      id: stage?.id,
      name,
      description: description || undefined,
      criteria: criteria || undefined,
      requiresApproval,
      sortOrder: parseInt(sortOrder, 10) || nextSortOrder,
    });
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!stage) return;
    if (!window.confirm(`Delete stage "${stage.name}"?`)) return;
    await deleteStage.mutateAsync({ id: stage.id });
    onOpenChange(false);
  };

  const isPending = upsertStage.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{stage ? "Edit stage" : "Add stage"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gs-name">Name *</Label>
            <Input id="gs-name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gs-desc">Description</Label>
            <Textarea id="gs-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="resize-none" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gs-criteria">Exit criteria</Label>
            <Textarea id="gs-criteria" value={criteria} onChange={(e) => setCriteria(e.target.value)} rows={2} className="resize-none" placeholder="What must be true to leave this stage?" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gs-order">Sort order</Label>
              <Input id="gs-order" type="number" min={0} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
            </div>
            <div className="flex items-end gap-2 pb-0.5">
              <div className="flex items-center gap-2">
                <input
                  id="gs-approval"
                  type="checkbox"
                  checked={requiresApproval}
                  onChange={(e) => setRequiresApproval(e.target.checked)}
                  className="rounded border"
                />
                <Label htmlFor="gs-approval">Requires approval</Label>
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            {stage && (
              <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={deleteStage.isPending}>
                <Trash2 className="h-3 w-3 mr-1" /> Delete
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save"}</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface StageCardProps {
  stage: GovernanceStage;
  onEdit: (stage: GovernanceStage) => void;
}

function StageCard({ stage, onEdit }: StageCardProps) {
  return (
    <div className="flex flex-col gap-1.5 border rounded-lg p-3 bg-card min-w-[140px] max-w-[180px] flex-shrink-0 group relative hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-1">
        <p className="text-sm font-medium leading-snug flex-1">{stage.name}</p>
        {stage.requiresApproval && (
          <Lock className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" aria-label="Requires approval" />
        )}
      </div>
      {stage.description && (
        <p className="text-xs text-muted-foreground leading-snug line-clamp-2">{stage.description}</p>
      )}
      <div className="flex items-center gap-1 mt-auto pt-1">
        <Badge variant="secondary" className="text-xs">#{stage.sortOrder}</Badge>
        {stage.requiresApproval && (
          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">Approval</Badge>
        )}
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="absolute top-1.5 right-1.5 h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
        onClick={() => onEdit(stage)}
        aria-label={`Edit stage ${stage.name}`}
      >
        <Edit2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

export function GovernanceStagePipeline() {
  const { data: stages = [], isLoading } = useGovernanceStages();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<GovernanceStage | undefined>();

  const sortedStages = [...stages].sort((a: GovernanceStage, b: GovernanceStage) => a.sortOrder - b.sortOrder);
  const nextSortOrder = sortedStages.length > 0 ? sortedStages[sortedStages.length - 1].sortOrder + 10 : 10;

  const handleEdit = (stage: GovernanceStage) => {
    setEditingStage(stage);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingStage(undefined);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Governance stage pipeline</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Stages projects move through from initiation to completion</p>
        </div>
        <Button size="sm" variant="outline" onClick={handleAdd}>
          <Plus className="h-3 w-3 mr-1" /> Add stage
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {!isLoading && stages.length === 0 && (
        <p className="text-sm text-muted-foreground italic">No stages configured</p>
      )}

      {!isLoading && sortedStages.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
          {sortedStages.map((stage: GovernanceStage, idx: number) => (
            <div key={stage.id} className="flex items-center gap-1.5 flex-shrink-0">
              <StageCard stage={stage} onEdit={handleEdit} />
              {idx < sortedStages.length - 1 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}

      <StageDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        stage={editingStage}
        nextSortOrder={nextSortOrder}
      />
    </div>
  );
}
