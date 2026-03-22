"use client"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Plus, FileText } from "lucide-react"
import { useSession } from "next-auth/react"
import { hasAnyRole } from "@/lib/utils/roles"
import { PageLoading, PageError, EmptyState } from "@/components/common/page-states"
import { formatDate } from "@/lib/utils/dates"
import { HelpBox } from "@/components/common/help-box"

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT:           { label: "Πρόχειρο",         color: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400" },
  SUBMITTED:       { label: "Υποβλήθηκε",        color: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" },
  UNDER_REVIEW:    { label: "Υπό εξέταση",       color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400" },
  APPROVED:        { label: "Εγκεκριμένο",       color: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" },
  REJECTED:        { label: "Απορρίφθηκε",       color: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400" },
  PENDING_PAYMENT: { label: "Εκκρεμεί πληρωμή", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400" },
  PAID:            { label: "Πληρώθηκε",         color: "bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400" },
  CANCELLED:       { label: "Ακυρώθηκε",         color: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-500" },
}

const STATUS_FILTERS = ["", "DRAFT", "SUBMITTED", "APPROVED", "PENDING_PAYMENT", "PAID"]

export default function ExpensesPage() {
  const { data: session } = useSession()
  const roles = (session?.user?.role as string[]) || []
  const isHR = hasAnyRole(roles, "ADMIN", "HR", "MANAGER")
  const [status, setStatus] = useState("")

  const { data, isLoading, isError } = useQuery({
    queryKey: ["expenses", status],
    queryFn: () => fetch(`/api/expenses?status=${status}&limit=20`).then(r => {
      if (!r.ok) throw new Error("Σφάλμα φόρτωσης")
      return r.json()
    }),
  })

  if (isError) return <PageError />

  const reports = data?.data || []

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expenses</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{data?.meta?.total || 0} reports</p>
        </div>
        <div className="flex items-center gap-3">
          <HelpBox
            storageKey="expenses-list"
            title={isHR ? "Οδηγός Expenses — Manager" : "Οδηγός Expenses"}
            items={isHR ? [
              "Βλέπετε όλα τα expense reports της ομάδας — φιλτράρετε ανά κατάσταση.",
              "Κάντε κλικ στον αριθμό report για να δείτε αναλυτικά τα έξοδα.",
              "Εγκρίνετε ή απορρίψτε reports μέσα από τη σελίδα λεπτομερειών.",
            ] : [
              "Εδώ βλέπετε τα expense reports σας — φιλτράρετε ανά κατάσταση.",
              "Πατήστε «Νέο Report» για να δημιουργήσετε νέα αναφορά εξόδων.",
              "Μετά τη δημιουργία, προσθέστε τα επιμέρους έξοδα και υποβάλετε για έγκριση.",
              "Κάντε κλικ στον αριθμό report για να δείτε/επεξεργαστείτε τα στοιχεία.",
            ]}
          />
          <Link href="/expenses/new" className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} aria-hidden="true" /> Νέο Report
          </Link>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap" role="group" aria-label="Φίλτρα κατάστασης">
        {STATUS_FILTERS.map(s => (
          <button key={s} onClick={() => setStatus(s)}
            aria-pressed={status === s}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              status === s
                ? "bg-primary text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}>
            {s === "" ? "Όλα" : STATUS_CONFIG[s]?.label}
          </button>
        ))}
      </div>

      {isLoading ? <PageLoading /> : reports.length === 0 ? (
        <EmptyState icon="💰" title="Δεν βρέθηκαν αναφορές εξόδων"
          action={{ label: "Νέο report", href: "/expenses/new" }} />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" aria-label="Λίστα expense reports">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Αριθμός</th>
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Τίτλος</th>
                  {isHR && <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Εργαζόμενος</th>}
                  <th scope="col" className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Ποσό</th>
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Κατάσταση</th>
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ημ/νία</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {reports.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-5 py-4">
                      <Link href={`/expenses/${r.id}`} className="font-mono text-sm text-primary hover:underline font-medium">
                        {r.reportNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">{r.title}</td>
                    {isHR && <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{r.employee?.user?.name}</td>}
                    <td className="px-5 py-4 text-sm font-semibold text-gray-900 dark:text-white text-right">
                      €{Number(r.totalAmount).toFixed(2)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[r.status]?.color || "bg-gray-100 text-gray-600"}`}>
                        {STATUS_CONFIG[r.status]?.label || r.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
