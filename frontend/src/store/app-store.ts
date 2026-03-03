import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DateRangeType = {
  startQuarter: number;
  startYear: number;
  endQuarter: number;
  endYear: number;
};

export const DEFAULT_DATE_RANGE: DateRangeType = {
  startQuarter: 1,
  startYear: 2020,
  endQuarter: 4,
  endYear: 2030,
};

export interface ScoringWeights {
  roi: number;
  risk: number;
  strategicFit: number;
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  roi: 0.4,
  risk: 0.3,
  strategicFit: 0.3,
};

interface AppState {
  // Date range state
  dateRange: DateRangeType;
  setDateRange: (dateRange: DateRangeType) => void;

  // Business unit state
  selectedBusinessUnit: string;
  setSelectedBusinessUnit: (businessUnit: string) => void;

  // Projects view state
  projectsView: 'list' | 'kanban';
  setProjectsView: (view: 'list' | 'kanban') => void;

  // Scoring weights
  scoringWeights: ScoringWeights;
  setScoringWeights: (weights: ScoringWeights) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Date range
      dateRange: DEFAULT_DATE_RANGE,
      setDateRange: (dateRange) => set({ dateRange }),

      // Business unit
      selectedBusinessUnit: "all",
      setSelectedBusinessUnit: (businessUnit) =>
        set({ selectedBusinessUnit: businessUnit }),

      // Projects view
      projectsView: 'list',
      setProjectsView: (view) => set({ projectsView: view }),

      // Scoring weights
      scoringWeights: DEFAULT_SCORING_WEIGHTS,
      setScoringWeights: (weights) => set({ scoringWeights: weights }),
    }),
    {
      name: "horizon-app-storage",
      partialize: (state) => ({
        dateRange: state.dateRange,
        selectedBusinessUnit: state.selectedBusinessUnit,
        projectsView: state.projectsView,
        scoringWeights: state.scoringWeights,
      }),
    }
  )
);
