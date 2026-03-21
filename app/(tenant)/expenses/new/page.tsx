"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

const schema = z.object({
  title: z.string().min(2, "Τουλάχιστον 2 χαρακτήρες"),
  description: z.string().optional(),
  periodFrom: z.string().min(1, "Υποχρεωτικό"),
  periodTo: z.string().min(1, "Υποχρεωτικό"),
})

export default function NewExpensePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      periodFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
      periodTo: new Date().toISOString().slice(0, 10),
    }
  })

  const onSubmit = async (data: any) => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!json.success) { setError(json.error?.message || "Σφάλμα"); return }
      router.push(`/expenses/${json.data.id}`)
    } catch { setError("Σφάλμα σύνδεσης") }
    finally { setLoading(false) }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/expenses" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft size={20} className="text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Νέο Expense Report</h1>
          <p className="text-sm text-gray-500 mt-1">Δημιουργία νέας αναφοράς εξόδων</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
          <div>
            <label className="form-label">Τίτλος *</label>
            <input {...register("title")} className="form-input" placeholder="π.χ. Έξοδα Ιανουαρίου 2026" />
            {errors.title && <p className="error-text">{errors.title.message as string}</p>}
          </div>
          <div>
            <label className="form-label">Περιγραφή</label>
            <textarea {...register("description")} className="form-input" rows={2} placeholder="Προαιρετική περιγραφή..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Περίοδος Από *</label>
              <input {...register("periodFrom")} type="date" className="form-input" />
              {errors.periodFrom && <p className="error-text">{errors.periodFrom.message as string}</p>}
            </div>
            <div>
              <label className="form-label">Περίοδος Έως *</label>
              <input {...register("periodTo")} type="date" className="form-input" />
              {errors.periodTo && <p className="error-text">{errors.periodTo.message as string}</p>}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Link href="/expenses" className="flex-1 btn-secondary text-center">Ακύρωση</Link>
          <button type="submit" disabled={loading} className="flex-1 btn-primary">
            {loading ? "Δημιουργία..." : "Δημιουργία Report"}
          </button>
        </div>
      </form>
    </div>
  )
}
