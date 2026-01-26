"use client";

import { Card, CardContent, CardHeader, CardTitle } from "tr-workspace-components";
import { Project } from "@/lib/types";
import { formatDuration } from "@/lib/date-utils";

export function ProjectDescriptionCard({ project }: { project: Project }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Project Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div>
          <span className="text-muted-foreground">Status:</span> {project.status}
        </div>
        <div>
          <span className="text-muted-foreground">Business Unit:</span> {project.businessUnitName || project.businessUnitId}
        </div>
        <div>
          <span className="text-muted-foreground">Timeline:</span> {project.startYear} Q{project.startQuarter} · {formatDuration(project.durationQuarters)}
        </div>
        {project.description && (
          <div>
            <span className="text-muted-foreground">Notes:</span> {project.description}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
