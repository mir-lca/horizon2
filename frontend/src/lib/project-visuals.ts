import { Project } from "@/lib/types";

export function getProjectPhaseBarClass(project: Project): string {
  if (project.status === "active") return "bg-blue-500";
  if (project.status === "funded") return "bg-green-500";
  if (project.status === "unfunded") return "bg-amber-400";
  if (project.status === "completed") return "bg-slate-400";
  return "bg-slate-400";
}

export function getProjectPhaseDotClass(project: Project): string {
  if (project.status === "active") return "text-blue-500";
  if (project.status === "funded") return "text-green-500";
  if (project.status === "unfunded") return "text-amber-500";
  if (project.status === "completed") return "text-slate-400";
  return "text-slate-400";
}
