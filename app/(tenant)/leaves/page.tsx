"use client"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Plus, Calendar, Clock, CheckCircle, XCircle } from "lucide-react"
import { PageLoading, PageError, EmptyState } from "@/components/common/page-states"
import { formatDate } from "@/lib/utils/dates"
import { HelpBox } from "@/components/common/help-box"

const STATUS_CONFIG: Record<string, { label: string; color: string; Icon: any }> = {
  PENDING:    { label: "Εκκρεμεί",    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400", Icon: Clock },
  PENDING_L2: { label: "2ο Επίπεδο", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400", Icon: Clock },
  APPROVED:   { label: "Εγκεκριμένο", color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400", Icon: CheckCircle },
  REJECTED:   { label: "Απορρίφθηκε", color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400", Icon: XCircle },
  CANCELLED:  { label: "Ακυρώθηκε",  color: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400", Icon: XCircle },
  WITHDRAWN:  { label: "Ανακλήθηκε", color: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400", Icon: XCircle },
}

export default function LeavesPage() {
  const year = new Date().getFullYear()

  const { data: allocData, isLoading: allocLoading, isError: allocError } = useQuery({
    queryKey: ["leave-allocations", year],
    queryFn: () => fetch(`/api/leaves/allocations?year=${year}`).then(r => {
      if (!r.ok) throw new Error("Σφάλμα φόρτωσης υπολοίπων")
      return r.json()
    }),
  })

  const { data: reqData, isLoading: reqLoading, isError: reqError } = useQuery({
    queryKey: ["leave-requests"],
    queryFn: () => fetch("/api/leaves?limit=10").then(r => {
      if (!r.ok) throw new Error("Σφάλμα φόρτωσης αιτημάτων")
      return r.json()
    }),
  })

  if (allocError || reqError) return <PageError />

  const allocs = allocData?.data || []
  const reqs = reqData?.data || []

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Άδειες</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Έτος {year}</p>
        </div>
        <div className="flex items-center gap-3">
          <HelpBox
            storageKey="leaves-list"
            title="Οδηγός Αδειών"
            items={[
              "Στο πάνω μέρος βλέπετε τα υπόλοιπα αδειών σας ανά τύπο για το τρέχον έτος.",
              "Πατήστε «Νέο Αίτημα» για να υποβάλετε αίτημα άδειας.",
              "Τα αιτήματα περνούν από έγκριση — θα ενημερωθείτε με ειδοποίηση.",
              "Το «Ημερολόγιο» δείχνει τις άδειες ολόκληρης της ομάδας σας.",
            ]}
          />
          <Link href="/leaves/calendar" className="btn-secondary flex items-center gap-2 text-sm" aria-label="Ημερολόγιο ομάδας">
            <Calendar size={16} aria-hidden="true" /> Ημερολόγιο
          </Link>
          <Link href="/leaves/new" className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} aria-hidden="true" /> Νέο Αίτημα
          </Link>
        </div>
      </div>

      {allocLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-24 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 animate-pulse" />
          ))}
        </div>
      ) : allocs.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Υπόλοιπα {year}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {allocs.map((a: any) => {
              const available = a.entitledDays + a.carriedOver - a.usedDays
              const pct = Math.max(0, Math.min(100, (available / Math.max(a.entitledDays + a.carriedOver, 1)) * 100))
              return (
                <div key={a.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: a.leaveType?.color || "#2E5FA3" }} />
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">{a.leaveType?.name}</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{available}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">από {a.entitledDays + a.carriedOver} ημέρες</p>
                  <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: a.leaveType?.color || "#2E5FA3" }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Πρόσφατα Αιτήματα</p>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {reqLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />)}
            </div>
          ) : reqs.length === 0 ? (
            <EmptyState icon="🏖️" title="Δεν υπάρχουν αιτήματα"
              action={{ label: "Νέο αίτημα", href: "/leaves/new" }} />
          ) : (
            <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
              {reqs.map((r: any) => {
                const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.PENDING
                const Icon = cfg.Icon
                return (
                  <li key={r.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                        style={{ backgroundColor: `${r.leaveType?.color || "#2E5FA3"}20` }}>
                        🏖️
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{r.leaveType?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {formatDate(r.startDate)} — {formatDate(r.endDate)} · {r.workingDaysCount} εργ. ημέρες
                        </p>
                      </div>
                    </div>
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                      <Icon size={11} aria-hidden="true" /> {cfg.label}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
