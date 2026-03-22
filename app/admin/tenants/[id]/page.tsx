"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ExternalLink, Ban, RefreshCw, Clock, Save, Phone, Mail, MapPin, Building2, FileText, User } from "lucide-react"
import { useToast } from "@/components/common/toast"
import { HelpBox } from "@/components/common/help-box"

const ALL_MODULES = [
  { id: "M1", label: "HR Core" },
  { id: "M2", label: "Άδειες" },
  { id: "M3", label: "Έξοδα" },
  { id: "M4", label: "Αξιολογήσεις" },
  { id: "M5", label: "Ανακοινώσεις" },
  { id: "M6", label: "Οργανόγραμμα" },
]

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>({})
  const [modules, setModules] = useState<string[]>([])

  const { data, isLoading } = useQuery({
    queryKey: ["tenant", id],
    queryFn: () => fetch(`/api/admin/tenants/${id}`).then(r => r.json()),
    onSuccess: (data: any) => {
      if (data?.data) {
        setForm(data.data)
        setModules(data.data.activeModules as string[] || [])
      }
    },
  } as any)

  const updateMutation = useMutation({
    mutationFn: (updates: any) =>
      fetch(`/api/admin/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }).then(r => r.json()),
    onSuccess: (res) => {
      if (res.success) {
        toast("success", "Αποθηκεύτηκε επιτυχώς")
        queryClient.invalidateQueries({ queryKey: ["tenant", id] })
        setEditing(false)
      } else {
        toast("error", res.error?.message || "Σφάλμα αποθήκευσης")
      }
    },
    onError: () => toast("error", "Σφάλμα σύνδεσης"),
  })

  const extendTrial = () => {
    const days = parseInt(prompt("Πόσες ημέρες επέκταση trial;") || "0")
    if (days > 0) {
      const current = new Date(tenant.trialEndsAt)
      const newExpiry = new Date(current.getTime() + days * 86400000)
      updateMutation.mutate({ trialEndsAt: newExpiry.toISOString(), status: "TRIAL" })
    }
  }

  const toggleModule = (moduleId: string) => {
    setModules(prev =>
      prev.includes(moduleId) ? prev.filter(m => m !== moduleId) : [...prev, moduleId]
    )
  }

  const saveAll = () => {
    updateMutation.mutate({
      contactName: form.contactName,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
      contactMobile: form.contactMobile,
      vatNumber: form.vatNumber,
      address: form.address,
      city: form.city,
      postalCode: form.postalCode,
      country: form.country,
      notes: form.notes,
      activeModules: modules,
    })
  }

  const tenant = data?.data
  if (isLoading) return <div className="p-8 text-center text-gray-500">Φόρτωση...</div>
  if (!tenant) return <div className="p-8 text-center text-gray-500">Εταιρεία δεν βρέθηκε</div>

  const domain = process.env.NEXT_PUBLIC_DOMAIN || "ergohub.gr"
  const statusStyles: Record<string, string> = {
    TRIAL: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    SUSPENDED: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
  }
  const statusLabels: Record<string, string> = {
    TRIAL: "Trial", ACTIVE: "Ενεργός", SUSPENDED: "Ανεσταλμένος", CANCELLED: "Ακυρωμένος",
  }

  const sub = tenant.subscriptions?.[0]

  return (
    <div className="p-8 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/tenants" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft size={20} className="text-gray-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{tenant.name}</h1>
          <p className="text-gray-500 dark:text-gray-400">{tenant.subdomain}.{domain}</p>
        </div>
        <HelpBox
          storageKey="admin-tenant-detail"
          title="Οδηγός Διαχείρισης Tenant"
          items={[
            "Πατήστε «Επεξεργασία» για να αλλάξετε στοιχεία επικοινωνίας και modules.",
            "Ενεργοποιήστε/απενεργοποιήστε modules κάνοντας κλικ στα κουμπιά.",
            "Η αναστολή (Suspend) απενεργοποιεί τον tenant χωρίς διαγραφή δεδομένων.",
          ]}
        />
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyles[tenant.status]}`}>
          {statusLabels[tenant.status] || tenant.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Στοιχεία Εταιρείας */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Building2 size={18} /> Στοιχεία Εταιρείας
              </h2>
              {!editing && (
                <button onClick={() => setEditing(true)}
                  className="text-sm text-primary hover:underline">Επεξεργασία</button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <InfoField label="Database" value={tenant.dbName} mono />
              <InfoField label="Subdomain" value={`${tenant.subdomain}.${domain}`} />
              <InfoField label="Εγγραφή" value={new Date(tenant.createdAt).toLocaleDateString("el-GR")} />
              <InfoField label="Trial λήγει" value={new Date(tenant.trialEndsAt).toLocaleDateString("el-GR")}
                highlight={tenant.status === "TRIAL"} />
              {tenant.vatNumber && <InfoField label="ΑΦΜ" value={tenant.vatNumber} />}
            </div>
          </div>

          {/* Στοιχεία Επικοινωνίας */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <User size={18} /> Στοιχεία Επικοινωνίας
            </h2>
            {editing ? (
              <div className="grid grid-cols-2 gap-4">
                <EditField label="Όνομα Υπευθύνου" value={form.contactName} onChange={v => setForm({ ...form, contactName: v })} />
                <EditField label="Email" value={form.contactEmail} onChange={v => setForm({ ...form, contactEmail: v })} type="email" />
                <EditField label="Τηλέφωνο" value={form.contactPhone} onChange={v => setForm({ ...form, contactPhone: v })} />
                <EditField label="Κινητό" value={form.contactMobile} onChange={v => setForm({ ...form, contactMobile: v })} />
                <EditField label="ΑΦΜ" value={form.vatNumber} onChange={v => setForm({ ...form, vatNumber: v })} />
                <EditField label="Διεύθυνση" value={form.address} onChange={v => setForm({ ...form, address: v })} />
                <EditField label="Πόλη" value={form.city} onChange={v => setForm({ ...form, city: v })} />
                <EditField label="Τ.Κ." value={form.postalCode} onChange={v => setForm({ ...form, postalCode: v })} />
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 dark:text-gray-400">Σημειώσεις</label>
                  <textarea value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="form-input mt-1" rows={2} placeholder="Εσωτερικές σημειώσεις..." />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <InfoField label="Υπεύθυνος" value={tenant.contactName} icon={<User size={14} />} />
                <InfoField label="Email" value={tenant.contactEmail} icon={<Mail size={14} />} />
                <InfoField label="Τηλέφωνο" value={tenant.contactPhone} icon={<Phone size={14} />} />
                <InfoField label="Κινητό" value={tenant.contactMobile} icon={<Phone size={14} />} />
                <InfoField label="Διεύθυνση" value={[tenant.address, tenant.city, tenant.postalCode].filter(Boolean).join(", ")} icon={<MapPin size={14} />} />
                {tenant.notes && <div className="col-span-2"><InfoField label="Σημειώσεις" value={tenant.notes} icon={<FileText size={14} />} /></div>}
                {!tenant.contactName && !tenant.contactEmail && (
                  <p className="col-span-2 text-gray-400 italic">Δεν έχουν καταχωρηθεί στοιχεία επικοινωνίας</p>
                )}
              </div>
            )}
          </div>

          {/* Modules */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Ενεργά Modules</h2>
            <div className="flex flex-wrap gap-2">
              {ALL_MODULES.map(m => {
                const isActive = (editing ? modules : (tenant.activeModules as string[])).includes(m.id)
                return (
                  <button
                    key={m.id}
                    type="button"
                    disabled={!editing}
                    onClick={() => editing && toggleModule(m.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      isActive
                        ? "bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400"
                        : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500"
                    } ${editing ? "cursor-pointer hover:shadow-sm" : "cursor-default"}`}
                  >
                    {m.id}: {m.label} {isActive ? "✓" : ""}
                  </button>
                )
              })}
            </div>
            {!editing && (
              <p className="text-xs text-gray-400 mt-3">Πατήστε «Επεξεργασία» για να αλλάξετε τα modules.</p>
            )}
          </div>

          {/* Save / Cancel */}
          {editing && (
            <div className="flex gap-3">
              <button onClick={() => { setEditing(false); setForm(tenant); setModules(tenant.activeModules as string[]) }}
                className="flex-1 btn-secondary">Ακύρωση</button>
              <button onClick={saveAll} disabled={updateMutation.isPending}
                className="flex-1 btn-primary flex items-center justify-center gap-2">
                <Save size={16} /> {updateMutation.isPending ? "Αποθήκευση..." : "Αποθήκευση Αλλαγών"}
              </button>
            </div>
          )}

          {/* Subscription Info */}
          {sub && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Συνδρομή</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <InfoField label="Πλάνο" value={tenant.plan?.name || "—"} />
                <InfoField label="Κατάσταση" value={sub.status === "ACTIVE" ? "Ενεργή" : sub.status} />
                <InfoField label="Χρήστες" value={String(sub.userCount)} />
                <InfoField label="Ανανέωση" value={new Date(sub.currentPeriodEnd).toLocaleDateString("el-GR")} highlight />
                <InfoField label="Provider" value={sub.paymentProvider} />
                <InfoField label="Τιμή/χρήστη" value={tenant.plan ? `€${tenant.plan.pricePerUser}` : "—"} />
              </div>
              {sub.payments?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Τελευταίες Πληρωμές</p>
                  <div className="space-y-2">
                    {sub.payments.map((p: any) => (
                      <div key={p.id} className="flex justify-between text-sm p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <span className="text-gray-600 dark:text-gray-400">{new Date(p.createdAt).toLocaleDateString("el-GR")}</span>
                        <span className="font-medium text-gray-900 dark:text-white">€{Number(p.amount).toFixed(2)}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          p.status === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                        }`}>{p.status === "COMPLETED" ? "Ολοκληρώθηκε" : p.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column: Actions */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-3">
            <h2 className="font-semibold text-gray-900 dark:text-white">Ενέργειες</h2>
            <a href={`https://${tenant.subdomain}.${domain}`} target="_blank"
              className="flex items-center gap-2 w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition-colors">
              <ExternalLink size={16} /> Άνοιγμα Tenant
            </a>
            <button onClick={extendTrial}
              className="flex items-center gap-2 w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition-colors">
              <Clock size={16} /> Επέκταση Trial
            </button>
            {tenant.status !== "ACTIVE" && tenant.status !== "SUSPENDED" && (
              <button onClick={() => updateMutation.mutate({ status: "ACTIVE" })}
                className="flex items-center gap-2 w-full px-4 py-2.5 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-sm transition-colors">
                <RefreshCw size={16} /> Ενεργοποίηση
              </button>
            )}
            {tenant.status !== "SUSPENDED" ? (
              <button onClick={() => {
                if (confirm("Σίγουρα θέλετε να αναστείλετε αυτόν τον tenant;"))
                  updateMutation.mutate({ status: "SUSPENDED" })
              }}
                className="flex items-center gap-2 w-full px-4 py-2.5 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-sm transition-colors">
                <Ban size={16} /> Αναστολή
              </button>
            ) : (
              <button onClick={() => updateMutation.mutate({ status: "ACTIVE" })}
                className="flex items-center gap-2 w-full px-4 py-2.5 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-sm transition-colors">
                <RefreshCw size={16} /> Επανενεργοποίηση
              </button>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Πληροφορίες</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Εγγραφή</span>
                <span>{new Date(tenant.createdAt).toLocaleDateString("el-GR")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Τελευταία ενημέρωση</span>
                <span>{new Date(tenant.updatedAt).toLocaleDateString("el-GR")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Database</span>
                <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{tenant.dbName}</span>
              </div>
              {tenant.plan && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Πλάνο</span>
                  <span className="font-medium">{tenant.plan.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoField({ label, value, icon, mono, highlight }: {
  label: string; value?: string | null; icon?: React.ReactNode; mono?: boolean; highlight?: boolean
}) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
        {icon} {label}
      </p>
      <p className={`mt-0.5 text-gray-900 dark:text-white ${mono ? "font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded inline-block" : ""} ${highlight ? "text-primary font-semibold" : ""}`}>
        {value || "—"}
      </p>
    </div>
  )
}

function EditField({ label, value, onChange, type = "text" }: {
  label: string; value?: string | null; onChange: (v: string) => void; type?: string
}) {
  return (
    <div>
      <label className="text-xs text-gray-500 dark:text-gray-400">{label}</label>
      <input type={type} value={value || ""} onChange={e => onChange(e.target.value)}
        className="form-input mt-1" />
    </div>
  )
}
