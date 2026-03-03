"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, GripVertical, CheckCircle, Clock, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkstreams, useUpsertWorkstream, useDeleteWorkstream } from "@/lib/queries";
import type { Workstream } from "@/lib/types";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Active", variant: "default" },
  on_hold: { label: "On hold", variant: "secondary" },
  completed: { label: "Completed", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

const STATUS_OPTIONS = ["active", "on_hold", "completed", "cancelled"];

interface InlineFormState {
  name: string;
  description: string;
  status: string;
}

const EMPTY_FORM: InlineFormState = { name: "", description: "", status: "active" };

interface WorkstreamRowProps {
  workstream: Workstream;
  onEdit: (w: Workstream) => void;
  onDelete: (w: Workstream) => void;
}

function WorkstreamRow({ workstream, onEdit, onDelete }: WorkstreamRowProps) {
  const cfg = STATUS_CONFIG[workstream.status] ?? STATUS_CONFIG.active;
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 group">
      <GripVertical className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{workstream.name}</p>
        {workstream.description && (
          <p className="text-xs text-muted-foreground truncate">{workstream.description}</p>
        )}
      </div>
      <Badge variant={cfg.variant} className="text-xs flex-shrink-0">{cfg.label}</Badge>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 flex-shrink-0">
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onEdit(workstream)}>
          <Edit2 className="h-3 w-3" />
        </Button>
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive hover:text-destructive" onClick={() => onDelete(workstream)}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

interface InlineFormProps {
  initial?: InlineFormState;
  onSave: (values: InlineFormState) => Promise<void>;
  onCancel: () => void;
  isPending: boolean;
}

function InlineForm({ initial = EMPTY_FORM, onSave, onCancel, isPending }: InlineFormProps) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [status, setStatus] = useState(initial.status);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onSave({ name, description, status });
  };

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-3 space-y-3 bg-muted/30">
      <div className="space-y-1">
        <Label htmlFor="ws-name" className="text-xs">Name *</Label>
        <Input
          id="ws-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Workstream name"
          className="h-8 text-sm"
          required
          autoFocus
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="ws-desc" className="text-xs">Description</Label>
        <Input
          id="ws-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description"
          className="h-8 text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="submit" size="sm" disabled={isPending}>{isPending ? "Saving..." : "Save"}</Button>
      </div>
    </form>
  );
}

interface WorkstreamPanelProps {
  projectId: string;
}

export function WorkstreamPanel({ projectId }: WorkstreamPanelProps) {
  const { data: workstreams = [], isLoading } = useWorkstreams(projectId);
  const upsertWorkstream = useUpsertWorkstream();
  const deleteWorkstream = useDeleteWorkstream();

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = async (values: InlineFormState) => {
    await upsertWorkstream.mutateAsync({
      projectId,
      name: values.name,
      description: values.description,
      status: values.status,
    });
    setAdding(false);
  };

  const handleEdit = async (workstream: Workstream, values: InlineFormState) => {
    await upsertWorkstream.mutateAsync({
      id: workstream.id,
      projectId,
      name: values.name,
      description: values.description,
      status: values.status,
    });
    setEditingId(null);
  };

  const handleDelete = async (workstream: Workstream) => {
    if (!window.confirm(`Delete workstream "${workstream.name}"?`)) return;
    await deleteWorkstream.mutateAsync({ id: workstream.id, projectId });
  };

  const startEdit = (w: Workstream) => {
    setAdding(false);
    setEditingId(w.id);
  };

  const startAdd = () => {
    setEditingId(null);
    setAdding(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Workstreams</h3>
        <Button size="sm" variant="outline" onClick={startAdd} disabled={adding}>
          <Plus className="h-3 w-3 mr-1" /> Add workstream
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {!isLoading && workstreams.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground italic">No workstreams yet</p>
      )}

      <div className="space-y-2">
        {adding && (
          <InlineForm
            onSave={handleAdd}
            onCancel={() => setAdding(false)}
            isPending={upsertWorkstream.isPending}
          />
        )}

        {workstreams.map((w: Workstream) =>
          editingId === w.id ? (
            <InlineForm
              key={w.id}
              initial={{ name: w.name, description: w.description ?? "", status: w.status }}
              onSave={(values) => handleEdit(w, values)}
              onCancel={() => setEditingId(null)}
              isPending={upsertWorkstream.isPending}
            />
          ) : (
            <WorkstreamRow
              key={w.id}
              workstream={w}
              onEdit={startEdit}
              onDelete={handleDelete}
            />
          )
        )}
      </div>
    </div>
  );
}
