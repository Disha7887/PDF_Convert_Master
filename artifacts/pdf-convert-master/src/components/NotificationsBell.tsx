import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { authedJson } from "@/lib/authedFetch";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, CheckCheck, ShieldCheck, Sparkles, Info } from "lucide-react";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function iconFor(type: string) {
  if (type === "welcome")
    return <Sparkles className="w-4 h-4 text-[#f7433d]" />;
  if (type === "security")
    return <ShieldCheck className="w-4 h-4 text-[#f7433d]" />;
  return <Info className="w-4 h-4 text-[#f7433d]" />;
}

export const NotificationsBell = () => {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading, refetch } = useQuery<NotificationItem[]>(
    {
      queryKey: ["/api/notifications"],
      queryFn: () =>
        authedJson<{ data: NotificationItem[] }>("/api/notifications").then(
          (r) => r.data,
        ),
    },
  );

  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    queryFn: () =>
      authedJson<{ data: { count: number } }>(
        "/api/notifications/unread-count",
      ).then((r) => r.data),
    refetchInterval: 60000,
  });

  const unreadCount = countData?.count ?? 0;

  const markRead = useMutation({
    mutationFn: (id: string) =>
      authedJson(`/api/notifications/${id}/read`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/notifications/unread-count"],
      });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () =>
      authedJson("/api/notifications/read-all", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/notifications/unread-count"],
      });
    },
  });

  const handleItemClick = (n: NotificationItem) => {
    if (!n.read) markRead.mutate(n.id);
    if (n.link && n.link.startsWith("/")) {
      setOpen(false);
      setLocation(n.link);
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      // Pull the freshest list when the panel opens so the badge count and the
      // listed items can never drift apart.
      refetch();
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="hidden sm:inline-flex relative"
          data-testid="button-notifications"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 w-5 h-5 bg-[#f7433d] text-white text-xs rounded-full flex items-center justify-center"
              data-testid="badge-notifications-count"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <p className="text-sm font-semibold text-gray-900">Notifications</p>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="flex items-center gap-1 text-xs font-medium text-[#f7433d] hover:underline disabled:opacity-50"
              data-testid="button-mark-all-read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <p className="px-4 py-8 text-center text-sm text-gray-500">
              Loading…
            </p>
          ) : items.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Bell className="w-8 h-8 mx-auto text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">No notifications yet</p>
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleItemClick(n)}
                    className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-gray-50 transition-colors ${
                      n.read ? "" : "bg-[#f7433d]/5"
                    }`}
                    data-testid={`notification-item-${n.id}`}
                  >
                    <div className="mt-0.5 shrink-0">{iconFor(n.type)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="mt-1 w-2 h-2 rounded-full bg-[#f7433d] shrink-0" />
                        )}
                      </div>
                      {n.body && (
                        <p className="mt-0.5 text-xs text-gray-600 line-clamp-2">
                          {n.body}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-gray-400">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
