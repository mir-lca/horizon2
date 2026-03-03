"use client";

import { Button } from "@/components/ui/button";
import { MockBadge } from "@/components/horizon-ui/mock-badge";

interface OracleActualsMockProps {
  projectId: string;
}

const MOCK_ACTUALS = [
  {
    period: "Q1 2026",
    labor: 142_800,
    nre: 38_500,
    capital: 0,
    poNumbers: "PO-2026-0142",
    soNumbers: "—",
  },
  {
    period: "Q2 2026",
    labor: 158_400,
    nre: 22_000,
    capital: 75_000,
    poNumbers: "PO-2026-0198",
    soNumbers: "SO-2026-0034",
  },
  {
    period: "Q3 2026",
    labor: 176_200,
    nre: 0,
    capital: 120_000,
    poNumbers: "PO-2026-0241, PO-2026-0252",
    soNumbers: "SO-2026-0071",
  },
  {
    period: "Q4 2026",
    labor: 91_600,
    nre: 14_300,
    capital: 0,
    poNumbers: "—",
    soNumbers: "—",
  },
];

function formatCurrency(value: number): string {
  if (value === 0) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function OracleActualsMock({ projectId: _ }: OracleActualsMockProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <MockBadge system="Oracle Fusion Cloud" />
        <Button
          variant="outline"
          size="sm"
          disabled
          title="Requires Oracle Fusion Cloud integration"
        >
          Configure Oracle sync
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">
                Period
              </th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground text-xs">
                Labor actuals
              </th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground text-xs">
                NRE actuals
              </th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground text-xs">
                Capital actuals
              </th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">
                PO numbers
              </th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">
                SO numbers
              </th>
            </tr>
          </thead>
          <tbody>
            {MOCK_ACTUALS.map((row) => (
              <tr
                key={row.period}
                className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
              >
                <td className="px-3 py-2 font-medium">{row.period}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatCurrency(row.labor)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatCurrency(row.nre)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatCurrency(row.capital)}
                </td>
                <td className="px-3 py-2 text-muted-foreground text-xs">
                  {row.poNumbers}
                </td>
                <td className="px-3 py-2 text-muted-foreground text-xs">
                  {row.soNumbers}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
