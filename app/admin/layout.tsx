"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils/cn"
import { LayoutDashboard, Building2, CreditCard, Mail, FileText, Settings, LogOut } from "lucide-react"
import { signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/tenants", label: "Tenants", icon: Building2 },
  { href: "/admin/billing", label: "Billing", icon: CreditCard },
  { href: "/admin/templates", label: "Email Templates", icon: Mail },
  { href: "/admin/logs", label: "Logs", icon: FileText },
  { href: "/admin/settings", label: "Ρυθμίσεις", icon: Settings },
]

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-700">
          <span className="text-xl font-bold text-white">ErgoHub</span>
          <span className="ml-2 px-1.5 py-0.5 bg-yellow-500 text-yellow-900 text-xs font-bold rounded">ADMIN</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive ? "bg-primary text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-gray-700 flex items-center justify-between">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
