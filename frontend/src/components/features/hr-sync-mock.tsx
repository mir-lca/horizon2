"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MockBadge } from "@/components/horizon-ui/mock-badge";

const MOCK_EMPLOYEES = [
  {
    id: "emp-001",
    name: "Lourenco Castro",
    title: "Program Manager / Head of Enterprise AI",
    department: "Robotics Engineering",
    businessUnit: "Universal Robots",
    fte: 1.0,
  },
  {
    id: "emp-002",
    name: "Carson Ransford",
    title: "Software ML Engineer / Enterprise AI Architect",
    department: "IT",
    businessUnit: "Teradyne Corporate",
    fte: 1.0,
  },
  {
    id: "emp-003",
    name: "Peter D'Antonio",
    title: "Semiconductor Design Engineer / AI Champion",
    department: "Logic Design and Embedded Firmware",
    businessUnit: "Compute Test Division",
    fte: 1.0,
  },
];

export function HrSyncMock() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <MockBadge system="Thrive HR" />
        <Button variant="outline" size="sm">
          Configure HR sync
        </Button>
      </div>

      <div className="flex items-center gap-2 rounded-md border border-muted bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <span>Last synced: — (not configured)</span>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">
                Name
              </th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">
                Title
              </th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">
                Department
              </th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">
                Business unit
              </th>
              <th className="text-center px-3 py-2 font-medium text-muted-foreground text-xs">
                FTE
              </th>
            </tr>
          </thead>
          <tbody>
            {MOCK_EMPLOYEES.map((emp) => (
              <tr
                key={emp.id}
                className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
              >
                <td className="px-3 py-2 font-medium">{emp.name}</td>
                <td className="px-3 py-2 text-muted-foreground text-xs">
                  {emp.title}
                </td>
                <td className="px-3 py-2 text-muted-foreground text-xs">
                  {emp.department}
                </td>
                <td className="px-3 py-2 text-muted-foreground text-xs">
                  {emp.businessUnit}
                </td>
                <td className="px-3 py-2 text-center tabular-nums">
                  {emp.fte.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
