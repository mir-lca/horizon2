"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import type { WorkflowInstance, WorkflowEvent } from "@/lib/types";

const DEFINITION_OPTIONS = [
  { value: 'budget_increase', label: 'Budget increase' },
  { value: 'phase_exit', label: 'Phase exit' },
  { value: 'change_request', label: 'Change request' },
  { value: 'project_kickoff', label: 'Project kickoff' },
];

const STATE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  submitted: "default",
  under_review: "default",
  approved: "secondary",
  rejected: "destructive",
  implemented: "secondary",
  kicked_off: "secondary",
};

interface StartWorkflowDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  entityType: string;
  entityId: string;
}

function StartWorkflowDialog({ open, onOpenChange, entityType, entityId }: StartWorkflowDialogProps) {
  const [definitionName, setDefinitionName] = useState('budget_increase');
  const queryClient = useQueryClient();

  const start = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/workflows/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ definitionName, entityType, entityId, createdBy: 'user' }),
      });
      if (!res.ok) throw new Error('Failed to start workflow');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow', entityId] });
      toast.success('Workflow started');
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Start approval workflow</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Workflow type</Label>
            <Select value={definitionName} onValueChange={setDefinitionName}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DEFINITION_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => start.mutate()} disabled={start.isPending}>Start</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface TransitionDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  instanceId: string;
  availableTransitions: Array<{ from: string; to: string; label: string }>;
  currentState: string;
  entityId: string;
}

function TransitionDialog({ open, onOpenChange, instanceId, availableTransitions, currentState, entityId }: TransitionDialogProps) {
  const [toState, setToState] = useState('');
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();

  const nextStates = availableTransitions.filter((t) => t.from === currentState);

  const doTransition = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/workflows/instances/${instanceId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toState, actor: 'user', comment }),
      });
      if (!res.ok) throw new Error('Transition failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow', entityId] });
      queryClient.invalidateQueries({ queryKey: ['workflow-history', instanceId] });
      toast.success('Workflow advanced');
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Advance workflow</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Next state</Label>
            <Select value={toState} onValueChange={setToState}>
              <SelectTrigger><SelectValue placeholder="Select next state" /></SelectTrigger>
              <SelectContent>
                {nextStates.map((t) => (
                  <SelectItem key={t.to} value={t.to}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Comment (optional)</Label>
            <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a note..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => doTransition.mutate()} disabled={doTransition.isPending || !toState}>
            Advance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface WorkflowPanelProps {
  entityType: string;
  entityId: string;
}

export function WorkflowPanel({ entityType, entityId }: WorkflowPanelProps) {
  const [startOpen, setStartOpen] = useState(false);
  const [transitionOpen, setTransitionOpen] = useState(false);

  const { data: instances = [] } = useQuery<WorkflowInstance[]>({
    queryKey: ['workflow', entityId],
    queryFn: async () => {
      const res = await fetch(`/api/workflows/instances?entityId=${entityId}&entityType=${entityType}`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !!entityId,
  });

  const latestInstance = instances[0];

  const { data: history = [] } = useQuery<WorkflowEvent[]>({
    queryKey: ['workflow-history', latestInstance?.id],
    queryFn: async () => {
      const res = await fetch(`/api/workflows/instances/${latestInstance!.id}/history`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!latestInstance?.id,
  });

  const transitions = latestInstance?.definition?.transitions ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Approval workflow</h3>
        <Button size="sm" variant="outline" onClick={() => setStartOpen(true)}>
          <Plus className="h-3 w-3 mr-1" /> Start workflow
        </Button>
      </div>

      {!latestInstance && (
        <p className="text-sm text-muted-foreground italic">No active workflow</p>
      )}

      {latestInstance && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border rounded-lg p-3">
            <div>
              <p className="text-sm font-medium">{latestInstance.definition?.name?.replace(/_/g, ' ')}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={STATE_VARIANT[latestInstance.currentState] ?? "outline"} className="text-xs">
                  {latestInstance.currentState.replace(/_/g, ' ')}
                </Badge>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setTransitionOpen(true)}>
              <ChevronRight className="h-3 w-3 mr-1" /> Advance
            </Button>
          </div>

          {history.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">History</p>
              {history.map((event) => (
                <div key={event.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{event.fromState.replace(/_/g, ' ')}</span>
                  <ChevronRight className="h-3 w-3" />
                  <span className="font-medium text-foreground">{event.toState.replace(/_/g, ' ')}</span>
                  <span className="ml-auto">{event.actor}</span>
                  <span>{new Date(event.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}

          <TransitionDialog
            open={transitionOpen}
            onOpenChange={setTransitionOpen}
            instanceId={latestInstance.id}
            availableTransitions={transitions}
            currentState={latestInstance.currentState}
            entityId={entityId}
          />
        </div>
      )}

      <StartWorkflowDialog
        open={startOpen}
        onOpenChange={setStartOpen}
        entityType={entityType}
        entityId={entityId}
      />
    </div>
  );
}
