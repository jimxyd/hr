"use client"
import { useQuery } from "@tanstack/react-query"
import { Users, TrendingUp, AlertTriangle, CheckCircle, Clock } from "lucide-react"

interface Stats {
  tenants: { total: number; active: number; trial: number; suspended: number }
  revenue: { total: number }
  recentTenants: Array<{ id: string; name: string; subdomain: string; status: string; createdAt: string }>
}

export default function SuperAdminDashboard() {
  const { data, isLoading } = useQuery<{ success: boolean; data: Stats }>({
    queryKey: ["admin-stats"],
    queryFn: () => fetch("/api/admin/stats").then(r => r.json()),
  })

  const stats = data?.data

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Επισκόπηση ολόκληρης της πλατφόρμας</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} label="Σύνολο Tenants" value={stats?.tenants.total ?? 0} color="blue" />
        <StatCard icon={CheckCircle} label="Ενεργοί" value={stats?.tenants.active ?? 0} color="green" />
        <StatCard icon={Clock} label="Trial" value={stats?.tenants.trial ?? 0} color="yellow" />
        <StatCard icon={AlertTriangle} label="Suspended" value={stats?.tenants.suspended ?? 0} color="red" />
      </div>

      {/* Recent Tenants */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Τελευταίες Εγγραφές</h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {stats?.recentTenants.map(tenant => (
            <div key={tenant.id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{tenant.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{tenant.subdomain}.ergohub.gr</p>
              </div>
              <StatusBadge status={tenant.status} />
            </div>
          ))}
          {(!stats?.recentTenants || stats.recentTenants.length === 0) && (
            <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
              Δεν υπάρχουν εγγραφές ακόμα
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: any; label: string; value: number; color: string
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    green: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    yellow: "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400",
    red: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
  }
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className={`inline-flex p-3 rounded-lg ${colors[color as keyof typeof colors]}`}>
        <Icon size={20} />
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-4">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    TRIAL: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    SUSPENDED: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
  }
  const labels: Record<string, string> = {
    TRIAL: "Trial", ACTIVE: "Ενεργός", SUSPENDED: "Suspended", CANCELLED: "Ακυρωμένος"
  }
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || styles.TRIAL}`}>
      {labels[status] || status}
    </span>
  )
}
