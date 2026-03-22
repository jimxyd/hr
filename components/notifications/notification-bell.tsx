"use client"
import { useState, useEffect, useRef } from "react"
import { Bell } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { formatDateTime } from "@/lib/utils/dates"

interface Notification {
  id: string; type: string; title: string; body: string
  isRead: boolean; createdAt: string; entityType?: string; entityId?: string
}

const TYPE_ICONS: Record<string, string> = {
  LEAVE_REQUEST: "🏖️", LEAVE_APPROVED: "✅", LEAVE_REJECTED: "❌",
  EXPENSE_SUBMITTED: "💰", EXPENSE_APPROVED: "✅", EXPENSE_PAID: "💳",
  ASSET_ASSIGNED: "📦", ASSESSMENT: "🎯", ANNOUNCEMENT: "📢",
  CHANGE_REQUEST: "✏️", CONTRACT_EXPIRY: "📋", DEFAULT: "🔔",
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetch("/api/notifications").then(r => {
      if (!r.ok) throw new Error("Αποτυχία")
      return r.json()
    }),
    refetchInterval: 60000,
    staleTime: 30000,
  })

  const markAllRead = useMutation({
    mutationFn: () => fetch("/api/notifications/read-all", { method: "POST" }).then(r => r.json()),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  })

  const notifications: Notification[] = data?.data?.notifications || []
  const unreadCount: number = data?.data?.unreadCount || 0

  // SSE for real-time unread count
  useEffect(() => {
    let es: EventSource | null = null
    try {
      es = new EventSource("/api/notifications/stream")
      es.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data)
          if (msg.type === "unread_count") {
            queryClient.setQueryData(["notifications"], (old: any) =>
              old ? { ...old, data: { ...old.data, unreadCount: msg.count } } : old
            )
          }
        } catch {}
      }
    } catch {}
    return () => es?.close()
  }, [queryClient])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={`Ειδοποιήσεις${unreadCount > 0 ? ` (${unreadCount} αδιάβαστες)` : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
      >
        <Bell size={18} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1 font-medium" aria-hidden="true">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50"
          role="dialog" aria-label="Ειδοποιήσεις"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Ειδοποιήσεις</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="text-xs text-primary hover:underline disabled:opacity-50"
              >
                Διαβάστηκαν όλες
              </button>
            )}
          </div>

          <ul className="max-h-80 overflow-y-auto" role="list">
            {notifications.length === 0 ? (
              <li className="py-8 text-center text-gray-400 text-sm">
                <Bell size={24} className="mx-auto mb-2 opacity-40" aria-hidden="true" />
                Δεν υπάρχουν ειδοποιήσεις
              </li>
            ) : (
              notifications.map(n => (
                <li
                  key={n.id}
                  className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!n.isRead ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}
                >
                  <div className="flex gap-3">
                    <span className="text-base flex-shrink-0 mt-0.5" aria-hidden="true">
                      {TYPE_ICONS[n.type] || TYPE_ICONS.DEFAULT}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{n.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.createdAt)}</p>
                    </div>
                    {!n.isRead && (
                      <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" aria-hidden="true" />
                    )}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
