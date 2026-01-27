"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, ReactNode, useEffect } from "react";
import { Menu } from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LoadingState } from "@/components/ui/loading-state";
import { BusinessUnitSelector, DateRangePicker } from "./navbar-components";

interface NavLinkProps {
  href: string;
  children: ReactNode;
  onClick?: () => void;
  onNavStart: () => void;
}

function NavLink({ href, children, onClick, onNavStart }: NavLinkProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  const handleClick = () => {
    if (onClick) onClick();
    if (!isActive) {
      onNavStart();
    }
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(
        "px-3 py-2 text-sm font-medium transition-all rounded-md flex items-center gap-2 relative",
        isActive
          ? "text-primary bg-primary/10"
          : "text-muted-foreground hover:text-primary hover:bg-accent"
      )}
      onMouseEnter={() => router.prefetch(href)}
    >
      <span className="relative flex items-center gap-2">{children}</span>
    </Link>
  );
}

interface MobileNavLinkProps {
  href: string;
  children: ReactNode;
  onClick?: () => void;
  onNavStart: () => void;
}

function MobileNavLink({ href, children, onClick, onNavStart }: MobileNavLinkProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  const handleClick = () => {
    if (onClick) onClick();
    if (!isActive) {
      onNavStart();
    }
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(
        "block px-4 py-2 text-sm font-medium transition-colors hover:bg-accent rounded-md flex items-center justify-between",
        isActive ? "text-primary bg-primary/10" : "text-muted-foreground"
      )}
      onMouseEnter={() => router.prefetch(href)}
    >
      <span>{children}</span>
    </Link>
  );
}

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  const handleNavStart = () => {
    setIsNavigating(true);
  };

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Projects", href: "/projects" },
  ];

  return (
    <>
      {isNavigating && <LoadingState message="Loading..." showBackdrop={true} />}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4 gap-4">
          <div className="md:hidden">
            <DropdownMenu open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="tr-button tr-button-ghost inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10"
                  aria-label="Toggle Menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Navigation</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {navItems.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <MobileNavLink href={item.href} onNavStart={handleNavStart}>
                      {item.name}
                    </MobileNavLink>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Link href="/" className="font-semibold text-primary hidden md:inline-flex">
            Horizon
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href} onNavStart={handleNavStart}>
                {item.name}
              </NavLink>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <BusinessUnitSelector />
            <DateRangePicker />
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </>
  );
}
