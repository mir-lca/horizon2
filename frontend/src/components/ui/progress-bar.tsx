"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

// Configure NProgress
NProgress.configure({
  showSpinner: false,
  trickleSpeed: 200,
  minimum: 0.08,
});

export function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  console.log("[ProgressBar] Component rendered", { pathname, searchParams: searchParams?.toString() });

  useEffect(() => {
    console.log("[ProgressBar] useEffect triggered - calling NProgress.done()");
    NProgress.done();
  }, [pathname, searchParams]);

  return null;
}
