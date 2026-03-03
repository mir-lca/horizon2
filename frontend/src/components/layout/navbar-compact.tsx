"use client";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { BusinessUnitSelector, DateRangePicker } from "./navbar-components";

export function NavbarCompact() {
  return (
    <header className="h-12 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-end px-4 gap-2 flex-shrink-0">
      <BusinessUnitSelector />
      <DateRangePicker />
      <ThemeToggle />
    </header>
  );
}
