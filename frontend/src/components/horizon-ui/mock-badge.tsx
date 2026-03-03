import { cn } from '@/lib/utils';

interface MockBadgeProps {
  system: string;
  className?: string;
}

export function MockBadge({ system, className }: MockBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800',
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
      Illustrative data — {system} integration pending
    </span>
  );
}
