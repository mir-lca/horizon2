/**
 * Org Data Client - Frontend client for accessing organizational data
 *
 * Fetches data from backend /api/org-data endpoints which cache CDN data.
 */

import {
  OrgDataBusinessUnit,
  OrgDataDivision,
  OrgDataEmployee,
} from "./types";

export class OrgDataClient {
  private baseUrl: string;

  constructor(baseUrl: string = "/api/org-data") {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch all divisions with business units
   */
  async fetchDivisions(): Promise<OrgDataDivision[]> {
    const response = await fetch(`${this.baseUrl}/divisions`);

    if (!response.ok) {
      throw new Error(`Failed to fetch divisions: ${response.statusText}`);
    }

    const data = await response.json();
    return data.divisions || [];
  }

  /**
   * Fetch business units, optionally filtered by division
   */
  async fetchBusinessUnits(
    divisionId?: string
  ): Promise<OrgDataBusinessUnit[]> {
    const url = divisionId
      ? `${this.baseUrl}/business-units?division=${divisionId}`
      : `${this.baseUrl}/business-units`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch business units: ${response.statusText}`);
    }

    const data = await response.json();
    return data.businessUnits || [];
  }

  /**
   * Fetch specific business unit by ID
   */
  async fetchBusinessUnit(buId: string): Promise<OrgDataBusinessUnit | null> {
    const response = await fetch(`${this.baseUrl}/business-units/${buId}`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch business unit: ${response.statusText}`);
    }

    const data = await response.json();
    return data.businessUnit || null;
  }

  /**
   * Fetch employees by business unit
   */
  async fetchEmployeesByBU(buId: string): Promise<OrgDataEmployee[]> {
    const response = await fetch(
      `${this.baseUrl}/employees?business_unit=${buId}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch employees: ${response.statusText}`);
    }

    const data = await response.json();
    return data.employees || [];
  }

  /**
   * Search employees with filters
   */
  async searchEmployees(
    query: string,
    filters?: {
      businessUnit?: string;
      function?: string;
    }
  ): Promise<OrgDataEmployee[]> {
    const params = new URLSearchParams({ search: query });

    if (filters?.businessUnit) {
      params.append("business_unit", filters.businessUnit);
    }
    if (filters?.function) {
      params.append("function", filters.function);
    }

    const response = await fetch(`${this.baseUrl}/employees?${params}`);

    if (!response.ok) {
      throw new Error(`Failed to search employees: ${response.statusText}`);
    }

    const data = await response.json();
    return data.employees || [];
  }

  /**
   * Validate that a business unit ID exists
   */
  async validateBusinessUnit(
    buId: string
  ): Promise<{ valid: boolean; bu?: OrgDataBusinessUnit }> {
    const response = await fetch(
      `${this.baseUrl}/validate?business_unit_id=${buId}`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to validate business unit: ${response.statusText}`
      );
    }

    const data = await response.json();
    return {
      valid: data.valid,
      bu: data.businessUnit,
    };
  }

  /**
   * Get business unit IDs for a division (helper method)
   */
  async getBusinessUnitIdsByDivision(divisionId: string): Promise<string[]> {
    const divisions = await this.fetchDivisions();
    const division = divisions.find((d) => d.id === divisionId);

    if (!division) {
      return [];
    }

    return division.businessUnits.map((bu) => bu.id);
  }
}

// Export singleton instance
export const orgDataClient = new OrgDataClient();
