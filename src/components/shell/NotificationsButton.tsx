"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useData } from "@/lib/data-context";
import { useResolvedUser } from "@/lib/people";
import { IconBell } from "@/components/ui/Icons";
import { Avatar } from "@/components/ui/Avatar";
import { timeAgo, cn } from "@/lib/utils";
import type { Notification } from "@/lib/types";

export function NotificationsButton() {
  const { notifications, markNotificationsRead } = useData();
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (unread) markNotificationsRead();
        }}
        aria-label="Notifications"
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/6 text-chalk-100"
      >
        <IconBell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rival-500" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              className="absolute right-0 top-12 z-50 w-80 max-w-[80vw] rounded-2xl card-surface-raised p-2"
            >
              <p className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-chalk-500">
                Notifications
              </p>
              <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
                {notifications.map((n) => (
                  <NotificationRow key={n.id} notification={n} />
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function NotificationRow({ notification }: { notification: Notification }) {
  const actor = useResolvedUser(notification.actorId ?? "");
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl px-3 py-2.5",
        !notification.read && "bg-white/5"
      )}
    >
      {actor ? (
        <Avatar initials={actor.avatarInitials} gradient={actor.avatarColor} size={30} />
      ) : (
        <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-ascend-gradient text-sm">
          ⚡
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs leading-snug text-chalk-300">{notification.message}</p>
        <p className="mt-0.5 text-[10px] text-chalk-700">{timeAgo(notification.createdAt)}</p>
      </div>
    </div>
  );
}
