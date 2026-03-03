"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Shield, AlertTriangle, XCircle, CheckCircle } from "lucide-react";
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
import { useRisks, useCreateRisk, useUpdateRisk, useDeleteRisk } from "@/lib/queries";
import type { Risk } from "@/lib/types";

const IMPACT_COLOR: Record<string, "destructive" | "secondary" | "default" | "outline"> = {
  critical: "destructive",
  high: "destructive",
  medium: "default",
  low: "secondary",
};

const STATUS_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  open: AlertTriangle,
  mitigated: Shield,
  closed: CheckCircle,
  accepted: XCircle,
};

interface RiskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string;
  entityType: string;
  risk?: Risk;
}

function RiskDialog({ open, onOpenChange, entityId, entityType, risk }: RiskDialogProps) {
  const [title, setTitle] = useState(risk?.title ?? "");
  const [description, setDescription] = useState(risk?.description ?? "");
  const [probability, setProbability] = useState(risk?.probability ?? "medium");
  const [impact, setImpact] = useState(risk?.impact ?? "medium");
  const [status, setStatus] = useState<Risk["status"]>(risk?.status ?? "open");
  const [owner, setOwner] = useState(risk?.owner ?? "");
  const [mitigation, setMitigation] = useState(risk?.mitigation ?? "");

  const createRisk = useCreateRisk();
  const updateRisk = useUpdateRisk();
  const deleteRisk = useDeleteRisk();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (risk) {
      await updateRisk.mutateAsync({ id: risk.id, entityId, title, description, probability, impact, status, owner, mitigation });
    } else {
      await createRisk.mutateAsync({ entityType, entityId, title, description, probability, impact, status, owner, mitigation });
    }
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!risk) return;
    if (!window.confirm("Delete this risk?")) return;
    await deleteRisk.mutateAsync({ id: risk.id, entityId });
    onOpenChange(false);
  };

  const isPending = createRisk.isPending || updateRisk.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{risk ? "Edit risk" : "Add risk"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="risk-title">Title *</Label>
            <Input id="risk-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="risk-desc">Description</Label>
            <Input id="risk-desc" value={description ?? ""} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Probability</Label>
              <Select value={probability ?? "medium"} onValueChange={setProbability}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["low", "medium", "high"].map((v) => (
                    <SelectItem key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Impact</Label>
              <Select value={impact ?? "medium"} onValueChange={setImpact}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["low", "medium", "high", "critical"].map((v) => (
                    <SelectItem key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Risk["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["open", "mitigated", "closed", "accepted"].map((v) => (
                    <SelectItem key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="risk-owner">Owner</Label>
              <Input id="risk-owner" value={owner ?? ""} onChange={(e) => setOwner(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="risk-mitigation">Mitigation plan</Label>
            <Input id="risk-mitigation" value={mitigation ?? ""} onChange={(e) => setMitigation(e.target.value)} />
          </div>
          <DialogFooter className="flex justify-between">
            {risk && (
              <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={deleteRisk.isPending}>
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

interface RiskRegisterProps {
  entityId: string;
  entityType?: string;
  compact?: boolean;
}

export function RiskRegister({ entityId, entityType = "project", compact = false }: RiskRegisterProps) {
  const { data: risks = [], isLoading } = useRisks(entityId, entityType);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Risk | undefined>();

  const handleEdit = (r: Risk) => {
    setEditing(r);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };

  const openRisks = risks.filter((r: Risk) => r.status === "open");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          Risk register
          {openRisks.length > 0 && (
            <Badge variant="destructive" className="ml-2 text-xs">{openRisks.length} open</Badge>
          )}
        </h3>
        <Button size="sm" variant="outline" onClick={handleAdd}>
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {!isLoading && risks.length === 0 && (
        <p className="text-sm text-muted-foreground italic">No risks logged</p>
      )}

      <div className="space-y-2">
        {risks.map((r: Risk) => {
          const Icon = STATUS_ICON[r.status] ?? AlertTriangle;
          return (
            <div
              key={r.id}
              className="flex items-center gap-2 p-2 rounded-md border bg-card hover:bg-accent/50 cursor-pointer group"
              onClick={() => handleEdit(r)}
            >
              <Icon className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{r.title}</p>
                {!compact && r.mitigation && (
                  <p className="text-xs text-muted-foreground truncate">Mitigation: {r.mitigation}</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {r.impact && (
                  <Badge variant={IMPACT_COLOR[r.impact] ?? "secondary"} className="text-xs">
                    {r.impact}
                  </Badge>
                )}
              </div>
              <Edit2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0" />
            </div>
          );
        })}
      </div>

      <RiskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entityId={entityId}
        entityType={entityType}
        risk={editing}
      />
    </div>
  );
}
