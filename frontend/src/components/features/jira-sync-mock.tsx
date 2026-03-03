"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MockBadge } from "@/components/horizon-ui/mock-badge";

interface JiraSyncMockProps {
  projectId: string;
}

type JiraStatus = "To Do" | "In Progress" | "In Review" | "Done";
type JiraPriority = "Low" | "Medium" | "High" | "Critical";

interface JiraIssue {
  key: string;
  summary: string;
  status: JiraStatus;
  assignee: string;
  priority: JiraPriority;
}

const STATUS_CONFIG: Record<JiraStatus, string> = {
  "To Do": "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  "In Progress": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "In Review": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  "Done": "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};

const PRIORITY_CONFIG: Record<JiraPriority, string> = {
  Low: "text-slate-500",
  Medium: "text-blue-500",
  High: "text-orange-500",
  Critical: "text-red-500",
};

const MOCK_ISSUES: JiraIssue[] = [
  {
    key: "AIT-90",
    summary: "Build adoption archetypes for AI Champions program",
    status: "In Progress",
    assignee: "Lourenco Castro",
    priority: "High",
  },
  {
    key: "AIT-72",
    summary: "Deploy Cursor to engineering teams",
    status: "Done",
    assignee: "Carson Ransford",
    priority: "High",
  },
  {
    key: "AIT-74",
    summary: "Prepare AI enablement report for Greg",
    status: "In Review",
    assignee: "Lourenco Castro",
    priority: "Critical",
  },
  {
    key: "AIT-140",
    summary: "Robotics SWE AI adoption baseline assessment",
    status: "To Do",
    assignee: "Peter D'Antonio",
    priority: "Medium",
  },
];

export function JiraSyncMock({ projectId: _ }: JiraSyncMockProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-md border overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">Linked Jira issues</span>
          <MockBadge system="Jira" />
        </div>
        <span className="text-xs text-muted-foreground">
          {MOCK_ISSUES.length} issues (mock)
        </span>
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          expanded ? "max-h-[500px]" : "max-h-0"
        )}
      >
        <div className="border-t">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs w-24">
                  Key
                </th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">
                  Summary
                </th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs w-28">
                  Status
                </th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs w-36">
                  Assignee
                </th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs w-20">
                  Priority
                </th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ISSUES.map((issue) => (
                <tr
                  key={issue.key}
                  className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-3 py-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {issue.key}
                    </span>
                  </td>
                  <td className="px-3 py-2">{issue.summary}</td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        STATUS_CONFIG[issue.status]
                      )}
                    >
                      {issue.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-sm text-muted-foreground">
                    {issue.assignee}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        "text-xs font-medium",
                        PRIORITY_CONFIG[issue.priority]
                      )}
                    >
                      {issue.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t flex justify-end">
            <Button variant="outline" size="sm" disabled>
              Configure Jira sync
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
