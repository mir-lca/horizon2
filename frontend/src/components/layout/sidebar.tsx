"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Layers,
  FolderKanban,
  ListChecks,
  Users,
  ShieldCheck,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

interface SidebarNavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: SidebarNavItem[] = [
  { name: "Home", href: "/", icon: Home },
  { name: "Portfolio", href: "/portfolio", icon: Layers },
  { name: "Programs", href: "/programs", icon: FolderKanban },
  { name: "Projects", href: "/projects", icon: ListChecks },
  { name: "Resources", href: "/resources", icon: Users },
  { name: "Governance", href: "/governance", icon: ShieldCheck },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col h-full border-r bg-background transition-all duration-200",
        collapsed ? "w-14" : "w-56"
      )}
    >
      <div className="flex items-center justify-between px-3 py-4 border-b">
        {!collapsed && (
          <Link href="/" className="font-semibold text-primary text-sm">
            Horizon
          </Link>
        )}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium transition-colors",
                collapsed ? "justify-center" : "",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              title={collapsed ? item.name : undefined}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
