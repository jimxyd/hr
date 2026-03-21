"use client"
import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { signIn } from "next-auth/react"

const steps = [
  { id: 1, title: "Κωδικός", desc: "Ορίστε κωδικό πρόσβασης" },
  { id: 2, title: "Προσωπικά", desc: "ΑΦΜ, ΑΜΚΑ, Ημ. γέννησης" },
  { id: 3, title: "Επικοινωνία", desc: "Διεύθυνση, Επαφή ανάγκης" },
  { id: 4, title: "Οικονομικά", desc: "IBAN, Ιθαγένεια" },
]

const passwordSchema = z.object({
  password: z.string().min(8, "Τουλάχιστον 8 χαρακτήρες"),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Οι κωδικοί δεν ταιριάζουν",
  path: ["confirmPassword"],
})

export default function ActivatePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [tokenData, setTokenData] = useState<{ name: string; email: string } | null>(null)
  const [formData, setFormData] = useState<any>({})

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(passwordSchema)
  })

  useEffect(() => {
    if (!token) return
    fetch(`/api/auth/activate?token=${token}`)
      .then(r => r.json())
      .then(d => { if (d.success) setTokenData(d.data) else setError("Άκυρος σύνδεσμος") })
  }, [token])

  const handleStep = async (data: any) => {
    setFormData((prev: any) => ({ ...prev, ...data }))
    if (step < 4) {
      setStep(s => s + 1)
      return
    }
    // Final submit
    setLoading(true)
    try {
      const res = await fetch("/api/auth/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: formData.password, personalData: formData }),
      })
      const json = await res.json()
      if (!json.success) { setError(json.error?.message || "Σφάλμα"); return }
      // Auto-login
      await signIn("credentials", { email: tokenData?.email, password: formData.password, redirect: false })
      router.push("/dashboard")
    } catch { setError("Σφάλμα σύνδεσης") }
    finally { setLoading(false) }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center max-w-md w-full shadow-lg">
          <p className="text-red-600 text-lg">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-primary p-6 text-white">
          <h1 className="text-xl font-bold">ErgoHub</h1>
          <p className="text-blue-100 mt-1">Καλωσήλθατε, {tokenData?.name}!</p>
        </div>

        {/* Progress */}
        <div className="px-6 pt-6">
          <div className="flex gap-2 mb-6">
            {steps.map(s => (
              <div key={s.id} className="flex-1">
                <div className={`h-1.5 rounded-full transition-colors ${step >= s.id ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"}`} />
                <p className={`text-xs mt-1 ${step === s.id ? "text-primary font-medium" : "text-gray-400"}`}>{s.title}</p>
              </div>
            ))}
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{steps[step-1].desc}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Βήμα {step} από {steps.length}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleStep)} className="p-6 space-y-4">
          {step === 1 && (
            <>
              <div>
                <label className="form-label">Κωδικός Πρόσβασης *</label>
                <input {...register("password")} type="password" className="form-input" placeholder="Τουλάχιστον 8 χαρακτήρες" />
                {errors.password && <p className="error-text">{(errors.password as any).message}</p>}
              </div>
              <div>
                <label className="form-label">Επιβεβαίωση Κωδικού *</label>
                <input {...register("confirmPassword")} type="password" className="form-input" placeholder="••••••••" />
                {errors.confirmPassword && <p className="error-text">{(errors.confirmPassword as any).message}</p>}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="form-label">ΑΦΜ</label>
                <input {...register("afm")} className="form-input" placeholder="000000000" />
              </div>
              <div>
                <label className="form-label">ΑΜΚΑ</label>
                <input {...register("amka")} className="form-input" placeholder="00000000000" />
              </div>
              <div>
                <label className="form-label">Ημερομηνία Γέννησης</label>
                <input {...register("dateOfBirth")} type="date" className="form-input" />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <label className="form-label">Διεύθυνση Κατοικίας</label>
                <input {...register("address")} className="form-input" placeholder="Οδός, Αριθμός, Πόλη" />
              </div>
              <div>
                <label className="form-label">Επαφή Ανάγκης — Όνομα</label>
                <input {...register("emergencyName")} className="form-input" placeholder="Ονοματεπώνυμο" />
              </div>
              <div>
                <label className="form-label">Επαφή Ανάγκης — Τηλέφωνο</label>
                <input {...register("emergencyPhone")} className="form-input" placeholder="69xxxxxxxx" />
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div>
                <label className="form-label">IBAN</label>
                <input {...register("iban")} className="form-input" placeholder="GR00 0000 0000 0000 0000 0000 000" />
              </div>
              <div>
                <label className="form-label">Ιθαγένεια</label>
                <input {...register("nationality")} className="form-input" placeholder="Ελληνική" />
              </div>
            </>
          )}

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            {step > 1 && (
              <button type="button" onClick={() => setStep(s => s - 1)}
                className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Πίσω
              </button>
            )}
            <button type="submit" disabled={loading}
              className="flex-1 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {loading ? "..." : step === 4 ? "Ολοκλήρωση" : "Επόμενο"}
            </button>
          </div>
          
          {step < 4 && (
            <button type="button" onClick={() => setStep(4)}
              className="w-full text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mt-2">
              Παράλειψη — θα τα συμπληρώσω αργότερα
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
