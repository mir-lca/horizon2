import { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Breadcrumb item for navigation
 */
export interface Breadcrumb {
  /** Display label for the breadcrumb */
  label: string;
  /** Optional href - if provided, renders as a link */
  href?: string;
}

/**
 * Props for the PageHeader component
 */
export interface PageHeaderProps {
  /** Main page title (h1) */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Optional breadcrumbs for navigation context */
  breadcrumbs?: Breadcrumb[];
  /** Optional action buttons/controls (rendered on the right) */
  actions?: ReactNode;
  /** Optional additional CSS classes */
  className?: string;
}

/**
 * PageHeader Component
 *
 * Provides a consistent header layout with title, subtitle, breadcrumbs, and actions.
 * Responsive: stacks on mobile, side-by-side on desktop.
 *
 * @example
 * ```tsx
 * <PageHeader
 *   title="Projects"
 *   subtitle="Manage projects and hierarchy"
 *   breadcrumbs={[
 *     { label: "Home", href: "/" },
 *     { label: "Projects" }
 *   ]}
 *   actions={<Button>Create Project</Button>}
 * />
 * ```
 */
export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row md:justify-between md:items-start gap-4", className)}>
      <div className="flex-1 min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-2">
            <ol className="flex items-center gap-2 text-sm text-muted-foreground">
              {breadcrumbs.map((breadcrumb, index) => (
                <li key={index} className="flex items-center gap-2">
                  {index > 0 && (
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  )}
                  {breadcrumb.href ? (
                    <Link
                      href={breadcrumb.href}
                      className="hover:text-foreground transition-colors"
                    >
                      {breadcrumb.label}
                    </Link>
                  ) : (
                    <span className="text-foreground" aria-current="page">
                      {breadcrumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-muted-foreground mt-1 text-base">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
