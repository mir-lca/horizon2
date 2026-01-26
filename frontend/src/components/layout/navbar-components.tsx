"use client";

import { useState } from "react";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { useProjectData } from "@/hooks/use-project-data";
import { useAppStore } from "@/store/app-store";
import type { BusinessUnit } from "@/lib/types";
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

export function DateRangePicker() {
  const dateRange = useAppStore((state) => state.dateRange);
  const setDateRange = useAppStore((state) => state.setDateRange);
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

export function BusinessUnitSelector() {
  const { businessUnits } = useProjectData();
  const selectedBusinessUnit = useAppStore((state) => state.selectedBusinessUnit);
  const setSelectedBusinessUnit = useAppStore((state) => state.setSelectedBusinessUnit);

  return (
    <Select value={selectedBusinessUnit} onValueChange={setSelectedBusinessUnit}>
      <SelectTrigger className="h-8 w-[180px]">
        <SelectValue placeholder="Business Unit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Business Units</SelectItem>
        {businessUnits.map((bu: BusinessUnit) => (
          <SelectItem key={bu.id} value={String(bu.id)}>
            {bu.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
