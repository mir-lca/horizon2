"use client";

import { Button } from "@/components/ui/button";
import { MockBadge } from "@/components/horizon-ui/mock-badge";

export function TeamsNotificationMock() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <MockBadge system="Microsoft Teams" />
        <Button variant="outline" size="sm" disabled>
          Configure Teams webhook
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">
        Preview: Microsoft Teams Adaptive Card notification
      </div>

      {/* Teams Adaptive Card preview */}
      <div className="rounded-lg border border-[#e0e0e0] dark:border-[#3d3d3d] overflow-hidden shadow-sm max-w-md">
        {/* Card header — Teams blue */}
        <div className="bg-[#464775] px-4 py-3 flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-white/20 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 text-white fill-current"
              aria-hidden="true"
            >
              <path d="M19.952 1.651a7.52 7.52 0 0 1 1.069 3.065 7.52 7.52 0 0 1-.57 3.255 7.28 7.28 0 0 1-1.83 2.555c-.77.68-1.67 1.2-2.63 1.53.41.62.64 1.35.64 2.1 0 2.06-1.67 3.73-3.73 3.73a3.73 3.73 0 0 1-3.73-3.73c0-.75.23-1.48.64-2.1a7.46 7.46 0 0 1-2.63-1.53 7.28 7.28 0 0 1-1.83-2.555 7.52 7.52 0 0 1-.57-3.255 7.52 7.52 0 0 1 1.069-3.065A7.3 7.3 0 0 1 8 0h8a7.3 7.3 0 0 1 3.952 1.651z" />
            </svg>
          </div>
          <span className="text-white text-sm font-semibold">Horizon PPM Alert</span>
        </div>

        {/* Card body */}
        <div className="bg-white dark:bg-[#2d2d2d] px-4 py-3 space-y-2">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Risk level escalated
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Project{" "}
            <span className="font-medium text-gray-800 dark:text-gray-200">
              [Project Name]
            </span>
            : Risk level escalated to{" "}
            <span className="font-semibold text-red-600 dark:text-red-400">
              Critical
            </span>
          </p>

          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500 pt-1">
            <span>Horizon PPM</span>
            <span>·</span>
            <span>Just now</span>
          </div>
        </div>

        {/* Card action buttons */}
        <div className="bg-gray-50 dark:bg-[#262626] border-t border-[#e0e0e0] dark:border-[#3d3d3d] px-4 py-2.5 flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded px-3 py-1.5 text-xs font-medium bg-[#464775] text-white hover:bg-[#3d3d6b] transition-colors"
          >
            View project
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded px-3 py-1.5 text-xs font-medium border border-[#d0d0d0] dark:border-[#4d4d4d] bg-white dark:bg-[#2d2d2d] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#363636] transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        This is a preview only. Configure a Teams webhook to send real notifications.
      </p>
    </div>
  );
}
