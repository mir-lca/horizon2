"use client";

import React, { useMemo } from "react";
import { Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Legend } from "recharts";
import { formatCurrency } from "@/lib/formatting-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Project } from "@/lib/types";
import { calculateProjectRevenueForYear, calculateProjectSustainingCosts } from "@/lib/financial-calculations";

export interface FinancialChartProps {
  projects: Project | Project[];
  title?: string;
  className?: string;
  cardStyle?: boolean;
}

type YearlyRow = {
  year: number;
  revenue: number;
  cost: number;
  cashFlow: number;
};

const formatAxisCurrency = (value: number) => {
  if (Math.abs(value) >= 1000000) {
    return `${value < 0 ? "-" : ""}$${(Math.abs(value) / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `${value < 0 ? "-" : ""}$${(Math.abs(value) / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
};

export function FinancialChart({ projects, title = "Financial Forecast", className = "", cardStyle = true }: FinancialChartProps) {
  const projectsArray = Array.isArray(projects) ? projects : [projects];

  const data = useMemo<YearlyRow[]>(() => {
    const yearlyMap = new Map<number, YearlyRow>();

    projectsArray.forEach((project) => {
      const devYears = Math.max(1, Math.ceil((project.durationQuarters || 0) / 4));
      const devCostPerYear = devYears > 0 ? (project.totalCost || 0) / devYears : 0;

      for (let i = 0; i < devYears; i += 1) {
        const year = project.startYear + i;
        const row = yearlyMap.get(year) || { year, revenue: 0, cost: 0, cashFlow: 0 };
        row.cost += devCostPerYear;
        row.cashFlow -= devCostPerYear;
        yearlyMap.set(year, row);
      }

      const revenueYears = project.revenueEstimates?.length || 0;
      for (let i = 0; i < revenueYears; i += 1) {
        const year = project.startYear + i;
        const revenueResult = calculateProjectRevenueForYear(project, year);
        if (!revenueResult) continue;

        const row = yearlyMap.get(year) || { year, revenue: 0, cost: 0, cashFlow: 0 };
        const revenue = revenueResult.revenue || 0;
        const grossMargin = project.grossMarginPercentage ?? 50;
        const sustainingCost = calculateProjectSustainingCosts(project, year);
        const grossProfit = revenue * (grossMargin / 100);

        row.revenue += revenue;
        row.cost += sustainingCost;
        row.cashFlow += grossProfit - sustainingCost;
        yearlyMap.set(year, row);
      }
    });

    return Array.from(yearlyMap.values()).sort((a, b) => a.year - b.year);
  }, [projectsArray]);

  const chart = (
    <div className={className}>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis tickFormatter={formatAxisCurrency} />
          <Tooltip formatter={(value: number) => formatCurrency(value)} />
          <Legend />
          <Bar dataKey="cost" name="Cost" fill="#f59e0b" />
          <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" strokeWidth={2} />
          <Line type="monotone" dataKey="cashFlow" name="Cash Flow" stroke="#10b981" strokeWidth={2} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );

  if (!cardStyle) {
    return chart;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{chart}</CardContent>
    </Card>
  );
}
