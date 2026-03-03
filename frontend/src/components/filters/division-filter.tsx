/**
 * Division Filter Component
 *
 * Multi-select filter for divisions.
 */

"use client";

import React, { useState } from "react";
import { useOrgData } from "@/contexts/org-data-context";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";

interface DivisionFilterProps {
  value: string[]; // Selected division IDs
  onChange: (divisionIds: string[]) => void;
}

export function DivisionFilter({ value, onChange }: DivisionFilterProps) {
  const { divisions, isLoading } = useOrgData();
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleDivision = (divisionId: string) => {
    if (value.includes(divisionId)) {
      onChange(value.filter((id) => id !== divisionId));
    } else {
      onChange([...value, divisionId]);
    }
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const selectedDivisionNames =
    divisions
      ?.filter((d) => value.includes(d.id))
      .map((d) => d.name) || [];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Division
          {value.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {value.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Filter by division</h4>
            {value.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-auto p-1"
              >
                Clear
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            <div className="space-y-2">
              {divisions?.map((division) => (
                <div key={division.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`div-${division.id}`}
                    checked={value.includes(division.id)}
                    onCheckedChange={() => handleToggleDivision(division.id)}
                  />
                  <label
                    htmlFor={`div-${division.id}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {division.name}
                    <span className="text-xs text-muted-foreground ml-1">
                      ({division.headcount})
                    </span>
                  </label>
                </div>
              ))}
            </div>
          )}

          {value.length > 0 && (
            <div className="pt-2 border-t">
              <div className="flex flex-wrap gap-1">
                {selectedDivisionNames.map((name, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="text-xs gap-1"
                  >
                    {name}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleToggleDivision(value[idx])}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
