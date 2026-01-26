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

interface AppState {
  // Date range state
  dateRange: DateRangeType;
  setDateRange: (dateRange: DateRangeType) => void;

  // Business unit state
  selectedBusinessUnit: string;
  setSelectedBusinessUnit: (businessUnit: string) => void;
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
    }),
    {
      name: "horizon-app-storage",
      partialize: (state) => ({
        dateRange: state.dateRange,
        selectedBusinessUnit: state.selectedBusinessUnit,
      }),
    }
  )
);
