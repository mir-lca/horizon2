"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Okr } from "@/lib/types";

interface OkrDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  okr: Okr | null;
  defaultType?: 'objective' | 'key_result';
  defaultParentId?: string;
  onSave: (okr: Partial<Okr>) => Promise<void>;
}

export function OkrDialog({ open, onOpenChange, okr, defaultType = 'objective', defaultParentId, onSave }: OkrDialogProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<'objective' | 'key_result'>(defaultType);
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("active");
  const [saving, setSaving] = useState(false);

  const isEditingKr = defaultParentId !== undefined || (okr?.type === 'key_result');

  useEffect(() => {
    if (okr) {
      setTitle(okr.title ?? "");
      setType(okr.type ?? defaultType);
      setDescription(okr.description ?? "");
      setOwner(okr.owner ?? "");
      setTargetValue(String(okr.targetValue ?? ""));
      setUnit(okr.unit ?? "");
      setStartDate(okr.startDate ?? "");
      setEndDate(okr.endDate ?? "");
      setStatus(okr.status ?? "active");
    } else {
      setTitle("");
      setType(defaultType);
      setDescription("");
      setOwner("");
      setTargetValue("");
      setUnit("");
      setStartDate("");
      setEndDate("");
      setStatus("active");
    }
  }, [okr, defaultType]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        type,
        description: description.trim() || undefined,
        owner: owner.trim() || undefined,
        targetValue: targetValue ? Number(targetValue) : undefined,
        unit: unit.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status,
        parentId: defaultParentId ?? okr?.parentId,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const isKr = type === 'key_result';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{okr ? "Edit OKR" : isKr ? "Add key result" : "New objective"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="okr-title">Title *</Label>
            <Input id="okr-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="OKR title" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as 'objective' | 'key_result')} disabled={isEditingKr}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="objective">Objective</SelectItem>
                  <SelectItem value="key_result">Key result</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="at_risk">At risk</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="okr-description">Description</Label>
            <Textarea id="okr-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="okr-owner">Owner</Label>
            <Input id="okr-owner" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Owner name" />
          </div>

          {isKr && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="okr-target">Target value</Label>
                <Input id="okr-target" type="number" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} placeholder="100" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="okr-unit">Unit</Label>
                <Input id="okr-unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="%, $, count..." />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="okr-start">Start date</Label>
              <Input id="okr-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="okr-end">End date</Label>
              <Input id="okr-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? "Saving..." : okr ? "Save changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
