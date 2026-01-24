"use client";

import { useState, createContext, useContext, useEffect } from "react";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { useProjectData } from "@/hooks/use-project-data";
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "tr-workspace-components";

export type DateRangeType = {
  startQuarter: number;
  startYear: number;
  endQuarter: number;
  endYear: number;
};

export const BusinessUnitContext = createContext<{
  selectedBusinessUnit: string;
  setSelectedBusinessUnit: (businessUnit: string) => void;
}>({
  selectedBusinessUnit: "all",
  setSelectedBusinessUnit: () => {},
});

export const useBusinessUnit = () => useContext(BusinessUnitContext);

export const DEFAULT_DATE_RANGE: DateRangeType = {
  startQuarter: 1,
  startYear: 2020,
  endQuarter: 4,
  endYear: 2030,
};

export const DateRangeContext = createContext<{
  dateRange: DateRangeType;
  setDateRange: (dateRange: DateRangeType) => void;
}>({
  dateRange: DEFAULT_DATE_RANGE,
  setDateRange: () => {},
});

export const useDateRange = () => useContext(DateRangeContext);

export function DateRangePicker() {
  const { dateRange, setDateRange } = useDateRange();
  const [open, setOpen] = useState(false);

  const quarters = [1, 2, 3, 4];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - 5 + i);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="min-w-fit h-8">
          <CalendarIcon className="h-4 w-4" />
          <span>
            Q{dateRange.startQuarter} {dateRange.startYear} - Q{dateRange.endQuarter}{" "}
            {dateRange.endYear}
          </span>
          <ChevronDown
            className="h-4 w-4 opacity-50 transition-transform"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="end">
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Select Date Range</h4>

          <div className="grid gap-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium mb-1 text-muted-foreground">Start</div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    <span className="text-xs text-muted-foreground mr-1">Q</span>
                    <Select
                      value={dateRange.startQuarter.toString()}
                      onValueChange={(value) => {
                        setDateRange({
                          ...dateRange,
                          startQuarter: Number.parseInt(value, 10),
                        });
                      }}
                    >
                      <SelectTrigger className="h-8 w-14">
                        <SelectValue placeholder="Q" />
                      </SelectTrigger>
                      <SelectContent>
                        {quarters.map((q) => (
                          <SelectItem key={`start-q-${q}`} value={q.toString()}>
                            {q}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Select
                    value={dateRange.startYear.toString()}
                    onValueChange={(value) => {
                      setDateRange({
                        ...dateRange,
                        startYear: Number.parseInt(value, 10),
                      });
                    }}
                  >
                    <SelectTrigger className="h-8 w-20">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={`start-y-${year}`} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <div className="text-xs font-medium mb-1 text-muted-foreground">End</div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    <span className="text-xs text-muted-foreground mr-1">Q</span>
                    <Select
                      value={dateRange.endQuarter.toString()}
                      onValueChange={(value) => {
                        setDateRange({
                          ...dateRange,
                          endQuarter: Number.parseInt(value, 10),
                        });
                      }}
                    >
                      <SelectTrigger className="h-8 w-14">
                        <SelectValue placeholder="Q" />
                      </SelectTrigger>
                      <SelectContent>
                        {quarters.map((q) => (
                          <SelectItem key={`end-q-${q}`} value={q.toString()}>
                            {q}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Select
                    value={dateRange.endYear.toString()}
                    onValueChange={(value) => {
                      setDateRange({
                        ...dateRange,
                        endYear: Number.parseInt(value, 10),
                      });
                    }}
                  >
                    <SelectTrigger className="h-8 w-20">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={`end-y-${year}`} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button size="sm" className="mt-2 w-full" onClick={() => setOpen(false)}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function DateRangeProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [dateRange, setDateRangeState] = useState<DateRangeType>(DEFAULT_DATE_RANGE);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedDateRange = localStorage.getItem("globalDateRange");
      if (savedDateRange) {
        try {
          setDateRangeState(JSON.parse(savedDateRange));
        } catch (error) {
          console.error("Failed to parse saved date range", error);
        }
      }
      setIsLoaded(true);
    }
  }, []);

  const setDateRange = (range: DateRangeType) => {
    setDateRangeState(range);
    if (typeof window !== "undefined") {
      localStorage.setItem("globalDateRange", JSON.stringify(range));
    }
  };

  return (
    <DateRangeContext.Provider value={{ dateRange, setDateRange }}>
      {isLoaded ? children : null}
    </DateRangeContext.Provider>
  );
}

export function BusinessUnitProvider({ children }: { children: React.ReactNode }) {
  const [selectedBusinessUnit, setSelectedBusinessUnitState] = useState("all");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("selectedBusinessUnit");
      if (saved) {
        setSelectedBusinessUnitState(saved);
      }
    }
  }, []);

  const setSelectedBusinessUnit = (businessUnit: string) => {
    setSelectedBusinessUnitState(businessUnit);
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedBusinessUnit", businessUnit);
    }
  };

  return (
    <BusinessUnitContext.Provider value={{ selectedBusinessUnit, setSelectedBusinessUnit }}>
      {children}
    </BusinessUnitContext.Provider>
  );
}

export function BusinessUnitSelector() {
  const { businessUnits } = useProjectData();
  const { selectedBusinessUnit, setSelectedBusinessUnit } = useBusinessUnit();

  return (
    <Select value={selectedBusinessUnit} onValueChange={setSelectedBusinessUnit}>
      <SelectTrigger className="h-8 w-[180px]">
        <SelectValue placeholder="Business Unit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Business Units</SelectItem>
        {businessUnits.map((bu) => (
          <SelectItem key={bu.id} value={String(bu.id)}>
            {bu.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
