"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ExternalLink, Ban, RefreshCw, Clock, Trash2 } from "lucide-react"

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["tenant", id],
    queryFn: () => fetch(`/api/admin/tenants/${id}`).then(r => r.json()),
  })

  const updateMutation = useMutation({
    mutationFn: (updates: any) =>
      fetch(`/api/admin/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tenant", id] }),
  })

  const extendTrial = () => {
    const days = parseInt(prompt("Πόσες ημέρες επέκταση trial;") || "0")
    if (days > 0) {
      const newExpiry = new Date(Date.now() + days * 86400000)
      updateMutation.mutate({ trialEndsAt: newExpiry.toISOString(), status: "TRIAL" })
    }
  }

  const tenant = data?.data
  if (isLoading) return <div className="p-8 text-center text-gray-500">Φόρτωση...</div>
  if (!tenant) return <div className="p-8 text-center text-gray-500">Εταιρεία δεν βρέθηκε</div>

  const domain = process.env.NEXT_PUBLIC_DOMAIN || "ergohub.gr"
  const statusStyles: Record<string, string> = {
    TRIAL: "bg-yellow-100 text-yellow-800",
    ACTIVE: "bg-green-100 text-green-800",
    SUSPENDED: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-100 text-gray-800",
  }

  return (
    <div className="p-8 max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/tenants" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft size={20} className="text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{tenant.name}</h1>
          <p className="text-gray-500 dark:text-gray-400">{tenant.subdomain}.{domain}</p>
        </div>
        <span className={`ml-auto px-3 py-1 rounded-full text-sm font-medium ${statusStyles[tenant.status]}`}>
          {tenant.status}
        </span>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Στοιχεία</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Database</span>
              <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{tenant.dbName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Trial λήγει</span>
              <span className="font-medium">{new Date(tenant.trialEndsAt).toLocaleDateString("el-GR")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Εγγραφή</span>
              <span>{new Date(tenant.createdAt).toLocaleDateString("el-GR")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Modules</span>
              <div className="flex gap-1">
                {(tenant.activeModules as string[]).map(m => (
                  <span key={m} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">{m}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-white">Ενέργειες</h2>
          <a href={`https://${tenant.subdomain}.${domain}`} target="_blank"
            className="flex items-center gap-2 w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition-colors">
            <ExternalLink size={16} /> Άνοιγμα Tenant
          </a>
          <button onClick={extendTrial}
            className="flex items-center gap-2 w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition-colors">
            <Clock size={16} /> Επέκταση Trial
          </button>
          {tenant.status !== "SUSPENDED" ? (
            <button onClick={() => updateMutation.mutate({ status: "SUSPENDED" })}
              className="flex items-center gap-2 w-full px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm transition-colors">
              <Ban size={16} /> Suspend
            </button>
          ) : (
            <button onClick={() => updateMutation.mutate({ status: "ACTIVE" })}
              className="flex items-center gap-2 w-full px-4 py-2 border border-green-200 text-green-600 rounded-lg hover:bg-green-50 text-sm transition-colors">
              <RefreshCw size={16} /> Reactivate
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
