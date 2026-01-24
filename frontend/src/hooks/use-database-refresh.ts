"use client";

import { useEffect } from "react";

interface RefreshCallback {
  (): void;
}

export function useDatabaseRefresh(refreshCallback: RefreshCallback) {
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshCallback();
      }
    };

    window.addEventListener("focus", handleVisibility);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleVisibility);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refreshCallback]);
}
