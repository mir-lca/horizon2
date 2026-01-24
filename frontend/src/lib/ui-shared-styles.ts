/**
 * Shared UI styling utilities for consistent component appearance
 */

export const SCROLLBAR_CLASSES = [
  "[&::-webkit-scrollbar]:w-2",
  "[&::-webkit-scrollbar]:h-2",
  "[&::-webkit-scrollbar-track]:bg-transparent",
  "[&::-webkit-scrollbar-thumb]:bg-neutral-300",
  "dark:[&::-webkit-scrollbar-thumb]:bg-neutral-600",
  "hover:[&::-webkit-scrollbar-thumb]:bg-neutral-400",
  "dark:hover:[&::-webkit-scrollbar-thumb]:bg-neutral-500",
  "[&::-webkit-scrollbar-thumb]:rounded-full",
  "[&::-webkit-scrollbar-thumb]:border-2",
  "[&::-webkit-scrollbar-thumb]:border-solid",
  "[&::-webkit-scrollbar-thumb]:border-transparent",
  "[&::-webkit-scrollbar]:opacity-0",
  "hover:[&::-webkit-scrollbar]:opacity-100",
  "[&::-webkit-scrollbar]:transition-opacity",
].join(" ");

export const SCROLL_AREA_CLASSES = [
  "h-full",
  "[&_[data-radix-scroll-area-scrollbar]]:opacity-0",
  "hover:[&_[data-radix-scroll-area-scrollbar]]:opacity-100",
  "[&_[data-radix-scroll-area-scrollbar]]:transition-opacity",
].join(" ");

export const SCROLL_AREA_HORIZONTAL_CLASSES = [
  "h-full",
  "overflow-x-auto",
  "[&_[data-radix-scroll-area-scrollbar]]:opacity-0",
  "hover:[&_[data-radix-scroll-area-scrollbar]]:opacity-100",
  "[&_[data-radix-scroll-area-scrollbar]]:transition-opacity",
].join(" ");

export const STICKY_HEADER_CLASSES = {
  container: "sticky top-0 z-30 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 shadow-sm",
  leftColumn: "sticky left-0 z-40 bg-background border-r border-border",
  header: "bg-neutral-50/50 dark:bg-neutral-900/50",
};

export const COMPONENT_BORDER_CLASSES = "rounded-lg border border-border overflow-hidden";
