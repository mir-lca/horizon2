import { ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui";
import { PageHeader, PageHeaderProps } from "./page-header";
import { cn } from "@/lib/utils";

/**
 * Tab configuration for PageLayout
 */
export interface PageLayoutTab {
  value: string;
  label: string;
  description?: string;
}

/**
 * Props for the PageLayout component
 */
export interface PageLayoutProps {
  /** Page content */
  children: ReactNode;
  /** Header configuration */
  header: Omit<PageHeaderProps, "className">;
  /** Optional tabs configuration */
  tabs?: {
    value: string;
    onValueChange: (value: string) => void;
    items: PageLayoutTab[];
  };
  /** Currently active tab (for showing description) */
  activeTab?: string;
  /** Optional description text below header */
  description?: string;
  /** Optional additional CSS classes for the container */
  className?: string;
  /** Optional additional CSS classes for the header */
  headerClassName?: string;
  /** Optional additional CSS classes for the content area */
  contentClassName?: string;
}

/**
 * PageLayout Component
 *
 * Provides a consistent page layout with header, optional tabs, and content area.
 * Combines PageHeader with a max-width container and proper spacing.
 *
 * @example
 * // Basic usage
 * ```tsx
 * <PageLayout
 *   header={{
 *     title: "Projects",
 *     subtitle: "Manage projects and hierarchy",
 *     actions: <Button>Create Project</Button>
 *   }}
 * >
 *   <div>Page content here</div>
 * </PageLayout>
 * ```
 *
 * @example
 * // With breadcrumbs
 * ```tsx
 * <PageLayout
 *   header={{
 *     title: "Project Details",
 *     breadcrumbs: [
 *       { label: "Home", href: "/" },
 *       { label: "Projects", href: "/projects" },
 *       { label: "My Project" }
 *     ],
 *     actions: (
 *       <>
 *         <Button variant="outline">Edit</Button>
 *         <Button variant="destructive">Delete</Button>
 *       </>
 *     )
 *   }}
 * >
 *   <div>Content</div>
 * </PageLayout>
 * ```
 *
 * @example
 * // With tabs
 * ```tsx
 * <PageLayout
 *   header={{
 *     title: "Settings",
 *     subtitle: "Manage your preferences"
 *   }}
 *   tabs={{
 *     value: currentTab,
 *     onValueChange: setCurrentTab,
 *     items: [
 *       { value: "general", label: "General" },
 *       { value: "security", label: "Security" }
 *     ]
 *   }}
 * >
 *   <TabContent />
 * </PageLayout>
 * ```
 */
export function PageLayout({
  children,
  header,
  tabs,
  activeTab,
  description,
  className = "container mx-auto px-4 py-6 max-w-7xl",
  headerClassName,
  contentClassName,
}: PageLayoutProps) {
  // Layout with tabs
  if (tabs) {
    return (
      <div className={cn("h-[calc(100vh-4rem)] overflow-hidden flex flex-col", className)}>
        <Tabs
          value={tabs.value}
          onValueChange={tabs.onValueChange}
          className="h-full flex flex-col min-h-0"
        >
          <div className={cn("flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6", headerClassName)}>
            <div className="flex-1">
              <PageHeader {...header} />
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <TabsList className="inline-flex w-auto">
                {tabs.items.map((item) => (
                  <TabsTrigger key={item.value} value={item.value}>
                    {item.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {header.actions && <div className="flex gap-2">{header.actions}</div>}
            </div>
          </div>

          {activeTab && tabs.items.find((item) => item.value === activeTab)?.description && (
            <div className="text-sm text-muted-foreground mb-4">
              {tabs.items.find((item) => item.value === activeTab)?.description}
            </div>
          )}

          {description && (
            <div className="mb-4 text-sm text-muted-foreground">
              <p>{description}</p>
            </div>
          )}

          <div className={cn("flex-1 min-h-0", contentClassName)}>{children}</div>
        </Tabs>
      </div>
    );
  }

  // Standard layout without tabs
  return (
    <div className={className}>
      <PageHeader {...header} className={cn("mb-6", headerClassName)} />

      {description && (
        <div className="mb-4 text-sm text-muted-foreground">
          <p>{description}</p>
        </div>
      )}

      <div className={contentClassName}>{children}</div>
    </div>
  );
}

/**
 * Legacy compatibility wrapper
 * @deprecated Use PageLayout with header prop instead
 */
export function PageLayoutLegacy({
  title,
  subtitle,
  description,
  children,
  actions,
  tabs,
  activeTab,
  className = "container mx-auto px-4 py-3 h-[calc(100vh-4rem)] overflow-hidden flex flex-col",
}: {
  title: string;
  subtitle?: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  tabs?: {
    value: string;
    onValueChange: (value: string) => void;
    items: Array<{
      value: string;
      label: string;
      description?: string;
    }>;
  };
  activeTab?: string;
  className?: string;
}) {
  return (
    <PageLayout
      header={{ title, subtitle, actions }}
      tabs={tabs}
      activeTab={activeTab}
      description={description}
      className={className}
    >
      {children}
    </PageLayout>
  );
}
