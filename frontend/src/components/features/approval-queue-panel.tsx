"use client";

import { useState } from "react";
import { Shield, Check, X } from "lucide-react";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApprovalRequests, useApproveRequest, useRejectRequest } from "@/lib/queries";
import type { ApprovalRequest, ApprovalStatus } from "@/lib/types";

const STATUS_CONFIG: Record<ApprovalStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "default" },
  approved: { label: "Approved", variant: "secondary" },
  rejected: { label: "Rejected", variant: "destructive" },
  withdrawn: { label: "Withdrawn", variant: "outline" },
};

function formatLabel(str: string) {
  return str.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

type DecisionAction = "approve" | "reject";

interface DecisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: DecisionAction;
  request: ApprovalRequest;
  onConfirm: (notes: string) => Promise<void>;
  isPending: boolean;
}

function DecisionDialog({ open, onOpenChange, action, request, onConfirm, isPending }: DecisionDialogProps) {
  const [notes, setNotes] = useState("");

  const handleConfirm = async () => {
    await onConfirm(notes);
    setNotes("");
  };

  const handleCancel = () => {
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{action === "approve" ? "Approve request" : "Reject request"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {formatLabel(request.requestType)} for <span className="font-medium text-foreground">{request.entityName ?? request.entityId}</span>
          </p>
          <div className="space-y-2">
            <Label htmlFor="decision-notes">Notes {action === "reject" && "(recommended)"}</Label>
            <Textarea
              id="decision-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add a note for the requester..."
              rows={3}
              className="resize-none"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button
            type="button"
            variant={action === "approve" ? "default" : "destructive"}
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? "Saving..." : action === "approve" ? "Approve" : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ApprovalQueuePanelProps {
  entityType?: string;
  entityId?: string;
}

export function ApprovalQueuePanel({ entityType, entityId }: ApprovalQueuePanelProps) {
  const { data: requests = [], isLoading } = useApprovalRequests(entityType, entityId);
  const approveRequest = useApproveRequest();
  const rejectRequest = useRejectRequest();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [decisionAction, setDecisionAction] = useState<DecisionAction>("approve");

  const openDecision = (request: ApprovalRequest, action: DecisionAction) => {
    setSelectedRequest(request);
    setDecisionAction(action);
    setDialogOpen(true);
  };

  const handleConfirm = async (notes: string) => {
    if (!selectedRequest) return;
    if (decisionAction === "approve") {
      await approveRequest.mutateAsync({ id: selectedRequest.id, decisionNotes: notes || undefined });
    } else {
      await rejectRequest.mutateAsync({ id: selectedRequest.id, decisionNotes: notes || undefined });
    }
    setDialogOpen(false);
    setSelectedRequest(null);
  };

  const isPending = approveRequest.isPending || rejectRequest.isPending;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          Approval queue
          {requests.filter((r: ApprovalRequest) => r.status === "pending").length > 0 && (
            <Badge variant="default" className="ml-2 text-xs">
              {requests.filter((r: ApprovalRequest) => r.status === "pending").length} pending
            </Badge>
          )}
        </h3>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {!isLoading && requests.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
          <Shield className="h-8 w-8 opacity-30" />
          <p className="text-sm">No approval requests</p>
        </div>
      )}

      {!isLoading && requests.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Request type</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Entity</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Requested by</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Date</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {requests.map((r: ApprovalRequest) => {
                const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pending;
                return (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2 text-xs font-medium">{formatLabel(r.requestType)}</td>
                    <td className="px-3 py-2 text-xs">
                      <div>{r.entityName ?? r.entityId}</div>
                      <div className="text-muted-foreground">{formatLabel(r.entityType)}</div>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{r.requestedBy}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">{formatDate(r.requestedAt)}</td>
                    <td className="px-3 py-2">
                      <Badge variant={cfg.variant} className="text-xs">{cfg.label}</Badge>
                    </td>
                    <td className="px-3 py-2">
                      {r.status === "pending" && (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs text-green-700 border-green-300 hover:bg-green-50"
                            onClick={() => openDecision(r, "approve")}
                            disabled={isPending}
                          >
                            <Check className="h-3 w-3 mr-0.5" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs text-red-700 border-red-300 hover:bg-red-50"
                            onClick={() => openDecision(r, "reject")}
                            disabled={isPending}
                          >
                            <X className="h-3 w-3 mr-0.5" /> Reject
                          </Button>
                        </div>
                      )}
                      {r.status !== "pending" && r.decisionNotes && (
                        <p className="text-xs text-muted-foreground truncate max-w-[160px]" title={r.decisionNotes}>
                          {r.decisionNotes}
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedRequest && (
        <DecisionDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          action={decisionAction}
          request={selectedRequest}
          onConfirm={handleConfirm}
          isPending={isPending}
        />
      )}
    </div>
  );
}
