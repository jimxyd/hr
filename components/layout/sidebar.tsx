"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils/cn"
import {
  LayoutDashboard, Users, Calendar, DollarSign,
  Package, BarChart2, Settings, Building2, Bell
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employees", label: "Εργαζόμενοι", icon: Users },
  { href: "/leaves", label: "Άδειες", icon: Calendar },
  { href: "/expenses", label: "Έξοδα", icon: DollarSign },
  { href: "/assets", label: "Εξοπλισμός", icon: Package },
  { href: "/performance", label: "Αξιολογήσεις", icon: BarChart2 },
  { href: "/announcements", label: "Ανακοινώσεις", icon: Bell },
  { href: "/org-chart", label: "Οργανόγραμμα", icon: Building2 },
  { href: "/settings", label: "Ρυθμίσεις", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
        <span className="text-xl font-bold text-primary">ErgoHub</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
