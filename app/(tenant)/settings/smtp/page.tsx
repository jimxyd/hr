"use client"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { Mail, TestTube, CheckCircle, XCircle } from "lucide-react"

export default function SmtpSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testEmail, setTestEmail] = useState("")
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null)
  const [success, setSuccess] = useState(false)

  const { data, refetch } = useQuery({
    queryKey: ["smtp-settings"],
    queryFn: () => fetch("/api/settings/smtp").then(r => r.json()),
  })

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: data?.data || {}
  })

  const onSubmit = async (formData: any) => {
    setLoading(true)
    try {
      const res = await fetch("/api/settings/smtp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const json = await res.json()
      if (json.success) { setSuccess(true); setTimeout(() => setSuccess(false), 3000) }
    } finally { setLoading(false) }
  }

  const handleTest = async () => {
    if (!testEmail) return
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch("/api/settings/smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testEmail }),
      })
      const json = await res.json()
      setTestResult(json.success ? "success" : "error")
    } finally { setTesting(false) }
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Mail size={24} className="text-primary" /> Ρυθμίσεις SMTP
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Προαιρετικά: ορίστε custom SMTP για αποστολή emails από το δικό σας domain
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
        <p className="text-sm text-blue-700 dark:text-blue-400">
          💡 Αν δεν ορίσετε custom SMTP, τα emails θα αποστέλλονται από <strong>noreply@ergohub.gr</strong>.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">SMTP Host</label>
              <input {...register("host")} className="form-input" placeholder="smtp.gmail.com" />
            </div>
            <div>
              <label className="form-label">Port</label>
              <input {...register("port", { valueAsNumber: true })} type="number" className="form-input" placeholder="587" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Username</label>
              <input {...register("username")} className="form-input" placeholder="user@company.gr" />
            </div>
            <div>
              <label className="form-label">Password</label>
              <input {...register("password")} type="password" className="form-input" placeholder={data?.data?.hasPassword ? "••••••• (αποθηκευμένο)" : "Κωδικός SMTP"} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">From Email</label>
              <input {...register("fromEmail")} type="email" className="form-input" placeholder="hr@company.gr" />
            </div>
            <div>
              <label className="form-label">From Name</label>
              <input {...register("fromName")} className="form-input" placeholder="HR Εταιρεία" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input {...register("useTls")} type="checkbox" id="useTls" defaultChecked />
            <label htmlFor="useTls" className="text-sm text-gray-700 dark:text-gray-300">Χρήση TLS</label>
          </div>
        </div>

        {/* Test SMTP */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TestTube size={18} /> Δοκιμή SMTP
          </h3>
          <div className="flex gap-3">
            <input
              value={testEmail}
              onChange={e => setTestEmail(e.target.value)}
              type="email"
              placeholder="Αποστολή δοκιμαστικού email σε..."
              className="form-input flex-1"
            />
            <button type="button" onClick={handleTest} disabled={testing || !testEmail}
              className="btn-secondary flex items-center gap-2 whitespace-nowrap">
              {testing ? "Αποστολή..." : "Αποστολή Test"}
            </button>
          </div>
          {testResult === "success" && (
            <p className="mt-2 text-sm text-green-600 flex items-center gap-2">
              <CheckCircle size={14} /> Email στάλθηκε επιτυχώς!
            </p>
          )}
          {testResult === "error" && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
              <XCircle size={14} /> Σφάλμα — ελέγξτε τα credentials
            </p>
          )}
        </div>

        {success && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
            ✅ SMTP ρυθμίσεις αποθηκεύτηκαν!
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Αποθήκευση..." : "Αποθήκευση SMTP"}
        </button>
      </form>
    </div>
  )
}
