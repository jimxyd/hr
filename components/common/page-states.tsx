"use client"

export function PageLoading() {
  return (
    <div className="p-6 flex items-center justify-center min-h-[200px]">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Φόρτωση...</p>
      </div>
    </div>
  )
}

export function PageError({ message = "Σφάλμα φόρτωσης. Δοκιμάστε ξανά." }: { message?: string }) {
  return (
    <div className="p-6 flex items-center justify-center min-h-[200px]">
      <div className="text-center">
        <p className="text-2xl mb-2">⚠️</p>
        <p className="text-sm text-red-500 dark:text-red-400">{message}</p>
        <button onClick={() => window.location.reload()}
          className="mt-3 text-sm text-primary hover:underline">
          Ανανέωση σελίδας
        </button>
      </div>
    </div>
  )
}

export function EmptyState({ icon = "📭", title, subtitle, action }: {
  icon?: string; title: string; subtitle?: string
  action?: { label: string; href: string }
}) {
  return (
    <div className="py-16 text-center">
      <p className="text-4xl mb-4">{icon}</p>
      <p className="text-gray-700 dark:text-gray-300 font-medium">{title}</p>
      {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
      {action && (
        <a href={action.href}
          className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline">
          + {action.label}
        </a>
      )}
    </div>
  )
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2" style={{ width: `${70 + i * 10}%` }} />
      ))}
    </div>
  )
}
