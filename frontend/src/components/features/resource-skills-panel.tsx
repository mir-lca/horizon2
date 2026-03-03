"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  useResourceSkills,
  useAddResourceSkill,
  useDeleteResourceSkill,
  useSkills,
} from "@/lib/queries";
import type { ResourceSkill } from "@/lib/types";

interface ResourceSkillsPanelProps {
  resourceId: string;
  resourceName: string;
}

type SkillLevel = ResourceSkill["level"];

const LEVEL_CONFIG: Record<
  SkillLevel,
  { label: string; className: string }
> = {
  beginner: {
    label: "Beginner",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  intermediate: {
    label: "Intermediate",
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  advanced: {
    label: "Advanced",
    className:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  },
  expert: {
    label: "Expert",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
};

const LEVELS: SkillLevel[] = ["beginner", "intermediate", "advanced", "expert"];

interface AddSkillFormProps {
  resourceId: string;
  onCancel: () => void;
}

function AddSkillForm({ resourceId, onCancel }: AddSkillFormProps) {
  const { data: skills = [] } = useSkills();
  const addSkill = useAddResourceSkill();

  const [skillId, setSkillId] = useState("");
  const [level, setLevel] = useState<SkillLevel>("intermediate");
  const [projectId, setProjectId] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillId) return;
    await addSkill.mutateAsync({
      resourceId,
      skillId,
      level,
      projectId: projectId || undefined,
      validFrom: validFrom || undefined,
      validTo: validTo || undefined,
    });
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="border rounded-md p-4 bg-muted/30 space-y-3">
      <p className="text-sm font-medium">Add skill</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Skill</Label>
          <Select value={skillId} onValueChange={setSkillId}>
            <SelectTrigger>
              <SelectValue placeholder="Select skill..." />
            </SelectTrigger>
            <SelectContent>
              {skills.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Level</Label>
          <Select value={level} onValueChange={(v) => setLevel(v as SkillLevel)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEVELS.map((l) => (
                <SelectItem key={l} value={l}>
                  {LEVEL_CONFIG[l].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Project ID (optional)</Label>
          <Input
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="project-id"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Valid from</Label>
          <Input
            type="date"
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Valid to</Label>
          <Input
            type="date"
            value={validTo}
            onChange={(e) => setValidTo(e.target.value)}
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={!skillId || addSkill.isPending}
        >
          {addSkill.isPending ? "Adding..." : "Add skill"}
        </Button>
      </div>
    </form>
  );
}

export function ResourceSkillsPanel({
  resourceId,
  resourceName,
}: ResourceSkillsPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const { data: skills = [], isLoading } = useResourceSkills(resourceId);
  const deleteSkill = useDeleteResourceSkill();

  const handleDelete = (skillEntry: ResourceSkill) => {
    if (!window.confirm(`Remove ${skillEntry.skillName ?? "this skill"}?`)) return;
    deleteSkill.mutate({ id: skillEntry.id, resourceId });
  };

  return (
    <div className="space-y-3 py-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Skills for <span className="font-medium text-foreground">{resourceName}</span>
        </p>
        {!showAddForm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add skill
          </Button>
        )}
      </div>

      {showAddForm && (
        <AddSkillForm
          resourceId={resourceId}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-2">Loading...</p>
      ) : skills.length === 0 && !showAddForm ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No skills recorded
        </p>
      ) : skills.length > 0 ? (
        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">
                  Skill
                </th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">
                  Category
                </th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">
                  Level
                </th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">
                  Project
                </th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">
                  Valid
                </th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {skills.map((skill) => {
                const levelCfg = LEVEL_CONFIG[skill.level];
                return (
                  <tr
                    key={skill.id}
                    className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-3 py-2 font-medium">
                      {skill.skillName ?? skill.skillId}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {skill.skillCategory ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          levelCfg.className
                        )}
                      >
                        {levelCfg.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground text-xs">
                      {skill.projectId ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground text-xs whitespace-nowrap">
                      {skill.validFrom
                        ? `${skill.validFrom}${skill.validTo ? ` → ${skill.validTo}` : ""}`
                        : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(skill)}
                        disabled={deleteSkill.isPending}
                        aria-label="Remove skill"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
