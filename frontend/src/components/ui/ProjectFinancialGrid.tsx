"use client";

import React, { useMemo, useState } from "react";
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "tr-workspace-components";
import { Project, RevenueEstimate, YearlyFinancialMetric } from "@/lib/types";

interface ProjectFinancialGridProps {
  project: Project;
  onSave: (payload: {
    revenueEstimates: RevenueEstimate[];
    smCostPercentage: number;
    yearlySustainingCosts: YearlyFinancialMetric[];
    grossMarginPercentages: YearlyFinancialMetric[];
  }) => Promise<void>;
}

export function ProjectFinancialGrid({ project, onSave }: ProjectFinancialGridProps) {
  const [revenueEstimates, setRevenueEstimates] = useState<RevenueEstimate[]>(
    project.revenueEstimates?.length
      ? project.revenueEstimates
      : [
          { relativeYear: 1, lowEstimate: 0, highEstimate: 0 },
          { relativeYear: 2, lowEstimate: 0, highEstimate: 0 },
          { relativeYear: 3, lowEstimate: 0, highEstimate: 0 },
        ]
  );
  const [grossMarginPercentages, setGrossMarginPercentages] = useState<YearlyFinancialMetric[]>(
    Array.isArray(project.grossMarginPercentages) && project.grossMarginPercentages.length
      ? project.grossMarginPercentages
      : revenueEstimates.map((estimate) => ({ relativeYear: estimate.relativeYear, value: project.grossMarginPercentage || 50 }))
  );
  const [yearlySustainingCosts, setYearlySustainingCosts] = useState<YearlyFinancialMetric[]>(
    Array.isArray(project.yearlySustainingCosts) && project.yearlySustainingCosts.length
      ? (project.yearlySustainingCosts as YearlyFinancialMetric[])
      : revenueEstimates.map((estimate) => ({ relativeYear: estimate.relativeYear, value: project.yearlySustainingCost || 0 }))
  );
  const [smCostPercentage, setSmCostPercentage] = useState<number>(project.smCostPercentage || 0);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        revenueEstimates,
        smCostPercentage,
        yearlySustainingCosts,
        grossMarginPercentages,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addYear = () => {
    const nextYear = revenueEstimates.length + 1;
    setRevenueEstimates((prev) => [...prev, { relativeYear: nextYear, lowEstimate: 0, highEstimate: 0 }]);
    setGrossMarginPercentages((prev) => [...prev, { relativeYear: nextYear, value: project.grossMarginPercentage || 50 }]);
    setYearlySustainingCosts((prev) => [...prev, { relativeYear: nextYear, value: project.yearlySustainingCost || 0 }]);
  };

  const updateRevenue = (index: number, field: "lowEstimate" | "highEstimate", value: number) => {
    setRevenueEstimates((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const updateMetric = (
    setter: React.Dispatch<React.SetStateAction<YearlyFinancialMetric[]>>,
    index: number,
    value: number
  ) => {
    setter((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], value };
      return updated;
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Financial Model</CardTitle>
        <Button size="sm" onClick={addYear} variant="outline">
          Add Year
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">S&M Cost %</label>
          <Input
            className="w-24"
            type="number"
            value={smCostPercentage}
            onChange={(event) => setSmCostPercentage(Number.parseFloat(event.target.value || "0"))}
          />
        </div>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left p-2 border-b">Year</th>
              <th className="text-right p-2 border-b">Revenue Low</th>
              <th className="text-right p-2 border-b">Revenue High</th>
              <th className="text-right p-2 border-b">Gross Margin %</th>
              <th className="text-right p-2 border-b">Sustaining Cost</th>
            </tr>
          </thead>
          <tbody>
            {revenueEstimates.map((estimate, index) => (
              <tr key={estimate.relativeYear}>
                <td className="p-2 border-b">Year {estimate.relativeYear}</td>
                <td className="p-2 border-b text-right">
                  <Input
                    type="number"
                    value={estimate.lowEstimate}
                    onChange={(event) => updateRevenue(index, "lowEstimate", Number.parseFloat(event.target.value || "0"))}
                  />
                </td>
                <td className="p-2 border-b text-right">
                  <Input
                    type="number"
                    value={estimate.highEstimate}
                    onChange={(event) => updateRevenue(index, "highEstimate", Number.parseFloat(event.target.value || "0"))}
                  />
                </td>
                <td className="p-2 border-b text-right">
                  <Input
                    type="number"
                    value={grossMarginPercentages[index]?.value || 0}
                    onChange={(event) =>
                      updateMetric(setGrossMarginPercentages, index, Number.parseFloat(event.target.value || "0"))
                    }
                  />
                </td>
                <td className="p-2 border-b text-right">
                  <Input
                    type="number"
                    value={yearlySustainingCosts[index]?.value || 0}
                    onChange={(event) =>
                      updateMetric(setYearlySustainingCosts, index, Number.parseFloat(event.target.value || "0"))
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Financials"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
