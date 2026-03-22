"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { Bell, Shield, User } from "lucide-react"
import { HelpBox } from "@/components/common/help-box"

const notificationTypes = [
  { key: "LEAVE_REQUEST", label: "Αίτημα άδειας (για εγκριτές)" },
  { key: "LEAVE_APPROVED", label: "Έγκριση άδειας" },
  { key: "LEAVE_REJECTED", label: "Απόρριψη άδειας" },
  { key: "EXPENSE_SUBMITTED", label: "Νέο expense report (για εγκριτές)" },
  { key: "EXPENSE_APPROVED", label: "Έγκριση expense" },
  { key: "ANNOUNCEMENT", label: "Νέα ανακοίνωση" },
  { key: "CHANGE_REQUEST", label: "Αίτημα αλλαγής στοιχείων" },
]

export default function ProfileSettingsPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "security">("notifications")

  const { data: prefsData } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () => fetch("/api/notifications/preferences").then(r => r.json()),
  })

  const updatePref = useMutation({
    mutationFn: (pref: { notificationType: string; inApp: boolean; email: boolean }) =>
      fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pref),
      }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notification-preferences"] }),
  })

  const prefs = prefsData?.data || []
  const getPref = (type: string) => prefs.find((p: any) => p.notificationType === type)

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-start justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ρυθμίσεις Προφίλ</h1>
        <HelpBox
          storageKey="profile-settings"
          title="Οδηγός Ρυθμίσεων"
          items={[
            "Στις Ειδοποιήσεις επιλέγετε ποιες ειδοποιήσεις θέλετε In-App ή μέσω Email.",
            "In-App ειδοποιήσεις εμφανίζονται στο καμπανάκι πάνω δεξιά.",
            "Η Ασφάλεια περιλαμβάνει αλλαγή κωδικού (σύντομα διαθέσιμο).",
          ]}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mb-6 w-fit">
        {[
          { key: "notifications", label: "Ειδοποιήσεις", icon: Bell },
          { key: "security", label: "Ασφάλεια", icon: Shield },
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-white dark:bg-gray-700 text-primary shadow"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              <Icon size={14} /> {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === "notifications" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span>Τύπος</span>
              <span className="text-center">In-App</span>
              <span className="text-center">Email</span>
            </div>
          </div>
          {notificationTypes.map(nt => {
            const pref = getPref(nt.key)
            return (
              <div key={nt.key} className="px-6 py-4 grid grid-cols-3 items-center border-b border-gray-100 dark:border-gray-700 last:border-0">
                <span className="text-sm text-gray-700 dark:text-gray-300">{nt.label}</span>
                <div className="flex justify-center">
                  <input
                    type="checkbox"
                    checked={pref?.inApp ?? true}
                    onChange={e => updatePref.mutate({ notificationType: nt.key, inApp: e.target.checked, email: pref?.email ?? false })}
                    className="w-4 h-4 text-primary rounded cursor-pointer"
                  />
                </div>
                <div className="flex justify-center">
                  <input
                    type="checkbox"
                    checked={pref?.email ?? false}
                    onChange={e => updatePref.mutate({ notificationType: nt.key, inApp: pref?.inApp ?? true, email: e.target.checked })}
                    className="w-4 h-4 text-primary rounded cursor-pointer"
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {activeTab === "security" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Ασφάλεια Λογαριασμού</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Αλλαγή κωδικού και ρυθμίσεις 2FA σύντομα διαθέσιμα.</p>
        </div>
      )}
    </div>
  )
}
