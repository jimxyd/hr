"use client"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Settings, Mail, Key } from "lucide-react"
import { HelpBox } from "@/components/common/help-box"

export default function SuperAdminSettingsPage() {
  const [success, setSuccess] = useState("")

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Settings size={24} className="text-primary" /> Platform Ρυθμίσεις
        </h1>
        <HelpBox
          storageKey="admin-settings"
          title="Οδηγός Platform Ρυθμίσεων"
          items={[
            "Οι ρυθμίσεις SMTP διαχειρίζονται μέσω .env αρχείου στον server.",
            "Η αλλαγή SMTP επηρεάζει τα platform emails (trial, onboarding, κ.λπ.).",
            "Για SMTP ρυθμίσεις ανά tenant, χρησιμοποιήστε τις ρυθμίσεις μέσα στον κάθε tenant.",
          ]}
        />
      </div>

      {/* Platform SMTP */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Mail size={18} /> Platform SMTP
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Ρυθμίσεις SMTP για platform emails (trial, onboarding). Διαχειρίζονται μέσω .env αρχείου.
        </p>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Host</span>
            <span className="font-mono">{process.env.NEXT_PUBLIC_APP_NAME ? "Configured via .env" : "—"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">From</span>
            <span className="font-mono">noreply@ergohub.gr</span>
          </div>
        </div>
      </div>

      {/* Trial Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Key size={18} /> Trial Ρυθμίσεις
        </h2>
        <div>
          <label className="form-label">Default Trial Διάρκεια (ημέρες)</label>
          <input type="number" defaultValue={30} className="form-input w-32" />
        </div>
        <button className="btn-primary">Αποθήκευση</button>
      </div>
    </div>
  )
}
