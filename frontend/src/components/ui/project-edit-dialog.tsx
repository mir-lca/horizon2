"use client";

import React from "react";
import { Project, RiskFactor, BusinessUnit } from "@/lib/types";
import { toast } from "sonner";
import { getQuarterOptions, getYearOptions } from "@/lib/date-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "tr-workspace-components";
import { Button, Label, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "tr-workspace-components";

interface ProjectEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onSave: (project: Project) => Promise<void>;
  businessUnits: BusinessUnit[];
  dialogTitle?: string;
}

const riskOptions = [
  { value: RiskFactor.Low, label: "Low" },
  { value: RiskFactor.Medium, label: "Medium" },
  { value: RiskFactor.High, label: "High" },
  { value: RiskFactor.Critical, label: "Critical" },
];

export function ProjectEditDialog({
  open,
  onOpenChange,
  project: initialProject,
  onSave,
  businessUnits,
  dialogTitle = "Edit Project",
}: ProjectEditDialogProps) {
  const [project, setProject] = React.useState<Project | null>(initialProject);

  React.useEffect(() => {
    setProject(initialProject);
  }, [initialProject]);

  if (!project) return null;

  const handleSave = async () => {
    try {
      await onSave({
        ...project,
        updatedAt: new Date().toISOString(),
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving project:", error);
      toast.error("Failed to update project");
    }
  };

  const handleChange = (field: keyof Project, value: any) => {
    setProject((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleBusinessUnitChange = (value: string) => {
    const businessUnit = businessUnits.find((bu) => String(bu.id) === value);
    handleChange("businessUnitId", value);
    handleChange("businessUnitName", businessUnit ? businessUnit.name : "");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>Update project details.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <Label htmlFor="project-name" className="text-right">
              Name
            </Label>
            <Input
              id="project-name"
              value={project.name || ""}
              onChange={(event) => handleChange("name", event.target.value)}
            />
          </div>

          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <Label className="text-right">Business Unit</Label>
            <Select value={String(project.businessUnitId || "")} onValueChange={handleBusinessUnitChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select Business Unit" />
              </SelectTrigger>
              <SelectContent>
                {businessUnits.map((bu) => (
                  <SelectItem key={bu.id} value={String(bu.id)}>
                    {bu.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <Label className="text-right">Risk Level</Label>
            <Select value={project.riskLevel || RiskFactor.Low} onValueChange={(value) => handleChange("riskLevel", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Risk Level" />
              </SelectTrigger>
              <SelectContent>
                {riskOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <Label className="text-right">Status</Label>
            <Select value={project.status || "unfunded"} onValueChange={(value) => handleChange("status", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unfunded">Unfunded</SelectItem>
                <SelectItem value="funded">Funded</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <Label className="text-right">Start Year</Label>
            <Select value={String(project.startYear)} onValueChange={(value) => handleChange("startYear", Number.parseInt(value, 10))}>
              <SelectTrigger>
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {getYearOptions().map((year) => (
                  <SelectItem key={year.value} value={year.value}>
                    {year.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <Label className="text-right">Start Quarter</Label>
            <Select value={String(project.startQuarter)} onValueChange={(value) => handleChange("startQuarter", Number.parseInt(value, 10))}>
              <SelectTrigger>
                <SelectValue placeholder="Quarter" />
              </SelectTrigger>
              <SelectContent>
                {getQuarterOptions().map((quarter) => (
                  <SelectItem key={quarter.value} value={quarter.value}>
                    {quarter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <Label className="text-right">Duration (quarters)</Label>
            <Input
              type="number"
              value={project.durationQuarters}
              onChange={(event) => handleChange("durationQuarters", Number.parseInt(event.target.value || "0", 10))}
            />
          </div>

          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <Label className="text-right">Total Cost</Label>
            <Input
              type="number"
              value={project.totalCost}
              onChange={(event) => handleChange("totalCost", Number.parseFloat(event.target.value || "0"))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
