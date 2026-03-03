/**
 * Business Unit Filter Component
 *
 * Multi-select filter for business units.
 * Displays divisions → business units hierarchically.
 */

"use client";

import React, { useState, useMemo } from "react";
import { useOrgData } from "@/contexts/org-data-context";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BusinessUnitFilterProps {
  value: string[]; // Selected BU IDs
  onChange: (buIds: string[]) => void;
  allowMultiple?: boolean;
}

export function BusinessUnitFilter({
  value,
  onChange,
  allowMultiple = true,
}: BusinessUnitFilterProps) {
  const { divisions, isLoading } = useOrgData();
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleBu = (buId: string) => {
    if (allowMultiple) {
      if (value.includes(buId)) {
        onChange(value.filter((id) => id !== buId));
      } else {
        onChange([...value, buId]);
      }
    } else {
      onChange([buId]);
      setIsOpen(false);
    }
  };

  const handleClearAll = () => {
    onChange([]);
  };

  // Get selected BU names for display
  const selectedBuNames = useMemo(() => {
    if (!divisions || value.length === 0) return [];

    const names: string[] = [];
    for (const division of divisions) {
      for (const bu of division.businessUnits || []) {
        if (value.includes(bu.id)) {
          names.push(bu.name);
        }
      }
    }
    return names;
  }, [divisions, value]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Business unit
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
            <h4 className="font-semibold text-sm">Filter by business unit</h4>
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
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {divisions?.map((division) => (
                  <div key={division.id} className="space-y-2">
                    <Label className="text-sm font-semibold text-muted-foreground">
                      {division.name}
                    </Label>
                    <div className="space-y-2 pl-2">
                      {division.businessUnits?.map((bu) => (
                        <div
                          key={bu.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`bu-${bu.id}`}
                            checked={value.includes(bu.id)}
                            onCheckedChange={() => handleToggleBu(bu.id)}
                          />
                          <label
                            htmlFor={`bu-${bu.id}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {bu.name}
                            <span className="text-xs text-muted-foreground ml-1">
                              ({bu.headcount})
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {value.length > 0 && (
            <div className="pt-2 border-t">
              <Label className="text-xs text-muted-foreground mb-2 block">
                Selected ({value.length})
              </Label>
              <div className="flex flex-wrap gap-1">
                {selectedBuNames.map((name, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="text-xs gap-1"
                  >
                    {name}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleToggleBu(value[idx])}
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
