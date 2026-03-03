/**
 * Business Unit Selector Component
 *
 * Reusable BU selector that fetches from org data.
 * Displays divisions → business units in a hierarchical dropdown.
 */

"use client";

import React, { useMemo } from "react";
import { useOrgData } from "@/contexts/org-data-context";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { OrgDataBusinessUnit } from "@/lib/types";

interface BusinessUnitSelectorProps {
  value: string | undefined;
  onChange: (buId: string) => void;
  divisionFilter?: string;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function BusinessUnitSelector({
  value,
  onChange,
  divisionFilter,
  disabled = false,
  label = "Business unit",
  placeholder = "Select business unit",
  required = false,
  className = "",
}: BusinessUnitSelectorProps) {
  const { divisions, isLoading, error } = useOrgData();

  // Filter divisions and flatten business units
  const businessUnitsGrouped = useMemo(() => {
    if (!divisions) return [];

    let filteredDivisions = divisions;

    // Apply division filter if provided
    if (divisionFilter) {
      filteredDivisions = divisions.filter((d) => d.id === divisionFilter);
    }

    return filteredDivisions.map((division) => ({
      divisionId: division.id,
      divisionName: division.name,
      businessUnits: division.businessUnits || [],
    }));
  }, [divisions, divisionFilter]);

  // Get selected BU name for display
  const selectedBu = useMemo(() => {
    if (!divisions || !value) return null;

    for (const division of divisions) {
      const bu = division.businessUnits?.find((b) => b.id === value);
      if (bu) return bu;
    }
    return null;
  }, [divisions, value]);

  if (isLoading) {
    return (
      <div className={className}>
        {label && (
          <Label className="mb-2 block">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading org data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        {label && (
          <Label className="mb-2 block">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <div className="text-sm text-red-500">
          Failed to load org data: {error.message}
        </div>
      </div>
    );
  }

  if (businessUnitsGrouped.length === 0) {
    return (
      <div className={className}>
        {label && (
          <Label className="mb-2 block">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <div className="text-sm text-muted-foreground">
          No business units available
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {label && (
        <Label className="mb-2 block">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Select value={value || ""} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder}>
            {selectedBu ? (
              <span>
                {selectedBu.name}
                <span className="text-xs ml-1 opacity-70">
                  ({selectedBu.headcount})
                </span>
              </span>
            ) : (
              placeholder
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {businessUnitsGrouped.map((group) => (
            <SelectGroup key={group.divisionId}>
              <SelectLabel>{group.divisionName}</SelectLabel>
              {group.businessUnits.map((bu: OrgDataBusinessUnit) => (
                <SelectItem key={bu.id} value={bu.id}>
                  {bu.name}
                  <span className="text-xs ml-1 opacity-70">
                    ({bu.headcount})
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Compact version without label
 */
export function BusinessUnitSelectorCompact({
  value,
  onChange,
  divisionFilter,
  disabled = false,
  placeholder = "Select BU",
}: Omit<BusinessUnitSelectorProps, "label" | "required" | "className">) {
  return (
    <BusinessUnitSelector
      value={value}
      onChange={onChange}
      divisionFilter={divisionFilter}
      disabled={disabled}
      placeholder={placeholder}
      label=""
      className=""
    />
  );
}
