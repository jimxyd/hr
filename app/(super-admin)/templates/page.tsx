"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Mail, Save, Send } from "lucide-react"

export default function EmailTemplatesPage() {
  const [selected, setSelected] = useState<any>(null)
  const [testEmail, setTestEmail] = useState("")
  const [sending, setSending] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ["email-templates"],
    queryFn: () => fetch("/api/admin/email-templates").then(r => r.json()),
  })

  const saveMutation = useMutation({
    mutationFn: (template: any) =>
      fetch("/api/admin/email-templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
      }).then(r => r.json()))
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    },
  })

  const sendTest = async () => {
    if (!testEmail || !selected) return
    setSending(true)
    await fetch("/api/admin/email-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId: selected.id, testEmail }),
    })
    setSending(false)
  }

  const templates = data?.data || []

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Mail size={24} className="text-primary" /> Email Templates
        </h1>
      </div>

      <div className="grid grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Templates List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-y-auto">
          {templates.map((t: any) => (
            <button key={t.id} onClick={() => setSelected({ ...t })}
              className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${selected?.id === t.id ? "bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-primary" : ""}`}>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{t.triggerEvent}</p>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{t.subject}</p>
            </button>
          ))}
        </div>

        {/* Editor */}
        {selected ? (
          <div className="col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4 overflow-y-auto">
            <div>
              <label className="form-label">Subject</label>
              <input value={selected.subject} onChange={e => setSelected({ ...selected, subject: e.target.value })}
                className="form-input" />
            </div>
            <div className="flex-1">
              <label className="form-label">Body HTML</label>
              <textarea
                value={selected.bodyHtml}
                onChange={e => setSelected({ ...selected, bodyHtml: e.target.value })}
                className="form-input font-mono text-xs"
                rows={16}
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => saveMutation.mutate(selected)} className="btn-primary flex items-center gap-2">
                <Save size={16} /> {saveSuccess ? "Αποθηκεύτηκε ✓" : "Αποθήκευση"}
              </button>
              <div className="flex gap-2 flex-1">
                <input value={testEmail} onChange={e => setTestEmail(e.target.value)}
                  placeholder="test@email.com" className="form-input flex-1" />
                <button onClick={sendTest} disabled={sending} className="btn-secondary flex items-center gap-2 whitespace-nowrap">
                  <Send size={16} /> {sending ? "..." : "Test"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400">
            Επιλέξτε template
          </div>
        )}
      </div>
    </div>
  )
}
