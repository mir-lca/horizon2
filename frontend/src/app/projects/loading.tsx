import { ProjectsPageSkeleton } from "@/components/ui/loading-skeleton";

/**
 * Loading UI for the projects page
 * Shows skeleton table while projects data is being fetched
 */
export default function Loading() {
  return <ProjectsPageSkeleton />;
}
