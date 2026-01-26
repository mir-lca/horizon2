"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "tr-workspace-components";
import { Project, Resource, Competence, BusinessUnit, AllocationModifier, ResourceAllocationItem } from "@/lib/types";

interface ProjectResourceAllocationManagerProps {
  project: Project;
  onSave: (updatedProject: Project, options?: { refreshData?: boolean }) => Promise<void>;
  businessUnits: BusinessUnit[];
  resources: Resource[];
  competences: Competence[];
}

export function ProjectResourceAllocationManager({
  project,
  onSave,
  resources,
  competences,
}: ProjectResourceAllocationManagerProps) {
  const [allocations, setAllocations] = useState<ResourceAllocationItem[]>(
    (project.resourceAllocations || []) as ResourceAllocationItem[]
  );
  const [isSaving, setIsSaving] = useState(false);
  const [newAllocation, setNewAllocation] = useState<ResourceAllocationItem>({
    resourceId: "",
    competenceId: "",
    relativeQuarter: 1,
    allocationPercentage: 0,
    modifier: AllocationModifier.Development,
  });

  const addAllocation = () => {
    setAllocations((prev) => [...prev, { ...newAllocation }]);
    setNewAllocation({
      resourceId: "",
      competenceId: "",
      relativeQuarter: 1,
      allocationPercentage: 0,
      modifier: AllocationModifier.Development,
    });
  };

  const updateAllocation = (index: number, field: keyof ResourceAllocationItem, value: any) => {
    setAllocations((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeAllocation = (index: number) => {
    setAllocations((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(
        {
          ...project,
          resourceAllocations: allocations,
          updatedAt: new Date().toISOString(),
        },
        { refreshData: true }
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Resource Allocations</CardTitle>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Allocations"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-5 gap-2 items-end">
          <div>
            <label className="text-xs text-muted-foreground">Competence</label>
            <Select
              value={newAllocation.competenceId}
              onValueChange={(value) => setNewAllocation((prev) => ({ ...prev, competenceId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {competences.map((competence) => (
                  <SelectItem key={competence.id} value={competence.id}>
                    {competence.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Resource</label>
            <Select
              value={newAllocation.resourceId}
              onValueChange={(value) => setNewAllocation((prev) => ({ ...prev, resourceId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {resources
                  .filter((resource) => !newAllocation.competenceId || resource.competenceId === newAllocation.competenceId)
                  .map((resource) => (
                    <SelectItem key={resource.id} value={resource.id}>
                      {resource.name || resource.competenceName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Quarter</label>
            <Input
              type="number"
              value={newAllocation.relativeQuarter}
              onChange={(event) =>
                setNewAllocation((prev) => ({ ...prev, relativeQuarter: Number.parseInt(event.target.value || "1", 10) }))
              }
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Allocation %</label>
            <Input
              type="number"
              value={newAllocation.allocationPercentage}
              onChange={(event) =>
                setNewAllocation((prev) => ({
                  ...prev,
                  allocationPercentage: Number.parseFloat(event.target.value || "0"),
                }))
              }
            />
          </div>
          <Button variant="outline" onClick={addAllocation}>
            Add
          </Button>
        </div>

        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left p-2 border-b">Competence</th>
              <th className="text-left p-2 border-b">Resource</th>
              <th className="text-left p-2 border-b">Quarter</th>
              <th className="text-left p-2 border-b">Allocation %</th>
              <th className="text-left p-2 border-b">Modifier</th>
              <th className="text-left p-2 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {allocations.map((allocation, index) => {
              const competence = competences.find((item) => item.id === allocation.competenceId);
              const resource = resources.find((item) => item.id === allocation.resourceId);
              return (
                <tr key={`${allocation.resourceId}-${index}`}>
                  <td className="p-2 border-b">{competence?.name || allocation.competenceId}</td>
                  <td className="p-2 border-b">{resource?.name || resource?.competenceName || allocation.resourceId}</td>
                  <td className="p-2 border-b">
                    <Input
                      type="number"
                      value={allocation.relativeQuarter}
                      onChange={(event) =>
                        updateAllocation(index, "relativeQuarter", Number.parseInt(event.target.value || "1", 10))
                      }
                    />
                  </td>
                  <td className="p-2 border-b">
                    <Input
                      type="number"
                      value={allocation.allocationPercentage}
                      onChange={(event) =>
                        updateAllocation(index, "allocationPercentage", Number.parseFloat(event.target.value || "0"))
                      }
                    />
                  </td>
                  <td className="p-2 border-b">
                    <Select
                      value={allocation.modifier || AllocationModifier.Development}
                      onValueChange={(value) => updateAllocation(index, "modifier", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Modifier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={AllocationModifier.Development}>Development</SelectItem>
                        <SelectItem value={AllocationModifier.Sustaining}>Sustaining</SelectItem>
                        <SelectItem value={AllocationModifier.Enablement}>Enablement</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2 border-b">
                    <Button variant="ghost" size="sm" onClick={() => removeAllocation(index)}>
                      Remove
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
