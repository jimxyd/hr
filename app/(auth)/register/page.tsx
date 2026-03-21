"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"

const schema = z.object({
  companyName: z.string().min(2, "Τουλάχιστον 2 χαρακτήρες"),
  subdomain: z.string()
    .min(3, "Τουλάχιστον 3 χαρακτήρες")
    .max(30, "Μέγιστο 30 χαρακτήρες")
    .regex(/^[a-z0-9-]+$/, "Μόνο πεζά γράμματα, αριθμοί και παύλα (-)")
    .transform(v => v.toLowerCase()),
  adminName: z.string().min(2, "Τουλάχιστον 2 χαρακτήρες"),
  adminEmail: z.string().email("Μη έγκυρο email"),
  adminPassword: z.string().min(8, "Τουλάχιστον 8 χαρακτήρες"),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(v => v, "Απαιτείται αποδοχή όρων"),
}).refine(d => d.adminPassword === d.confirmPassword, {
  message: "Οι κωδικοί δεν ταιριάζουν",
  path: ["confirmPassword"],
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const checkSubdomain = async (subdomain: string) => {
    if (subdomain.length < 3) return
    const res = await fetch(`/api/tenants?subdomain=${subdomain}`).then(r => r.json())
    setSubdomainAvailable(res.data?.available ?? false)
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error?.message || "Σφάλμα εγγραφής")
        return
      }
      router.push(`/register/success?subdomain=${data.subdomain}`)
    } catch {
      setError("Σφάλμα σύνδεσης. Παρακαλώ δοκιμάστε ξανά.")
    } finally {
      setLoading(false)
    }
  }

  const domain = process.env.NEXT_PUBLIC_DOMAIN || "ergohub.gr"

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12">
      <div className="w-full max-w-lg space-y-8 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">ErgoHub</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Δημιουργία νέου λογαριασμού</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">30 ημέρες δωρεάν trial</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Όνομα Εταιρείας *</label>
            <input {...register("companyName")} className="w-full input-field" placeholder="Acme Corp" />
            {errors.companyName && <p className="error-text">{errors.companyName.message}</p>}
          </div>

          {/* Subdomain */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subdomain *</label>
            <div className="flex items-center gap-2">
              <input
                {...register("subdomain")}
                onChange={e => {
                  register("subdomain").onChange(e)
                  checkSubdomain(e.target.value.toLowerCase())
                }}
                className="flex-1 input-field"
                placeholder="mycompany"
              />
              <span className="text-gray-500 text-sm whitespace-nowrap">.{domain}</span>
            </div>
            {errors.subdomain && <p className="error-text">{errors.subdomain.message}</p>}
            {subdomainAvailable === true && <p className="text-green-600 text-sm mt-1">✓ Διαθέσιμο!</p>}
            {subdomainAvailable === false && <p className="text-red-600 text-sm mt-1">✗ Μη διαθέσιμο</p>}
          </div>

          {/* Admin Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ονοματεπώνυμο *</label>
            <input {...register("adminName")} className="w-full input-field" placeholder="Γιάννης Παπαδόπουλος" />
            {errors.adminName && <p className="error-text">{errors.adminName.message}</p>}
          </div>

          {/* Admin Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
            <input {...register("adminEmail")} type="email" className="w-full input-field" placeholder="admin@company.gr" />
            {errors.adminEmail && <p className="error-text">{errors.adminEmail.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Κωδικός *</label>
            <input {...register("adminPassword")} type="password" className="w-full input-field" placeholder="Τουλάχιστον 8 χαρακτήρες" />
            {errors.adminPassword && <p className="error-text">{errors.adminPassword.message}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Επιβεβαίωση Κωδικού *</label>
            <input {...register("confirmPassword")} type="password" className="w-full input-field" placeholder="••••••••" />
            {errors.confirmPassword && <p className="error-text">{errors.confirmPassword.message}</p>}
          </div>

          {/* Terms */}
          <div className="flex items-start gap-2">
            <input {...register("acceptTerms")} type="checkbox" id="terms" className="mt-1" />
            <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400">
              Αποδέχομαι τους <a href="/terms" className="text-primary hover:underline">Όρους Χρήσης</a>
            </label>
          </div>
          {errors.acceptTerms && <p className="error-text">{errors.acceptTerms.message}</p>}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm dark:bg-red-900/20">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || subdomainAvailable === false}
            className="w-full py-2.5 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Δημιουργία λογαριασμού..." : "Δημιουργία Λογαριασμού — 30 ημέρες δωρεάν"}
          </button>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Έχετε ήδη λογαριασμό;{" "}
            <Link href="/login" className="text-primary hover:underline">Σύνδεση</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
