"use client"
import { useQuery } from "@tanstack/react-query"
import { CreditCard, TrendingUp, DollarSign } from "lucide-react"
import { HelpBox } from "@/components/common/help-box"

export default function BillingPage() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => fetch("/api/admin/stats").then(r => r.json()),
  })

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CreditCard size={24} className="text-primary" /> Billing Overview
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Επισκόπηση πληρωμών και συνδρομών</p>
        </div>
        <HelpBox
          storageKey="admin-billing"
          title="Οδηγός Billing"
          items={[
            "Βλέπετε συνολικά έσοδα, πληρωτέους και ενεργούς tenants.",
            "Η αναλυτική τιμολόγηση ανά tenant διαχειρίζεται μέσω της σελίδας κάθε tenant.",
          ]}
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <DollarSign size={20} className="text-green-600 mb-3" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            €{data?.data?.revenue?.total?.toFixed(2) || "0.00"}
          </p>
          <p className="text-sm text-gray-500">Σύνολο Εσόδων</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <TrendingUp size={20} className="text-blue-600 mb-3" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{data?.data?.tenants?.active || 0}</p>
          <p className="text-sm text-gray-500">Ενεργές Συνδρομές</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <CreditCard size={20} className="text-purple-600 mb-3" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{data?.data?.tenants?.trial || 0}</p>
          <p className="text-sm text-gray-500">Trial Λογαριασμοί</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
          💡 Viva Wallet & PayPal integration — Phase 11
        </p>
      </div>
    </div>
  )
}
