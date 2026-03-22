"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { ArrowLeft, Calendar } from "lucide-react"
import { HelpBox } from "@/components/common/help-box"

const schema = z.object({
  leaveTypeId: z.string().min(1, "Επιλέξτε τύπο άδειας"),
  startDate: z.string().min(1, "Υποχρεωτικό"),
  endDate: z.string().min(1, "Υποχρεωτικό"),
  note: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewLeavePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [previewDays, setPreviewDays] = useState<number | null>(null)

  const { data: leaveTypes } = useQuery({
    queryKey: ["leave-types"],
    queryFn: () => fetch("/api/leaves/types").then(r => r.json()),
  })

  const { data: allocations } = useQuery({
    queryKey: ["leave-allocations"],
    queryFn: () => fetch(`/api/leaves/allocations?year=${new Date().getFullYear()}`).then(r => r.json()),
  })

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const watchStart = watch("startDate")
  const watchEnd = watch("endDate")
  const watchType = watch("leaveTypeId")

  // Preview working days
  const calculatePreview = async () => {
    if (!watchStart || !watchEnd) return
    try {
      const res = await fetch(`/api/leaves/preview?start=${watchStart}&end=${watchEnd}`)
      const json = await res.json()
      if (json.success) setPreviewDays(json.data.workingDays)
    } catch {}
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!json.success) { setError(json.error?.message || "Σφάλμα"); return }
      router.push("/leaves")
    } catch { setError("Σφάλμα σύνδεσης") }
    finally { setLoading(false) }
  }

  const selectedTypeBalance = allocations?.data?.find((a: any) => a.leaveTypeId === watchType)
  const available = selectedTypeBalance
    ? selectedTypeBalance.entitledDays + selectedTypeBalance.carriedOver - selectedTypeBalance.usedDays
    : null

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/leaves" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft size={20} className="text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Νέο Αίτημα Άδειας</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Συμπλήρωσε τα στοιχεία της άδειας</p>
        </div>
      </div>

      <HelpBox
        storageKey="leaves-new"
        title="Οδηγός Αιτήματος Άδειας"
        items={[
          "Επιλέξτε τύπο άδειας — το διαθέσιμο υπόλοιπο εμφανίζεται αυτόματα.",
          "Μόλις συμπληρώσετε ημερομηνίες, εμφανίζεται ο αριθμός εργάσιμων ημερών.",
          "Αν οι ημέρες υπερβαίνουν το υπόλοιπο, εμφανίζεται προειδοποίηση.",
          "Το σχόλιο είναι προαιρετικό αλλά βοηθά τον εγκριτή να κατανοήσει το αίτημα.",
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
          {/* Leave Type */}
          <div>
            <label className="form-label">Τύπος Άδειας *</label>
            <select {...register("leaveTypeId")} className="form-input">
              <option value="">Επιλογή τύπου</option>
              {leaveTypes?.data?.map((lt: any) => (
                <option key={lt.id} value={lt.id}>{lt.name}</option>
              ))}
            </select>
            {errors.leaveTypeId && <p className="error-text">{errors.leaveTypeId.message}</p>}
            {available !== null && (
              <p className="text-xs text-gray-500 mt-1">Διαθέσιμο υπόλοιπο: <span className="font-semibold text-primary">{available} ημέρες</span></p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Ημ. Έναρξης *</label>
              <input {...register("startDate")} type="date" className="form-input"
                onBlur={calculatePreview} min={new Date().toISOString().slice(0,10)} />
              {errors.startDate && <p className="error-text">{errors.startDate.message}</p>}
            </div>
            <div>
              <label className="form-label">Ημ. Λήξης *</label>
              <input {...register("endDate")} type="date" className="form-input"
                onBlur={calculatePreview} min={watchStart || new Date().toISOString().slice(0,10)} />
              {errors.endDate && <p className="error-text">{errors.endDate.message}</p>}
            </div>
          </div>

          {/* Preview */}
          {previewDays !== null && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Calendar size={18} className="text-primary" />
              <p className="text-sm text-primary font-medium">
                {previewDays} εργάσιμες ημέρες
                {available !== null && previewDays > available && (
                  <span className="text-red-500 ml-2">⚠ Υπέρβαση υπολοίπου!</span>
                )}
              </p>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="form-label">Σχόλιο (προαιρετικό)</label>
            <textarea {...register("note")} className="form-input" rows={3} placeholder="Προαιρετική αιτιολογία..." />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Link href="/leaves" className="flex-1 py-2 px-4 btn-secondary text-center">Ακύρωση</Link>
          <button type="submit" disabled={loading} className="flex-1 btn-primary">
            {loading ? "Υποβολή..." : "Υποβολή Αιτήματος"}
          </button>
        </div>
      </form>
    </div>
  )
}
