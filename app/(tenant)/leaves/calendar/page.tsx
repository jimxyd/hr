"use client"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { HelpBox } from "@/components/common/help-box"

export default function LeaveCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`

  const { data } = useQuery({
    queryKey: ["leave-calendar", month],
    queryFn: () => fetch(`/api/leaves/calendar?month=${month}`).then(r => r.json()),
  })

  const events = data?.data || []
  const prevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))

  const monthName = currentDate.toLocaleDateString("el-GR", { month: "long", year: "numeric" })

  // Build calendar grid
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  const startDow = (firstDay.getDay() + 6) % 7 // Mon=0
  const days: (Date | null)[] = Array(startDow).fill(null)
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), d))
  }

  const getEventsForDay = (date: Date) => {
    return events.filter((e: any) => {
      const start = new Date(e.start)
      const end = new Date(e.end)
      return date >= start && date < end
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ημερολόγιο Ομάδας</h1>
          <HelpBox
            storageKey="leaves-calendar"
            title="Οδηγός Ημερολογίου"
            items={[
              "Κάθε χρωματιστή μπάρα αντιστοιχεί σε εγκεκριμένη άδεια ενός μέλους της ομάδας.",
              "Χρησιμοποιήστε τα βέλη για πλοήγηση ανά μήνα.",
              "Τα Σαββατοκύριακα εμφανίζονται με γκρι φόντο.",
              "Αν ένα κελί δείχνει «+Ν ακόμα», υπάρχουν περισσότερες άδειες εκείνη την ημέρα.",
            ]}
          />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ChevronLeft size={20} className="text-gray-500" />
          </button>
          <span className="text-lg font-semibold text-gray-900 dark:text-white capitalize min-w-[200px] text-center">{monthName}</span>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ChevronRight size={20} className="text-gray-500" />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {["Δευ", "Τρι", "Τετ", "Πεμ", "Παρ", "Σαβ", "Κυρ"].map(d => (
            <div key={d} className="py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="h-24 border-b border-r border-gray-100 dark:border-gray-700" />
            const dayEvents = getEventsForDay(day)
            const isToday = day.toDateString() === new Date().toDateString()
            const isWeekend = day.getDay() === 0 || day.getDay() === 6
            return (
              <div key={day.toISOString()} className={`h-24 border-b border-r border-gray-100 dark:border-gray-700 p-1 ${isWeekend ? "bg-gray-50 dark:bg-gray-900/50" : ""}`}>
                <span className={`inline-flex w-6 h-6 items-center justify-center text-xs font-medium rounded-full mb-1 ${isToday ? "bg-primary text-white" : "text-gray-700 dark:text-gray-300"}`}>
                  {day.getDate()}
                </span>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 2).map((e: any) => (
                    <div key={e.id} className="text-xs px-1 py-0.5 rounded truncate text-white"
                      style={{ backgroundColor: e.backgroundColor || "#2E5FA3" }}>
                      {e.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <p className="text-xs text-gray-400">+{dayEvents.length - 2} ακόμα</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
