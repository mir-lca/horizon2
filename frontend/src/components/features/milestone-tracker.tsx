"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Check, AlertCircle, Clock, PlayCircle } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMilestones, useCreateMilestone, useUpdateMilestone, useDeleteMilestone } from "@/lib/queries";
import type { Milestone } from "@/lib/types";

const STATUS_CONFIG = {
  pending: { label: "Pending", icon: Clock, color: "secondary" as const },
  in_progress: { label: "In progress", icon: PlayCircle, color: "default" as const },
  completed: { label: "Completed", icon: Check, color: "secondary" as const },
  at_risk: { label: "At risk", icon: AlertCircle, color: "destructive" as const },
};

interface MilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  milestone?: Milestone;
}

function MilestoneDialog({ open, onOpenChange, projectId, milestone }: MilestoneDialogProps) {
  const [name, setName] = useState(milestone?.name ?? "");
  const [dueDate, setDueDate] = useState(milestone?.dueDate ?? "");
  const [status, setStatus] = useState<Milestone["status"]>(milestone?.status ?? "pending");
  const [owner, setOwner] = useState(milestone?.owner ?? "");
  const [description, setDescription] = useState(milestone?.description ?? "");

  const createMilestone = useCreateMilestone();
  const updateMilestone = useUpdateMilestone();
  const deleteMilestone = useDeleteMilestone();

  // Reset form when milestone changes
  useEffect(() => {
    setName(milestone?.name ?? "");
    setDueDate(milestone?.dueDate ?? "");
    setStatus(milestone?.status ?? "pending");
    setOwner(milestone?.owner ?? "");
    setDescription(milestone?.description ?? "");
  }, [milestone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (milestone) {
      await updateMilestone.mutateAsync({ id: milestone.id, projectId, name, dueDate, status, owner, description });
    } else {
      await createMilestone.mutateAsync({ projectId, name, dueDate, status, owner, description });
    }
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!milestone) return;
    if (!window.confirm("Delete this milestone?")) return;
    await deleteMilestone.mutateAsync({ id: milestone.id, projectId });
    onOpenChange(false);
  };

  const isPending = createMilestone.isPending || updateMilestone.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{milestone ? "Edit milestone" : "Add milestone"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ms-name">Name *</Label>
            <Input id="ms-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ms-due">Due date</Label>
            <Input id="ms-due" type="date" value={dueDate ?? ""} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ms-status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as Milestone["status"])}>
              <SelectTrigger id="ms-status"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                  <SelectItem key={value} value={value}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ms-owner">Owner</Label>
            <Input id="ms-owner" value={owner ?? ""} onChange={(e) => setOwner(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ms-desc">Description</Label>
            <Input id="ms-desc" value={description ?? ""} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <DialogFooter className="flex justify-between">
            {milestone && (
              <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={deleteMilestone.isPending}>
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

interface MilestoneTrackerProps {
  projectId: string;
}

export function MilestoneTracker({ projectId }: MilestoneTrackerProps) {
  const { data: milestones = [], isLoading } = useMilestones(projectId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Milestone | undefined>();

  const handleEdit = (m: Milestone) => {
    setEditing(m);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Milestones</h3>
        <Button size="sm" variant="outline" onClick={handleAdd}>
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {!isLoading && milestones.length === 0 && (
        <p className="text-sm text-muted-foreground italic">No milestones yet</p>
      )}

      <div className="space-y-2">
        {milestones.map((m: Milestone) => {
          const cfg = STATUS_CONFIG[m.status] ?? STATUS_CONFIG.pending;
          const Icon = cfg.icon;
          return (
            <div
              key={m.id}
              className="flex items-center gap-2 p-2 rounded-md border bg-card hover:bg-accent/50 cursor-pointer group"
              onClick={() => handleEdit(m)}
            >
              <Icon className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.name}</p>
                {m.dueDate && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(m.dueDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Badge variant={cfg.color} className="text-xs flex-shrink-0">{cfg.label}</Badge>
              <Edit2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0" />
            </div>
          );
        })}
      </div>

      <MilestoneDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={projectId}
        milestone={editing}
      />
    </div>
  );
}
