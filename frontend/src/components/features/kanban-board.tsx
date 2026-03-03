"use client";

import { useState, useMemo } from "react";
import { Plus, X, GripVertical } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useKanbanTasks, useUpsertKanbanTask, useDeleteKanbanTask, useWorkstreams } from "@/lib/queries";
import type { KanbanTask, KanbanStatus, KanbanPriority, Workstream } from "@/lib/types";
import { cn } from "@/lib/utils";

const COLUMNS: Array<{ id: KanbanStatus; label: string }> = [
  { id: "backlog", label: "Backlog" },
  { id: "todo", label: "To do" },
  { id: "in-progress", label: "In progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
];

const PRIORITY_CLASSES: Record<KanbanPriority, string> = {
  low: "text-green-600 bg-green-50 border-green-200",
  medium: "text-yellow-600 bg-yellow-50 border-yellow-200",
  high: "text-orange-600 bg-orange-50 border-orange-200",
  critical: "text-red-600 bg-red-50 border-red-200",
};

const PRIORITY_OPTIONS: KanbanPriority[] = ["low", "medium", "high", "critical"];

function formatDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  initialStatus: KanbanStatus;
  task?: KanbanTask;
  workstreams: Workstream[];
}

function TaskDialog({ open, onOpenChange, projectId, initialStatus, task, workstreams }: TaskDialogProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority] = useState<KanbanPriority>(task?.priority ?? "medium");
  const [storyPoints, setStoryPoints] = useState(task?.storyPoints?.toString() ?? "");
  const [assignee, setAssignee] = useState(task?.assignee ?? "");
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "");
  const [workstreamId, setWorkstreamId] = useState(task?.workstreamId ?? "");
  const [status, setStatus] = useState<KanbanStatus>(task?.status ?? initialStatus);

  const upsertTask = useUpsertKanbanTask();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await upsertTask.mutateAsync({
      id: task?.id,
      projectId,
      title,
      description: description || undefined,
      priority,
      storyPoints: storyPoints ? parseInt(storyPoints, 10) : undefined,
      assignee: assignee || undefined,
      dueDate: dueDate || undefined,
      workstreamId: workstreamId || undefined,
      status,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "Add task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="kt-title">Title *</Label>
            <Input id="kt-title" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kt-desc">Description</Label>
            <Textarea id="kt-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as KanbanPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kt-points">Story points</Label>
              <Input
                id="kt-points"
                type="number"
                min={0}
                value={storyPoints}
                onChange={(e) => setStoryPoints(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kt-assignee">Assignee</Label>
              <Input id="kt-assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Name or email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kt-due">Due date</Label>
              <Input id="kt-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          {task && (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as KanbanStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COLUMNS.map((col) => (
                    <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {workstreams.length > 0 && (
            <div className="space-y-2">
              <Label>Workstream</Label>
              <Select value={workstreamId || "none"} onValueChange={(v) => setWorkstreamId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {workstreams.map((ws) => (
                    <SelectItem key={ws.id} value={ws.id}>{ws.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={upsertTask.isPending}>{upsertTask.isPending ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface TaskCardProps {
  task: KanbanTask;
  onEdit: (task: KanbanTask) => void;
  onDelete: (task: KanbanTask) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
}

function TaskCard({ task, onEdit, onDelete, onDragStart }: TaskCardProps) {
  const formattedDate = formatDate(task.dueDate);
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      className="bg-card border rounded-md p-3 space-y-2 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow group relative"
    >
      <button
        type="button"
        className="absolute top-1.5 right-1.5 h-4 w-4 flex items-center justify-center rounded text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-opacity"
        onClick={(e) => { e.stopPropagation(); onDelete(task); }}
        aria-label="Delete task"
      >
        <X className="h-3 w-3" />
      </button>
      <p
        className="text-sm font-medium leading-snug pr-5 cursor-pointer hover:text-primary"
        onClick={() => onEdit(task)}
      >
        {task.title}
      </p>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={cn("inline-flex text-xs px-1.5 py-0.5 rounded border font-medium", PRIORITY_CLASSES[task.priority] ?? PRIORITY_CLASSES.medium)}>
          {task.priority}
        </span>
        {task.storyPoints != null && (
          <span className="inline-flex text-xs px-1.5 py-0.5 rounded border bg-muted text-muted-foreground font-medium">
            {task.storyPoints}pt
          </span>
        )}
      </div>
      {(task.assignee || formattedDate) && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {task.assignee && (
            <span className="truncate max-w-[120px] bg-muted rounded-full px-2 py-0.5">{task.assignee}</span>
          )}
          {formattedDate && <span className="flex-shrink-0">{formattedDate}</span>}
        </div>
      )}
    </div>
  );
}

interface KanbanBoardProps {
  projectId: string;
}

export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const { data: tasks = [], isLoading } = useKanbanTasks(projectId);
  const { data: workstreams = [] } = useWorkstreams(projectId);
  const upsertTask = useUpsertKanbanTask();
  const deleteTask = useDeleteKanbanTask();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStatus, setDialogStatus] = useState<KanbanStatus>("backlog");
  const [editingTask, setEditingTask] = useState<KanbanTask | undefined>();

  const [filterWorkstream, setFilterWorkstream] = useState<string>("");
  const [filterAssignee, setFilterAssignee] = useState<string>("");
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return tasks.filter((t: KanbanTask) => {
      if (filterWorkstream && t.workstreamId !== filterWorkstream) return false;
      if (filterAssignee && !t.assignee?.toLowerCase().includes(filterAssignee.toLowerCase())) return false;
      return true;
    });
  }, [tasks, filterWorkstream, filterAssignee]);

  const byStatus = useMemo(() => {
    const groups: Record<KanbanStatus, KanbanTask[]> = {
      backlog: [], todo: [], "in-progress": [], review: [], done: [],
    };
    filtered.forEach((t: KanbanTask) => {
      const col = groups[t.status];
      if (col) col.push(t);
    });
    return groups;
  }, [filtered]);

  const openAddDialog = (status: KanbanStatus) => {
    setEditingTask(undefined);
    setDialogStatus(status);
    setDialogOpen(true);
  };

  const openEditDialog = (task: KanbanTask) => {
    setEditingTask(task);
    setDialogStatus(task.status);
    setDialogOpen(true);
  };

  const handleDelete = async (task: KanbanTask) => {
    if (!window.confirm(`Delete task "${task.title}"?`)) return;
    await deleteTask.mutateAsync({ id: task.id, projectId });
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
    setDraggingTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: KanbanStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    setDraggingTaskId(null);
    if (!taskId) return;
    const task = tasks.find((t: KanbanTask) => t.id === taskId);
    if (!task || task.status === targetStatus) return;
    await upsertTask.mutateAsync({ id: task.id, projectId, status: targetStatus });
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground p-4">Loading...</p>;
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {workstreams.length > 0 && (
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">Workstream</Label>
            <Select value={filterWorkstream || "all"} onValueChange={(v) => setFilterWorkstream(v === "all" ? "" : v)}>
              <SelectTrigger className="h-8 w-44 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All workstreams</SelectItem>
                {workstreams.map((ws: Workstream) => (
                  <SelectItem key={ws.id} value={ws.id}>{ws.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Assignee</Label>
          <Input
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            placeholder="Filter by assignee"
            className="h-8 w-44 text-sm"
          />
        </div>
        {(filterWorkstream || filterAssignee) && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs"
            onClick={() => { setFilterWorkstream(""); setFilterAssignee(""); }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Board columns */}
      <div className="grid grid-cols-5 gap-3 min-h-[500px]">
        {COLUMNS.map((col) => {
          const colTasks = byStatus[col.id] ?? [];
          return (
            <div
              key={col.id}
              className="flex flex-col rounded-lg border bg-muted/30 min-h-[400px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className="flex items-center justify-between px-3 py-2 border-b">
                <span className="text-sm font-medium">{col.label}</span>
                <Badge variant="secondary" className="text-xs">{colTasks.length}</Badge>
              </div>
              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                {colTasks.map((task: KanbanTask) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={openEditDialog}
                    onDelete={handleDelete}
                    onDragStart={handleDragStart}
                  />
                ))}
              </div>
              <div className="p-2 border-t">
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full h-7 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => openAddDialog(col.id)}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add task
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={projectId}
        initialStatus={dialogStatus}
        task={editingTask}
        workstreams={workstreams}
      />
    </div>
  );
}
