"use client"
import { BarChart2 } from "lucide-react"

export default function PerformancePage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Αξιολογήσεις</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Αξιολογήσεις απόδοσης εργαζομένων</p>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 flex flex-col items-center justify-center text-center">
        <BarChart2 size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Σύντομα διαθέσιμο</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md">
          Οι αξιολογήσεις απόδοσης θα είναι διαθέσιμες σε επόμενη ενημέρωση.
          Θα μπορείτε να δημιουργείτε κύκλους αξιολόγησης και να παρακολουθείτε την πρόοδο.
        </p>
      </div>
    </div>
  )
}
