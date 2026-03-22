"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

const schema = z.object({
  companyName: z.string().min(2, "Τουλάχιστον 2 χαρακτήρες"),
  subdomain: z.string().min(3, "Τουλάχιστον 3 χαρακτήρες").max(30).regex(/^[a-z0-9-]+$/, "Μόνο πεζά, αριθμοί και παύλα"),
  adminName: z.string().min(2, "Τουλάχιστον 2 χαρακτήρες"),
  adminEmail: z.string().email("Μη έγκυρο email"),
  adminPassword: z.string().min(8, "Τουλάχιστον 8 χαρακτήρες"),
  activeModules: z.array(z.string()).default(["M1", "M2", "M3", "M5", "M6"]),
  trialDays: z.coerce.number().min(1).default(30),
})

type FormData = z.infer<typeof schema>

const modules = [
  { id: "M1", label: "HR Core" },
  { id: "M2", label: "Άδειες" },
  { id: "M3", label: "Έξοδα" },
  { id: "M4", label: "Αξιολογήσεις" },
  { id: "M5", label: "Ανακοινώσεις" },
  { id: "M6", label: "Οργανόγραμμα" },
]

export default function NewTenantPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedModules, setSelectedModules] = useState(["M1", "M2", "M3", "M5", "M6"])

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { trialDays: 30, activeModules: ["M1", "M2", "M3", "M5", "M6"] },
  })

  const toggleModule = (id: string) => {
    setSelectedModules(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, activeModules: selectedModules }),
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error?.message || "Σφάλμα δημιουργίας")
        return
      }
      router.push(`/admin/tenants/${json.data.id}`)
    } catch {
      setError("Σφάλμα σύνδεσης")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/tenants" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft size={20} className="text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Νέος Tenant</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Δημιουργία νέας εταιρείας-πελάτη</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Company Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Στοιχεία Εταιρείας</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Όνομα Εταιρείας *</label>
              <input {...register("companyName")} className="form-input" placeholder="Acme Corp" />
              {errors.companyName && <p className="error-text">{errors.companyName.message}</p>}
            </div>
            <div>
              <label className="form-label">Subdomain *</label>
              <input {...register("subdomain")} className="form-input" placeholder="acme" />
              {errors.subdomain && <p className="error-text">{errors.subdomain.message}</p>}
              <p className="text-xs text-gray-400 mt-1">acme.ergohub.gr</p>
            </div>
          </div>
        </div>

        {/* Admin Account */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Λογαριασμός Admin</h2>
          <div>
            <label className="form-label">Ονοματεπώνυμο *</label>
            <input {...register("adminName")} className="form-input" placeholder="Διαχειριστής" />
            {errors.adminName && <p className="error-text">{errors.adminName.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Email *</label>
              <input {...register("adminEmail")} type="email" className="form-input" placeholder="admin@acme.gr" />
              {errors.adminEmail && <p className="error-text">{errors.adminEmail.message}</p>}
            </div>
            <div>
              <label className="form-label">Κωδικός *</label>
              <input {...register("adminPassword")} type="password" className="form-input" placeholder="••••••••" />
              {errors.adminPassword && <p className="error-text">{errors.adminPassword.message}</p>}
            </div>
          </div>
        </div>

        {/* Modules & Trial */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Modules & Trial</h2>
          <div>
            <label className="form-label">Ημέρες Trial</label>
            <input {...register("trialDays")} type="number" className="form-input w-32" />
          </div>
          <div>
            <label className="form-label">Ενεργά Modules</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {modules.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleModule(m.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    selectedModules.includes(m.id)
                      ? "bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400"
                      : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {m.id}: {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Link href="/admin/tenants" className="flex-1 py-2 px-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Ακύρωση
          </Link>
          <button type="submit" disabled={loading}
            className="flex-1 py-2 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {loading ? "Δημιουργία..." : "Δημιουργία Tenant"}
          </button>
        </div>
      </form>
    </div>
  )
}
