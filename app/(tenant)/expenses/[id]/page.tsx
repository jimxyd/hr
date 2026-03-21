"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2, Send, CheckCircle, XCircle, CreditCard, Receipt } from "lucide-react"
import { formatDate } from "@/lib/utils/dates"
import { hasAnyRole } from "@/lib/utils/roles"

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT:           { label: "Πρόχειρο",         color: "bg-gray-100 text-gray-600" },
  SUBMITTED:       { label: "Υποβλήθηκε",        color: "bg-blue-100 text-blue-700" },
  UNDER_REVIEW:    { label: "Υπό εξέταση",       color: "bg-yellow-100 text-yellow-700" },
  APPROVED:        { label: "Εγκεκριμένο",       color: "bg-green-100 text-green-700" },
  REJECTED:        { label: "Απορρίφθηκε",       color: "bg-red-100 text-red-700" },
  PENDING_PAYMENT: { label: "Εκκρεμεί πληρωμή", color: "bg-orange-100 text-orange-700" },
  PAID:            { label: "Πληρώθηκε",         color: "bg-teal-100 text-teal-700" },
}

export default function ExpenseDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const roles = (session?.user?.role as string[]) || []
  const isHR = hasAnyRole(roles, "ADMIN", "HR", "MANAGER")
  const queryClient = useQueryClient()
  const router = useRouter()
  const [showAddLine, setShowAddLine] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [paymentData, setPaymentData] = useState({ method: "BANK_TRANSFER", date: new Date().toISOString().slice(0,10), ref: "" })

  const { data, isLoading } = useQuery({
    queryKey: ["expense", params.id],
    queryFn: () => fetch(`/api/expenses/${params.id}`).then(r => r.json()),
  })

  const { data: categoriesData } = useQuery({
    queryKey: ["expense-categories"],
    queryFn: () => fetch("/api/expenses/categories").then(r => r.json()),
  })

  const submitMutation = useMutation({
    mutationFn: () => fetch(`/api/expenses/${params.id}/submit`, { method: "POST" }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expense", params.id] }),
  })

  const approveMutation = useMutation({
    mutationFn: () => fetch(`/api/expenses/${params.id}/approve`, { method: "POST" }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expense", params.id] }),
  })

  const rejectMutation = useMutation({
    mutationFn: () => fetch(`/api/expenses/${params.id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReason }),
    }).then(r => r.json())); setShowRejectModal(false) },
  })

  const payMutation = useMutation({
    mutationFn: () => fetch(`/api/expenses/${params.id}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentMethod: paymentData.method, paymentDate: paymentData.date, referenceNumber: paymentData.ref }),
    }).then(r => r.json())); setShowPayModal(false) },
  })

  const report = data?.data
  const categories = categoriesData?.data || []

  if (isLoading) return <div className="p-6 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
  if (!report) return <div className="p-6 text-gray-500">Report δεν βρέθηκε</div>

  const status = STATUS_CONFIG[report.status]
  const canEdit = ["DRAFT", "REJECTED"].includes(report.status)
  const canSubmit = canEdit && (report.lines?.length || 0) > 0
  const canApprove = isHR && ["SUBMITTED", "UNDER_REVIEW"].includes(report.status)
  const canPay = isHR && report.status === "APPROVED"
  const total = report.lines?.reduce((s: number, l: any) => s + Number(l.amount), 0) || 0

  return (
    <div className="p-6 max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/expenses" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft size={20} className="text-gray-500" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{report.title}</h1>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status?.color}`}>
              {status?.label}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {report.reportNumber} · {report.employee?.user?.name} · €{total.toFixed(2)}
          </p>
        </div>
        {/* Actions */}
        <div className="flex gap-2">
          {canSubmit && (
            <button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}
              className="btn-primary flex items-center gap-2">
              <Send size={14} /> Υποβολή
            </button>
          )}
          {canApprove && (
            <>
              <button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                <CheckCircle size={14} /> Έγκριση
              </button>
              <button onClick={() => setShowRejectModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                <XCircle size={14} /> Απόρριψη
              </button>
            </>
          )}
          {canPay && (
            <button onClick={() => setShowPayModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700">
              <CreditCard size={14} /> Πληρωμή
            </button>
          )}
        </div>
      </div>

      {/* Payment Info */}
      {report.payment && (
        <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl p-4">
          <p className="text-sm font-semibold text-teal-700 dark:text-teal-400">✅ Πληρώθηκε</p>
          <p className="text-sm text-teal-600 dark:text-teal-500 mt-1">
            Μέσω: {report.payment.paymentMethod === "BANK_TRANSFER" ? "Τραπεζικό Έμβασμα" : report.payment.paymentMethod}
            {report.payment.referenceNumber && ` · Ref: ${report.payment.referenceNumber}`}
            {" · "}{formatDate(report.payment.paymentDate)}
          </p>
        </div>
      )}

      {/* Lines */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white">Γραμμές Εξόδων</h2>
          {canEdit && (
            <button onClick={() => setShowAddLine(!showAddLine)} className="btn-secondary flex items-center gap-2 text-sm">
              <Plus size={14} /> Προσθήκη
            </button>
          )}
        </div>

        {/* Add Line Form */}
        {showAddLine && canEdit && (
          <AddLineForm
            reportId={params.id}
            categories={categories}
            onSuccess={() => { setShowAddLine(false); queryClient.invalidateQueries({ queryKey: ["expense", params.id] }) }}
          />
        )}

        {/* Lines Table */}
        {report.lines?.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-sm">Δεν υπάρχουν γραμμές ακόμα</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900 text-xs font-semibold text-gray-500 uppercase">
                <th className="px-4 py-3 text-left">Ημερομηνία</th>
                <th className="px-4 py-3 text-left">Vendor</th>
                <th className="px-4 py-3 text-left">Κατηγορία</th>
                <th className="px-4 py-3 text-right">Ποσό</th>
                <th className="px-4 py-3 text-center">Απόδειξη</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {report.lines?.map((line: any) => (
                <tr key={line.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{formatDate(line.expenseDate)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{line.vendorName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{line.category?.name}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-right text-gray-900 dark:text-white">€{Number(line.amount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    {line.receiptUrl ? (
                      <a href={line.receiptUrl} target="_blank" className="text-primary hover:underline text-xs flex justify-center">
                        <Receipt size={14} />
                      </a>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900">
                <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 text-right">Σύνολο:</td>
                <td className="px-4 py-3 text-lg font-bold text-primary text-right">€{total.toFixed(2)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Note for physical receipts */}
      {["DRAFT","SUBMITTED"].includes(report.status) && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl text-sm text-yellow-700 dark:text-yellow-400">
          📎 Για φυσικές αποδείξεις χωρίς upload: ομαδοποιήστε τες και σημειώστε τον αριθμό <strong>{report.reportNumber}</strong>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Απόρριψη Report</h3>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              className="form-input" rows={3} placeholder="Αιτιολογία..." />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowRejectModal(false)} className="flex-1 btn-secondary">Ακύρωση</button>
              <button onClick={() => rejectMutation.mutate()} disabled={!rejectReason.trim() || rejectMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium">
                Απόρριψη
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Καταχώρηση Πληρωμής</h3>
            <div className="space-y-3">
              <div>
                <label className="form-label">Τρόπος Πληρωμής</label>
                <select value={paymentData.method} onChange={e => setPaymentData(p => ({...p, method: e.target.value}))} className="form-input">
                  <option value="BANK_TRANSFER">Τραπεζικό Έμβασμα</option>
                  <option value="CASH">Μετρητά</option>
                  <option value="PAYROLL">Μισθοδοσία</option>
                </select>
              </div>
              <div>
                <label className="form-label">Ημερομηνία</label>
                <input type="date" value={paymentData.date} onChange={e => setPaymentData(p => ({...p, date: e.target.value}))} className="form-input" />
              </div>
              <div>
                <label className="form-label">Reference (αν υπάρχει)</label>
                <input value={paymentData.ref} onChange={e => setPaymentData(p => ({...p, ref: e.target.value}))} className="form-input" placeholder="π.χ. αριθμός εντολής" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowPayModal(false)} className="flex-1 btn-secondary">Ακύρωση</button>
              <button onClick={() => payMutation.mutate()} disabled={payMutation.isPending}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium">
                Καταχώρηση
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AddLineForm({ reportId, categories, onSuccess }: { reportId: string; categories: any[]; onSuccess: () => void }) {
  const [data, setData] = useState({ expenseDate: new Date().toISOString().slice(0,10), vendorName: "", categoryId: "", amount: "", description: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/expenses/${reportId}/lines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, amount: parseFloat(data.amount) }),
      })
      const json = await res.json()
      if (!json.success) { setError(json.error?.message || "Σφάλμα"); return }
      onSuccess()
    } catch { setError("Σφάλμα") }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="px-6 py-4 bg-blue-50 dark:bg-blue-900/10 border-b border-blue-200 dark:border-blue-800 space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <input type="date" value={data.expenseDate} onChange={e => setData(d => ({...d, expenseDate: e.target.value}))} className="form-input text-sm" />
        <input placeholder="Vendor/Εταιρεία" value={data.vendorName} onChange={e => setData(d => ({...d, vendorName: e.target.value}))} className="form-input text-sm" required />
        <select value={data.categoryId} onChange={e => setData(d => ({...d, categoryId: e.target.value}))} className="form-input text-sm" required>
          <option value="">Κατηγορία</option>
          {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="number" step="0.01" placeholder="Ποσό €" value={data.amount} onChange={e => setData(d => ({...d, amount: e.target.value}))} className="form-input text-sm" required />
      </div>
      <input placeholder="Περιγραφή (προαιρετικό)" value={data.description} onChange={e => setData(d => ({...d, description: e.target.value}))} className="form-input text-sm w-full" />
      {error && <p className="error-text">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="btn-primary text-sm">
          {loading ? "Αποθήκευση..." : "Προσθήκη Γραμμής"}
        </button>
      </div>
    </form>
  )
}
