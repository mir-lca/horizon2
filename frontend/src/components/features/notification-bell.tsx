"use client";

import { useState } from "react";
import { Bell, BellDot, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllRead,
} from "@/lib/queries";
import type { Notification } from "@/lib/types";

interface NotificationBellProps {
  userEmail: string;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function NotificationBell({ userEmail }: NotificationBellProps) {
  const [open, setOpen] = useState(false);

  const { data: notifications = [] } = useNotifications(userEmail);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllRead();

  const displayed = notifications.slice(0, 20);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleItemClick = (notification: Notification) => {
    if (!notification.read) {
      markRead.mutate({ id: notification.id, userEmail });
    }
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate(userEmail);
  };

  const BellIcon = unreadCount > 0 ? BellDot : Bell;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          aria-label={
            unreadCount > 0
              ? `${unreadCount} unread notifications`
              : "Notifications"
          }
        >
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0"
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-0.5 px-2 text-xs"
              onClick={handleMarkAllRead}
              disabled={markAllRead.isPending}
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <ul>
              {displayed.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    className={cn(
                      "w-full text-left px-4 py-3 border-b last:border-b-0 transition-colors hover:bg-accent/50",
                      !notification.read && "bg-accent/30"
                    )}
                    onClick={() => handleItemClick(notification)}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold leading-snug truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0 mt-0.5">
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                    </div>
                    {!notification.read && (
                      <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
