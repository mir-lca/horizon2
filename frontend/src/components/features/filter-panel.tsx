"use client";

import React from "react";
import { X, Filter } from "lucide-react";
import { Button, Popover, PopoverContent, PopoverTrigger, Badge } from "@/components/ui";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import { Label } from "@/components/ui";
import { BusinessUnit } from "@/lib/types";

export interface FilterState {
  status?: string[];
  funding?: string[];
  maturityLessThan100?: boolean;
  businessUnitId?: string;
}

interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  businessUnits: BusinessUnit[];
  activeFilterCount: number;
  onClearFilters: () => void;
}

export function FilterPanel({
  filters,
  onFilterChange,
  businessUnits,
  activeFilterCount,
  onClearFilters,
}: FilterPanelProps) {
  const statusOptions = [
    { id: "active", value: "active", label: "Active" },
    { id: "completed", value: "completed", label: "Completed" },
    { id: "funded", value: "funded", label: "Funded" },
    { id: "unfunded", value: "unfunded", label: "Unfunded" },
  ];

  const fundingOptions = [
    { id: "funded", value: "funded", label: "Funded" },
    { id: "unfunded", value: "unfunded", label: "Unfunded" },
  ];

  const handleStatusFilterChange = (id: string, checked: boolean) => {
    let newStatuses: string[] | undefined;

    if (checked) {
      newStatuses = [...(filters.status || []), id];
    } else {
      newStatuses = (filters.status || []).filter((s) => s !== id);
      if (newStatuses.length === 0) newStatuses = undefined;
    }

    onFilterChange({ ...filters, status: newStatuses });
  };

  const handleFundingFilterChange = (id: string, checked: boolean) => {
    let newFunding: string[] | undefined;

    if (checked) {
      newFunding = [...(filters.funding || []), id];
    } else {
      newFunding = (filters.funding || []).filter((f) => f !== id);
      if (newFunding.length === 0) newFunding = undefined;
    }

    onFilterChange({ ...filters, funding: newFunding });
  };

  const handleMaturityFilterChange = (checked: boolean) => {
    onFilterChange({
      ...filters,
      maturityLessThan100: checked || undefined,
    });
  };

  const handleBusinessUnitChange = (value: string) => {
    onFilterChange({
      ...filters,
      businessUnitId: value === "all" ? undefined : value,
    });
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <div style={{ width: "120px", flexShrink: 0 }}>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="tr-button tr-button-outline h-9 w-full gap-1 px-3 justify-start font-normal inline-flex items-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              <Filter className="h-4 w-4 mr-1" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <Badge className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filters</h4>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground text-xs" onClick={onClearFilters}>
                    Clear all
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Status</Label>
                <div className="grid grid-cols-2 gap-2">
                  {statusOptions.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${option.id}`}
                        checked={filters.status?.includes(option.id) || false}
                        onCheckedChange={(checked) => handleStatusFilterChange(option.id, checked === true)}
                      />
                      <Label htmlFor={`status-${option.id}`} className="text-sm cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Funding</Label>
                <div className="grid grid-cols-2 gap-2">
                  {fundingOptions.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`funding-${option.id}`}
                        checked={filters.funding?.includes(option.id) || false}
                        onCheckedChange={(checked) => handleFundingFilterChange(option.id, checked === true)}
                      />
                      <Label htmlFor={`funding-${option.id}`} className="text-sm cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Maturity</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="maturity-incomplete"
                    checked={filters.maturityLessThan100 || false}
                    onCheckedChange={(checked) => handleMaturityFilterChange(checked === true)}
                  />
                  <Label htmlFor="maturity-incomplete" className="text-sm cursor-pointer">
                    Less than 100% complete
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Business Unit</Label>
                <Select value={filters.businessUnitId || "all"} onValueChange={handleBusinessUnitChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Business Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Business Units</SelectItem>
                    {businessUnits.map((bu) => (
                      <SelectItem key={bu.id} value={bu.id}>
                        {bu.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-wrap gap-1.5 items-center">
        {filters.status?.map((status) => {
          const option = statusOptions.find((o) => o.id === status);
          return (
            <Badge key={`status-${status}`} variant="outline" className="px-2 py-1 flex items-center gap-1 bg-primary/5">
              <span>{option?.label || status}</span>
              <X className="h-3 w-3 cursor-pointer" onClick={() => handleStatusFilterChange(status, false)} />
            </Badge>
          );
        })}

        {filters.funding?.map((funding) => {
          const option = fundingOptions.find((o) => o.id === funding);
          return (
            <Badge key={`funding-${funding}`} variant="outline" className="px-2 py-1 flex items-center gap-1 bg-primary/5">
              <span>{option?.label || funding}</span>
              <X className="h-3 w-3 cursor-pointer" onClick={() => handleFundingFilterChange(funding, false)} />
            </Badge>
          );
        })}

        {filters.maturityLessThan100 && (
          <Badge key="maturity-incomplete" variant="outline" className="px-2 py-1 flex items-center gap-1 bg-primary/5">
            <span>Maturity &lt; 100%</span>
            <X className="h-3 w-3 cursor-pointer" onClick={() => handleMaturityFilterChange(false)} />
          </Badge>
        )}

        {filters.businessUnitId && (
          <Badge key={`bu-${filters.businessUnitId}`} variant="outline" className="px-2 py-1 flex items-center gap-1 bg-primary/5">
            <span>{businessUnits.find((bu) => bu.id === filters.businessUnitId)?.name || "Business Unit"}</span>
            <X className="h-3 w-3 cursor-pointer" onClick={() => handleBusinessUnitChange("all")} />
          </Badge>
        )}
      </div>
    </div>
  );
}
