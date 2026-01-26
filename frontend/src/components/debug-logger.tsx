"use client";

import { useEffect } from "react";

/**
 * Debug component to log window focus and visibility events
 * Used for troubleshooting reload issues when switching tabs
 */
export function DebugLogger() {
  useEffect(() => {
    let focusCount = 0;
    let visibilityCount = 0;

    const handleFocus = () => {
      focusCount++;
      console.log(`[FOCUS EVENT #${focusCount}] Window focused`);
    };

    const handleVisibility = () => {
      visibilityCount++;
      console.log(`[VISIBILITY EVENT #${visibilityCount}] State: ${document.visibilityState}`);
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return null;
}
