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
import type { CapitalAsset } from "@/lib/types";

interface CapitalAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: CapitalAsset | null;
  onSave: (asset: Partial<CapitalAsset>) => Promise<void>;
}

export function CapitalAssetDialog({ open, onOpenChange, asset, onSave }: CapitalAssetDialogProps) {
  const [name, setName] = useState("");
  const [assetType, setAssetType] = useState("Equipment");
  const [projectId, setProjectId] = useState("");
  const [value, setValue] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("active");
  const [owner, setOwner] = useState("");
  const [calibrationDue, setCalibrationDue] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (asset) {
      setName(asset.name ?? "");
      setAssetType(asset.assetType ?? "Equipment");
      setProjectId(asset.projectId ?? "");
      setValue(String(asset.value ?? ""));
      setLocation(asset.location ?? "");
      setStatus(asset.status ?? "active");
      setOwner(asset.owner ?? "");
      setCalibrationDue(asset.calibrationDue ?? "");
      setNotes(asset.notes ?? "");
    } else {
      setName("");
      setAssetType("Equipment");
      setProjectId("");
      setValue("");
      setLocation("");
      setStatus("active");
      setOwner("");
      setCalibrationDue("");
      setNotes("");
    }
  }, [asset]);

  const handleSave = async () => {
    if (!name.trim() || !assetType) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        assetType,
        projectId: projectId.trim() || undefined,
        value: value ? Number(value) : undefined,
        location: location.trim() || undefined,
        status,
        owner: owner.trim() || undefined,
        calibrationDue: calibrationDue || undefined,
        notes: notes.trim() || undefined,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{asset ? "Edit asset" : "New capital asset"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="ca-name">Name *</Label>
            <Input id="ca-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Asset name" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Asset type *</Label>
              <Select value={assetType} onValueChange={setAssetType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Equipment">Equipment</SelectItem>
                  <SelectItem value="Software">Software</SelectItem>
                  <SelectItem value="License">License</SelectItem>
                  <SelectItem value="Facility">Facility</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
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
                  <SelectItem value="retired">Retired</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="ca-value">Value ($)</Label>
              <Input id="ca-value" type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0" />
            </div>

            <div className="space-y-1">
              <Label htmlFor="ca-calibration">Calibration due</Label>
              <Input id="ca-calibration" type="date" value={calibrationDue} onChange={(e) => setCalibrationDue(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="ca-owner">Owner</Label>
              <Input id="ca-owner" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Owner name" />
            </div>

            <div className="space-y-1">
              <Label htmlFor="ca-location">Location</Label>
              <Input id="ca-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Building / room" />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="ca-project">Project ID (optional)</Label>
            <Input id="ca-project" value={projectId} onChange={(e) => setProjectId(e.target.value)} placeholder="Link to project UUID" />
          </div>

          <div className="space-y-1">
            <Label htmlFor="ca-notes">Notes</Label>
            <Textarea id="ca-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Additional notes" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? "Saving..." : asset ? "Save changes" : "Create asset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
