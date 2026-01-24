import { ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger } from "tr-workspace-components";

interface PageLayoutProps {
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
}

export function PageLayout({
  title,
  subtitle,
  description,
  children,
  actions,
  tabs,
  activeTab,
  className = "container mx-auto px-4 py-3 h-[calc(100vh-4rem)] overflow-hidden flex flex-col",
}: PageLayoutProps) {
  if (tabs) {
    return (
      <div className={className}>
        <Tabs value={tabs.value} onValueChange={tabs.onValueChange} className="h-full flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">{title}</h1>
              {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-4">
              <TabsList className="inline-flex w-auto">
                {tabs.items.map((item) => (
                  <TabsTrigger key={item.value} value={item.value}>
                    {item.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {actions && <div className="flex gap-2">{actions}</div>}
            </div>
          </div>

          {activeTab && (
            <div className="text-sm text-muted-foreground mb-4">
              {tabs.items.find((item) => item.value === activeTab)?.description}
            </div>
          )}

          {description && (
            <div className="mb-2 text-sm text-muted-foreground">
              <p>{description}</p>
            </div>
          )}

          <div className="flex-1 min-h-0">{children}</div>
        </Tabs>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>

      {description && (
        <div className="mb-4 text-sm text-muted-foreground">
          <p>{description}</p>
        </div>
      )}

      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
