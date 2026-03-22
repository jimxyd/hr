"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { CheckCircle, XCircle } from "lucide-react"
import { PageLoading, PageError, EmptyState } from "@/components/common/page-states"
import { useToast } from "@/components/common/toast"
import { formatDate } from "@/lib/utils/dates"
import { HelpBox } from "@/components/common/help-box"

export default function LeaveApprovalsPage() {
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data, isLoading, isError } = useQuery({
    queryKey: ["leave-approvals"],
    queryFn: () => fetch("/api/leaves?status=PENDING&limit=50").then(r => {
      if (!r.ok) throw new Error("Σφάλμα φόρτωσης")
      return r.json()
    }),
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/leaves/${id}/approve`, { method: "POST" }).then(r => r.json()),
    onSuccess: (data) => {
      if (data.success) {
        toast("success", "Η άδεια εγκρίθηκε επιτυχώς")
        queryClient.invalidateQueries({ queryKey: ["leave-approvals"] })
      } else {
        toast("error", data.error?.message || "Σφάλμα έγκρισης")
      }
    },
    onError: () => toast("error", "Σφάλμα σύνδεσης. Δοκιμάστε ξανά."),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      fetch(`/api/leaves/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      }).then(r => r.json()),
    onSuccess: (data) => {
      if (data.success) {
        toast("success", "Το αίτημα απορρίφθηκε")
        queryClient.invalidateQueries({ queryKey: ["leave-approvals"] })
        setRejectId(null)
        setRejectReason("")
      } else {
        toast("error", data.error?.message || "Σφάλμα απόρριψης")
      }
    },
    onError: () => toast("error", "Σφάλμα σύνδεσης. Δοκιμάστε ξανά."),
  })

  if (isLoading) return <PageLoading />
  if (isError) return <PageError />

  const requests = data?.data || []

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Εκκρεμείς Εγκρίσεις</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{requests.length} αιτήματα περιμένουν</p>
        </div>
        <HelpBox
          storageKey="leaves-approvals"
          title="Οδηγός Εγκρίσεων"
          items={[
            "Εδώ βλέπετε τα αιτήματα αδειών που περιμένουν τη δική σας έγκριση.",
            "Πατήστε «Έγκριση» για να εγκρίνετε ή «Απόρριψη» με αιτιολογία.",
            "Ο εργαζόμενος ειδοποιείται αυτόματα για την απόφασή σας.",
            "Ελέγξτε τις ημερομηνίες και τις εργάσιμες ημέρες πριν αποφασίσετε.",
          ]}
        />
      </div>

      {requests.length === 0 ? (
        <EmptyState icon="✅" title="Δεν υπάρχουν εκκρεμή αιτήματα!" subtitle="Όλα τα αιτήματα έχουν επεξεργαστεί." />
      ) : (
        <ul role="list" className="space-y-4">
          {requests.map((r: any) => (
            <li key={r.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center flex-shrink-0 text-sm">
                    {r.employee?.user?.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{r.employee?.user?.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{r.leaveType?.name}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <span>📅 {formatDate(r.startDate)} — {formatDate(r.endDate)}</span>
                      <span className="font-semibold text-primary">{r.workingDaysCount} εργ. ημέρες</span>
                    </div>
                    {r.note && <p className="mt-2 text-xs text-gray-400 dark:text-gray-500 italic">"{r.note}"</p>}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => approveMutation.mutate(r.id)}
                    disabled={approveMutation.isPending}
                    aria-label={`Έγκριση άδειας ${r.employee?.user?.name}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium transition-colors"
                  >
                    <CheckCircle size={14} aria-hidden="true" /> Έγκριση
                  </button>
                  <button
                    onClick={() => setRejectId(r.id)}
                    aria-label={`Απόρριψη άδειας ${r.employee?.user?.name}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
                  >
                    <XCircle size={14} aria-hidden="true" /> Απόρριψη
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {rejectId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="reject-title">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 id="reject-title" className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Απόρριψη Αιτήματος</h3>
            <label htmlFor="reject-reason" className="form-label">Αιτιολογία *</label>
            <textarea
              id="reject-reason"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="form-input mt-1"
              rows={3}
              placeholder="Παρακαλώ δώστε αιτιολογία απόρριψης..."
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setRejectId(null); setRejectReason("") }} className="flex-1 btn-secondary">
                Ακύρωση
              </button>
              <button
                onClick={() => rejectMutation.mutate({ id: rejectId, reason: rejectReason })}
                disabled={!rejectReason.trim() || rejectMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium transition-colors"
              >
                {rejectMutation.isPending ? "Αποθήκευση..." : "Απόρριψη"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
