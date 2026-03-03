/**
 * Org Data API Route - Next.js catch-all route
 *
 * Fetches organizational data from CDN with caching.
 * Routes:
 * - GET /api/org-data/divisions
 * - GET /api/org-data/business-units?division={id}
 * - GET /api/org-data/business-units/{bu_id}
 * - GET /api/org-data/employees?business_unit={id}&search={query}
 * - GET /api/org-data/validate?business_unit_id={id}
 */

import { NextRequest, NextResponse } from 'next/server';

const CDN_URL = "https://orgdata-lca-bdcscyfrfjd8fdgh.a01.azurefd.net/organizational-data/org-hierarchy.json";
const CACHE_TTL = 300000; // 5 minutes in milliseconds
const STALE_CACHE_TTL = 86400000; // 24 hours in milliseconds

interface CacheEntry {
  data: any;
  timestamp: number;
}

// In-memory cache (persists across requests in the same Node.js process)
let cache: CacheEntry | null = null;

async function fetchOrgHierarchy(): Promise<any> {
  const currentTime = Date.now();

  // Check if cache is still valid (< 5 minutes old)
  if (cache && (currentTime - cache.timestamp) < CACHE_TTL) {
    console.log('[org-data] Returning fresh cache');
    return cache.data;
  }

  // Try to fetch from CDN
  try {
    console.log(`[org-data] Fetching from CDN: ${CDN_URL}`);
    const response = await fetch(CDN_URL, {
      headers: {
        'User-Agent': 'Horizon-Frontend/1.0'
      },
      next: { revalidate: 300 } // Next.js caching: 5 minutes
    });

    if (!response.ok) {
      throw new Error(`CDN returned ${response.status}`);
    }

    const data = await response.json();

    // Validate schema
    if (!data.version || !data.employees || !data.summary) {
      throw new Error('Invalid org data schema');
    }

    // Update cache
    cache = {
      data,
      timestamp: currentTime
    };

    console.log(`[org-data] Fetched successfully (version: ${data.version})`);
    return data;

  } catch (error) {
    console.error('[org-data] Failed to fetch from CDN:', error);

    // Fallback to stale cache if available (up to 24 hours old)
    if (cache && (currentTime - cache.timestamp) < STALE_CACHE_TTL) {
      console.warn(`[org-data] Using stale cache (age: ${Math.round((currentTime - cache.timestamp) / 1000)}s)`);
      return cache.data;
    }

    // No valid cache available
    console.error('[org-data] No valid cache available');
    return {
      version: "0.0.0",
      generated_at: "",
      employees: [],
      summary: {
        divisions: [],
        functions: []
      }
    };
  }
}

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ route?: string[] }> }
) {
  try {
    const params = await props.params;
    const route = params.route || [];
    const searchParams = request.nextUrl.searchParams;

    console.log(`[org-data] Route: /${route.join('/')}`);

    // Fetch org data
    const orgData = await fetchOrgHierarchy();

    // Handle different routes
    if (route.length === 0 || route[0] === 'divisions') {
      // GET /api/org-data/divisions
      const divisions = orgData.summary?.divisions || [];
      return NextResponse.json(
        { divisions },
        {
          headers: {
            'Cache-Control': 'public, max-age=300'
          }
        }
      );
    }

    if (route[0] === 'business-units') {
      if (route.length === 1) {
        // GET /api/org-data/business-units?division={id}
        const divisionId = searchParams.get('division');
        const divisions = orgData.summary?.divisions || [];

        let businessUnits: any[] = [];

        if (divisionId) {
          // Filter by specific division
          const division = divisions.find((d: any) => d.id === divisionId);
          if (division) {
            businessUnits = division.businessUnits || [];
          }
        } else {
          // Return all business units across all divisions
          for (const division of divisions) {
            const bus = (division.businessUnits || []).map((bu: any) => ({
              ...bu,
              division: division.name,
              divisionId: division.id
            }));
            businessUnits.push(...bus);
          }
        }

        return NextResponse.json(
          { businessUnits },
          {
            headers: {
              'Cache-Control': 'public, max-age=300'
            }
          }
        );
      } else {
        // GET /api/org-data/business-units/{bu_id}
        const buId = route[1];
        const divisions = orgData.summary?.divisions || [];

        let businessUnit = null;
        for (const division of divisions) {
          const bu = (division.businessUnits || []).find((b: any) => b.id === buId);
          if (bu) {
            businessUnit = {
              ...bu,
              division: division.name,
              divisionId: division.id
            };
            break;
          }
        }

        if (!businessUnit) {
          return NextResponse.json(
            { error: `Business unit not found: ${buId}` },
            { status: 404 }
          );
        }

        return NextResponse.json(
          { businessUnit },
          {
            headers: {
              'Cache-Control': 'public, max-age=300'
            }
          }
        );
      }
    }

    if (route[0] === 'employees') {
      // GET /api/org-data/employees?business_unit={id}&search={query}
      const buId = searchParams.get('business_unit');
      const searchQuery = searchParams.get('search') || searchParams.get('query') || '';
      const functionFilter = searchParams.get('function');

      const employees = orgData.employees || [];
      let filtered = employees;

      // Filter by business unit
      if (buId) {
        filtered = filtered.filter((emp: any) => emp.businessUnitId === buId);
      }

      // Filter by function
      if (functionFilter) {
        filtered = filtered.filter((emp: any) => emp.functionCategory === functionFilter);
      }

      // Search by name or email
      if (searchQuery) {
        const queryLower = searchQuery.toLowerCase();
        filtered = filtered.filter((emp: any) => {
          const displayName = (emp.displayName || '').toLowerCase();
          const email = (emp.email || '').toLowerCase();
          return displayName.includes(queryLower) || email.includes(queryLower);
        });
      }

      return NextResponse.json(
        { employees: filtered, count: filtered.length },
        {
          headers: {
            'Cache-Control': 'public, max-age=300'
          }
        }
      );
    }

    if (route[0] === 'validate') {
      // GET /api/org-data/validate?business_unit_id={id}
      const buId = searchParams.get('business_unit_id');

      if (!buId) {
        return NextResponse.json(
          { error: 'business_unit_id parameter required' },
          { status: 400 }
        );
      }

      const divisions = orgData.summary?.divisions || [];
      let businessUnit = null;

      for (const division of divisions) {
        const bu = (division.businessUnits || []).find((b: any) => b.id === buId);
        if (bu) {
          businessUnit = {
            ...bu,
            division: division.name,
            divisionId: division.id
          };
          break;
        }
      }

      if (businessUnit) {
        return NextResponse.json({
          valid: true,
          businessUnit
        });
      } else {
        return NextResponse.json({
          valid: false,
          error: `Business unit not found: ${buId}`
        });
      }
    }

    // Unknown route
    return NextResponse.json(
      { error: 'Unknown route', route: route.join('/') },
      { status: 404 }
    );

  } catch (error) {
    console.error('[org-data] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
