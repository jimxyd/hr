"use client"
import { Moon, Sun, LogOut } from "lucide-react"
import { useTheme } from "next-themes"
import { signOut, useSession } from "next-auth/react"
import { NotificationBell } from "@/components/notifications/notification-bell"

export function Header() {
  const { theme, setTheme } = useTheme()
  const { data: session } = useSession()

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 flex-shrink-0">
      <div />
      <div className="flex items-center gap-3">
        {/* Dark mode */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <NotificationBell />

        {/* User */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold">
            {session?.user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-900 dark:text-white leading-none">{session?.user?.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{(session?.user?.role as string[])?.[0] || "User"}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-500 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
          title="Αποσύνδεση"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
