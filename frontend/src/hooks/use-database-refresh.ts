"use client";

import { useEffect } from "react";

interface RefreshCallback {
  (): void;
}

/**
 * Database refresh hook - currently disabled to prevent automatic reloads
 * when switching tabs or bringing app to foreground.
 *
 * TODO: Implement manual refresh with debouncing as part of improvement #10
 */
export function useDatabaseRefresh(refreshCallback: RefreshCallback) {
  console.log("[useDatabaseRefresh] Hook called - automatic refresh DISABLED");
  // Disabled automatic refresh on window focus/visibility changes
  // User reported unwanted reload behavior when switching tabs

  useEffect(() => {
    console.log("[useDatabaseRefresh] useEffect - automatic refresh is disabled, no listeners attached");
    // Automatic refresh disabled - hook is now a no-op
    // To re-enable in the future, add debouncing and make it opt-in
    return () => {
      // Cleanup
    };
  }, [refreshCallback]);
}
