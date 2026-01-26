import React from "react";
import { cn } from "@/lib/utils";

/**
 * Tool Avatar Stack Component
 * Displays overlapping circular avatars for tools/technologies
 * Extracted from ai-adoption-dashboard
 *
 * @example
 * <ToolAvatarStack
 *   tools={[
 *     { name: "GitHub Copilot", icon: "/icons/copilot.png" },
 *     { name: "Claude", icon: "/icons/claude.png" }
 *   ]}
 *   size="md"
 *   maxVisible={2}
 * />
 */

interface Tool {
  name: string;
  icon?: string;
}

interface ToolAvatarStackProps {
  tools: Tool[];
  size?: "sm" | "md" | "lg";
  maxVisible?: number;
  className?: string;
}

const SIZE_CLASSES = {
  sm: "w-5 h-5",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

export function ToolAvatarStack({ tools, size = "md", maxVisible = 2, className }: ToolAvatarStackProps) {
  const visibleTools = tools.slice(0, maxVisible);
  const remainingCount = tools.length - maxVisible;

  return (
    <div className={cn("tool-avatar-stack", className)}>
      {visibleTools.map((tool, index) => (
        <div
          key={`${tool.name}-${index}`}
          className={cn("tool-avatar", SIZE_CLASSES[size])}
          title={tool.name}
          style={{ zIndex: visibleTools.length - index }}
        >
          {tool.icon ? (
            <img src={tool.icon} alt={tool.name} className="tool-avatar-img" />
          ) : (
            <div className="tool-avatar-placeholder">
              <span className="text-xs">{tool.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={cn("tool-avatar-placeholder", SIZE_CLASSES[size])}
          title={`+${remainingCount} more`}
          style={{ zIndex: 0 }}
        >
          <span className="text-xs">+{remainingCount}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Single Tool Avatar Component
 * For displaying a single tool icon
 */
interface ToolAvatarProps {
  tool: Tool;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ToolAvatar({ tool, size = "md", className }: ToolAvatarProps) {
  return (
    <div className={cn("tool-avatar", SIZE_CLASSES[size], className)} title={tool.name}>
      {tool.icon ? (
        <img src={tool.icon} alt={tool.name} className="tool-avatar-img" />
      ) : (
        <div className="tool-avatar-placeholder">
          <span className="text-xs">{tool.name.charAt(0).toUpperCase()}</span>
        </div>
      )}
    </div>
  );
}
