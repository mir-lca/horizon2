"use client";

import { useMemo } from "react";
import { useAppStore } from "@/store/app-store";
import type { Project, ProjectOkrLink } from "@/lib/types";

interface ScoringModelProps {
  projects: Project[];
  okrLinks?: ProjectOkrLink[];
}

function normalise(values: number[]): Map<string, number> {
  const max = Math.max(...values, 1);
  return new Map(values.map((v, i) => [String(i), max > 0 ? v / max : 0]));
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 bg-muted rounded-full h-2 overflow-hidden">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums w-8">{pct}</span>
    </div>
  );
}

export function ScoringModel({ projects, okrLinks = [] }: ScoringModelProps) {
  const { scoringWeights, setScoringWeights } = useAppStore();

  const handleSlider = (key: keyof typeof scoringWeights, raw: number) => {
    const current = { ...scoringWeights, [key]: raw / 100 };
    const total = current.roi + current.risk + current.strategicFit;
    setScoringWeights({
      roi: current.roi / total,
      risk: current.risk / total,
      strategicFit: current.strategicFit / total,
    });
  };

  const scores = useMemo(() => {
    const irrs = projects.map((p) => p.totalCost > 0 ? 1 / p.totalCost : 0);
    const risks = projects.map((p) => {
      const map: Record<string, number> = { low: 0.1, medium: 0.4, high: 0.7, critical: 1.0 };
      return map[p.riskLevel ?? 'low'] ?? 0;
    });
    const okrCounts = projects.map((p) => okrLinks.filter((l) => l.projectId === p.id).length);

    const normIrr = normalise(irrs);
    const normOkr = normalise(okrCounts);

    return projects.map((p, i) => {
      const roiScore = normIrr.get(String(i)) ?? 0;
      const riskScore = 1 - (risks[i] ?? 0);
      const stratScore = normOkr.get(String(i)) ?? 0;
      const total =
        scoringWeights.roi * roiScore +
        scoringWeights.risk * riskScore +
        scoringWeights.strategicFit * stratScore;
      return { project: p, roiScore, riskScore, stratScore, total };
    }).sort((a, b) => b.total - a.total);
  }, [projects, okrLinks, scoringWeights]);

  const pct = (w: number) => Math.round(w * 100);

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="text-sm font-semibold">Scoring weights</h3>
        <p className="text-xs text-muted-foreground">Sliders auto-normalise to 100%</p>

        {(["roi", "risk", "strategicFit"] as const).map((key) => {
          const labels: Record<string, string> = { roi: "ROI / cost efficiency", risk: "Risk (inverse)", strategicFit: "Strategic fit (OKR links)" };
          return (
            <div key={key} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{labels[key]}</span>
                <span className="font-medium tabular-nums">{pct(scoringWeights[key])}%</span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                value={pct(scoringWeights[key])}
                onChange={(e) => handleSlider(key, Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          );
        })}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-3 py-2 text-xs font-medium">#</th>
              <th className="text-left px-3 py-2 text-xs font-medium">Project</th>
              <th className="text-left px-3 py-2 text-xs font-medium">ROI</th>
              <th className="text-left px-3 py-2 text-xs font-medium">Risk</th>
              <th className="text-left px-3 py-2 text-xs font-medium">Strategic fit</th>
              <th className="text-left px-3 py-2 text-xs font-medium">Total score</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {scores.map((row, idx) => (
              <tr key={row.project.id} className="hover:bg-muted/30">
                <td className="px-3 py-2 text-muted-foreground tabular-nums">{idx + 1}</td>
                <td className="px-3 py-2 font-medium">{row.project.name}</td>
                <td className="px-3 py-2"><ScoreBar score={row.roiScore} /></td>
                <td className="px-3 py-2"><ScoreBar score={row.riskScore} /></td>
                <td className="px-3 py-2"><ScoreBar score={row.stratScore} /></td>
                <td className="px-3 py-2"><ScoreBar score={row.total} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
