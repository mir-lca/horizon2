/**
 * Resource Employee Linker Component
 *
 * Optional panel to link employees to resources.
 * Features:
 * - Search employees by name, email, job title
 * - Filter by business unit, function, division
 * - Add employee with allocation %
 * - Visual validation: sum(allocations) ≤ resource.quantity
 */

"use client";

import React, { useState, useMemo } from "react";
import { useEmployeeSearch } from "@/contexts/org-data-context";
import { EmployeeReference, OrgDataEmployee } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, X, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ResourceEmployeeLinkerProps {
  resourceQuantity: number;
  businessUnitId: string | undefined;
  employeeReferences: EmployeeReference[];
  onChange: (references: EmployeeReference[]) => void;
}

export function ResourceEmployeeLinker({
  resourceQuantity,
  businessUnitId,
  employeeReferences,
  onChange,
}: ResourceEmployeeLinkerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] =
    useState<OrgDataEmployee | null>(null);
  const [allocationFte, setAllocationFte] = useState<number>(1.0);

  // Search employees
  const {
    data: searchResults,
    isLoading: isSearching,
    error: searchError,
  } = useEmployeeSearch(searchQuery, {
    businessUnit: businessUnitId,
  });

  // Calculate total allocation
  const totalAllocation = useMemo(() => {
    return employeeReferences.reduce((sum, ref) => sum + ref.allocationFte, 0);
  }, [employeeReferences]);

  const isOverAllocated = totalAllocation > resourceQuantity;
  const remainingCapacity = resourceQuantity - totalAllocation;

  const handleAddEmployee = () => {
    if (!selectedEmployee) return;

    // Check if employee already linked
    if (
      employeeReferences.some((ref) => ref.employeeId === selectedEmployee.id)
    ) {
      alert("This employee is already linked to this resource");
      return;
    }

    // Check if allocation exceeds remaining capacity
    if (allocationFte > remainingCapacity) {
      alert(
        `Allocation (${allocationFte} FTE) exceeds remaining capacity (${remainingCapacity.toFixed(1)} FTE)`
      );
      return;
    }

    const newReference: EmployeeReference = {
      employeeId: selectedEmployee.id,
      email: selectedEmployee.email,
      displayName: selectedEmployee.displayName,
      jobTitle: selectedEmployee.jobTitle,
      businessUnit: selectedEmployee.businessUnit,
      businessUnitId: selectedEmployee.businessUnitId,
      division: selectedEmployee.division,
      allocationFte: allocationFte,
      linkedAt: new Date().toISOString(),
    };

    onChange([...employeeReferences, newReference]);

    // Reset form
    setSelectedEmployee(null);
    setAllocationFte(1.0);
    setSearchQuery("");
  };

  const handleRemoveEmployee = (employeeId: string) => {
    onChange(employeeReferences.filter((ref) => ref.employeeId !== employeeId));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold">
          Link employees (optional)
        </Label>
        <p className="text-sm text-muted-foreground mt-1">
          Link specific employees to this resource pool. Total allocation cannot
          exceed resource quantity.
        </p>
      </div>

      {/* Allocation Summary */}
      <Card className="p-3 bg-muted/50">
        <div className="flex items-center justify-between text-sm">
          <span>Total allocation</span>
          <span
            className={`font-semibold ${isOverAllocated ? "text-red-500" : ""}`}
          >
            {totalAllocation.toFixed(1)} / {resourceQuantity} FTE
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span>Remaining capacity</span>
          <span
            className={`font-semibold ${remainingCapacity < 0 ? "text-red-500" : "text-green-600"}`}
          >
            {remainingCapacity.toFixed(1)} FTE
          </span>
        </div>
      </Card>

      {isOverAllocated && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Total allocation ({totalAllocation.toFixed(1)} FTE) exceeds resource
            quantity ({resourceQuantity} FTE). Please reduce allocations.
          </AlertDescription>
        </Alert>
      )}

      {/* Linked Employees List */}
      {employeeReferences.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Linked employees</Label>
          {employeeReferences.map((ref) => (
            <Card key={ref.employeeId} className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium">{ref.displayName}</div>
                  <div className="text-sm text-muted-foreground">
                    {ref.email}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {ref.jobTitle}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">{ref.businessUnit}</Badge>
                    <Badge variant="outline">{ref.allocationFte} FTE</Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveEmployee(ref.employeeId)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Employee Search and Add */}
      {remainingCapacity > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Add employee</Label>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
              disabled={!businessUnitId}
            />
          </div>

          {!businessUnitId && (
            <p className="text-sm text-muted-foreground">
              Select a business unit first to search employees
            </p>
          )}

          {/* Search Results */}
          {searchQuery.length >= 2 && searchResults && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {searchResults.map((employee) => (
                <Card
                  key={employee.id}
                  className={`p-3 cursor-pointer hover:bg-accent transition-colors ${
                    selectedEmployee?.id === employee.id
                      ? "border-primary bg-accent"
                      : ""
                  }`}
                  onClick={() => setSelectedEmployee(employee)}
                >
                  <div className="font-medium">{employee.displayName}</div>
                  <div className="text-sm text-muted-foreground">
                    {employee.email}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {employee.jobTitle}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">{employee.businessUnit}</Badge>
                    <Badge variant="outline">{employee.division}</Badge>
                  </div>
                </Card>
              ))}

              {searchResults.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No employees found
                </p>
              )}
            </div>
          )}

          {/* Allocation Input */}
          {selectedEmployee && (
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label className="text-sm">Allocation (FTE)</Label>
                <Input
                  type="number"
                  min="0.1"
                  max={remainingCapacity}
                  step="0.1"
                  value={allocationFte}
                  onChange={(e) =>
                    setAllocationFte(parseFloat(e.target.value) || 0)
                  }
                  className="mt-1"
                />
              </div>
              <Button onClick={handleAddEmployee} disabled={allocationFte <= 0}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
