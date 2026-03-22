"use client"
import { Package } from "lucide-react"

export default function AssetsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Εξοπλισμός</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Διαχείριση εξοπλισμού εταιρείας</p>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 flex flex-col items-center justify-center text-center">
        <Package size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Σύντομα διαθέσιμο</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md">
          Η διαχείριση εξοπλισμού θα είναι διαθέσιμη σε επόμενη ενημέρωση.
          Θα μπορείτε να καταγράφετε και να παρακολουθείτε τον εξοπλισμό που έχει ανατεθεί σε κάθε εργαζόμενο.
        </p>
      </div>
    </div>
  )
}
