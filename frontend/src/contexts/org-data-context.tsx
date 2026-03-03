/**
 * Org Data Context - React context for organizational data
 *
 * Provides org data (divisions, business units) to the entire app
 * with React Query caching and automatic refresh.
 */

"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { orgDataClient } from "@/lib/org-data-client";
import { OrgDataDivision } from "@/lib/types";

interface OrgDataContextValue {
  divisions: OrgDataDivision[] | undefined;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

const OrgDataContext = createContext<OrgDataContextValue | undefined>(
  undefined
);

interface OrgDataProviderProps {
  children: ReactNode;
}

export function OrgDataProvider({ children }: OrgDataProviderProps) {
  const {
    data,
    isLoading,
    error,
    refetch,
  }: UseQueryResult<OrgDataDivision[], Error> = useQuery({
    queryKey: ["org-data", "divisions"],
    queryFn: () => orgDataClient.fetchDivisions(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 60 * 60 * 1000, // 1 hour (formerly cacheTime)
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const value: OrgDataContextValue = {
    divisions: data,
    isLoading,
    error: error as Error | null,
    refresh: () => {
      refetch();
    },
  };

  return (
    <OrgDataContext.Provider value={value}>
      {children}
    </OrgDataContext.Provider>
  );
}

/**
 * Hook to access org data context
 */
export function useOrgData(): OrgDataContextValue {
  const context = useContext(OrgDataContext);

  if (context === undefined) {
    throw new Error("useOrgData must be used within an OrgDataProvider");
  }

  return context;
}

/**
 * Hook to fetch a specific business unit with caching
 */
export function useBusinessUnit(buId: string | undefined) {
  return useQuery({
    queryKey: ["org-data", "business-unit", buId],
    queryFn: () => (buId ? orgDataClient.fetchBusinessUnit(buId) : null),
    enabled: !!buId,
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

/**
 * Hook to fetch business units by division with caching
 */
export function useBusinessUnits(divisionId?: string) {
  return useQuery({
    queryKey: ["org-data", "business-units", divisionId],
    queryFn: () => orgDataClient.fetchBusinessUnits(divisionId),
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

/**
 * Hook to search employees with caching
 */
export function useEmployeeSearch(
  query: string,
  filters?: { businessUnit?: string; function?: string }
) {
  return useQuery({
    queryKey: ["org-data", "employees", query, filters],
    queryFn: () => orgDataClient.searchEmployees(query, filters),
    enabled: query.length >= 2, // Only search if query is at least 2 characters
    staleTime: 2 * 60 * 1000, // 2 minutes (shorter for employee search)
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
