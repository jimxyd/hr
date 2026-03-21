"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Search, ExternalLink, Ban, RefreshCw, Trash2 } from "lucide-react"
import Link from "next/link"

export default function TenantsPage() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["admin-tenants", search, status],
    queryFn: () => fetch(`/api/admin/tenants?search=${search}&status=${status}`).then(r => r.json()),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetch(`/api/admin/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-tenants"] }),
  })

  const tenants = data?.data || []

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tenants</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Διαχείριση εταιρειών-πελατών</p>
        </div>
        <Link
          href="/tenants/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          Νέος Tenant
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Αναζήτηση tenant..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Όλα</option>
          <option value="TRIAL">Trial</option>
          <option value="ACTIVE">Ενεργοί</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="CANCELLED">Ακυρωμένοι</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Εταιρεία</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subdomain</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Κατάσταση</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trial Λήγει</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modules</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ενέργειες</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Φόρτωση...</td></tr>
            ) : tenants.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Δεν βρέθηκαν tenants</td></tr>
            ) : tenants.map((tenant: any) => (
              <tr key={tenant.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900 dark:text-white">{tenant.name}</p>
                </td>
                <td className="px-6 py-4">
                  <a
                    href={`https://${tenant.subdomain}.${process.env.NEXT_PUBLIC_DOMAIN || "ergohub.gr"}`}
                    target="_blank"
                    className="text-primary hover:underline flex items-center gap-1 text-sm"
                  >
                    {tenant.subdomain}
                    <ExternalLink size={12} />
                  </a>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={tenant.status} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {new Date(tenant.trialEndsAt).toLocaleDateString("el-GR")}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1 flex-wrap">
                    {(tenant.activeModules as string[]).map(m => (
                      <span key={m} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 rounded text-xs font-medium">{m}</span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/tenants/${tenant.id}`}
                      className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      <ExternalLink size={16} />
                    </Link>
                    {tenant.status === "ACTIVE" || tenant.status === "TRIAL" ? (
                      <button
                        onClick={() => updateStatus.mutate({ id: tenant.id, status: "SUSPENDED" })}
                        className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Suspend"
                      >
                        <Ban size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={() => updateStatus.mutate({ id: tenant.id, status: "ACTIVE" })}
                        className="p-1.5 text-gray-500 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                        title="Activate"
                      >
                        <RefreshCw size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
