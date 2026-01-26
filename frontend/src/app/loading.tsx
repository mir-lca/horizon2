import { DashboardSkeleton } from "@/components/ui/loading-skeleton";

/**
 * Root-level loading UI shown during page transitions
 * This displays while the page is being fetched/rendered
 */
export default function Loading() {
  return <DashboardSkeleton />;
}
