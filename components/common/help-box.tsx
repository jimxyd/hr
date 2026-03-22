"use client"
import { useState, useEffect } from "react"
import { HelpCircle, X } from "lucide-react"

interface HelpBoxProps {
  title: string
  items: string[]
  storageKey: string
}

export function HelpBox({ title, items, storageKey }: HelpBoxProps) {
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    setDismissed(localStorage.getItem(`help_${storageKey}`) === "1")
  }, [storageKey])

  const dismiss = () => {
    setDismissed(true)
    localStorage.setItem(`help_${storageKey}`, "1")
  }

  if (dismissed) {
    return (
      <button
        onClick={() => { setDismissed(false); localStorage.removeItem(`help_${storageKey}`) }}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary transition-colors"
        title="Εμφάνιση βοήθειας"
      >
        <HelpCircle size={14} />
        <span>Βοήθεια</span>
      </button>
    )
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/15 border border-blue-200 dark:border-blue-800/40 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <HelpCircle size={16} className="text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">{title}</p>
            <ul className="mt-2 space-y-1">
              {items.map((item, i) => (
                <li key={i} className="text-xs text-blue-700 dark:text-blue-400/80 flex items-start gap-1.5">
                  <span className="mt-1 flex-shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <button onClick={dismiss} className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 flex-shrink-0" title="Κλείσιμο">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
