"use client"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Calendar, Clock, CheckCircle, Package, Bell, ChevronRight, TrendingUp } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { formatDate } from "@/lib/utils/dates"
import { HelpBox } from "@/components/common/help-box"

export default function DashboardPage() {
  const { data: session } = useSession()
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fetch("/api/dashboard").then(r => r.json()),
    staleTime: 30000,
  })

  const d = data?.data
  const emp = d?.employeeData
  const mgr = d?.managerData
  const hr = d?.hrData
  const roles = (session?.user?.role as string[]) || []
  const isHR = roles.some(r => ["ADMIN", "HR"].includes(r))
  const isManager = roles.some(r => ["MANAGER"].includes(r))
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Καλημέρα" : hour < 18 ? "Καλησπέρα" : "Καλησπέρα"

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {greeting}, {session?.user?.name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {new Date().toLocaleDateString("el-GR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <HelpBox
          storageKey="dashboard"
          title={isHR ? "Οδηγός Dashboard — Admin/HR" : isManager ? "Οδηγός Dashboard — Manager" : "Οδηγός Dashboard"}
          items={isHR ? [
            "Βλέπετε συνολική εικόνα εργαζομένων, εκκρεμών εγκρίσεων και συμβάσεων που λήγουν.",
            "Κάντε κλικ στις κάρτες KPI για γρήγορη πρόσβαση (π.χ. Εκκρεμείς Εγκρίσεις → Άδειες).",
            "Από τις Γρήγορες Ενέργειες μπορείτε να δημιουργήσετε νέο εργαζόμενο ή να εγκρίνετε άδειες.",
            "Τα γραφήματα δείχνουν τάσεις αδειών ανά μήνα και τύπο για τρέχον έτος.",
          ] : isManager ? [
            "Βλέπετε τους απόντες της ομάδας σας σήμερα και τις εκκρεμείς εγκρίσεις.",
            "Κάντε κλικ στις κάρτες KPI για να μεταβείτε κατευθείαν στις εγκρίσεις.",
            "Από τις Γρήγορες Ενέργειες μπορείτε να κάνετε αίτημα άδειας ή να εγκρίνετε αιτήματα.",
          ] : [
            "Εδώ βλέπετε τα υπόλοιπα αδειών σας και τις επερχόμενες άδειες.",
            "Κάντε κλικ στο «Νέο αίτημα άδειας» ή «Νέο expense report» για γρήγορη καταχώρηση.",
            "Οι ανακοινώσεις εμφανίζονται στο κάτω μέρος — κάντε κλικ για να τις διαβάσετε.",
          ]}
        />
      </div>

      {/* ── HR/Admin KPIs ── */}
      {isHR && hr && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard title="Εργαζόμενοι" value={hr.totalEmployees} icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} color="blue" sub={`+${hr.newEmployees} αυτό το μήνα`} />
          <KpiCard title="Εκκρεμείς Εγκρίσεις" value={mgr?.pendingApprovals || 0} icon={<Clock className="w-5 h-5" />} color="yellow" sub="Άδειες" href="/leaves/approvals" />
          <KpiCard title="Λήξη Συμβάσεων" value={hr.expiringContracts} icon={<Calendar className="w-5 h-5" />} color="red" sub="Επόμενες 30 ημέρες" />
          <KpiCard title="Αλλαγές Στοιχείων" value={hr.pendingChangeRequests} icon={<Bell className="w-5 h-5" />} color="purple" sub="Εκκρεμείς" />
        </div>
      )}

      {/* ── Manager KPIs (non-HR) ── */}
      {isManager && !isHR && mgr && (
        <div className="grid grid-cols-3 gap-4">
          <KpiCard title="Απόντες Σήμερα" value={mgr.teamAbsentToday} icon={<Calendar className="w-5 h-5" />} color="yellow" />
          <KpiCard title="Εκκρεμείς Άδειες" value={mgr.pendingApprovals} icon={<Clock className="w-5 h-5" />} color="blue" href="/leaves/approvals" />
          <KpiCard title="Εκκρεμή Έξοδα" value={mgr.pendingExpenses} icon={<TrendingUp className="w-5 h-5" />} color="green" href="/expenses/approvals" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leave Balances */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Υπόλοιπα Αδειών {new Date().getFullYear()}</h2>
            <Link href="/leaves" className="text-sm text-primary hover:underline flex items-center gap-1">
              Περισσότερα <ChevronRight size={14} />
            </Link>
          </div>
          {emp?.leaveBalances?.length === 0 ? (
            <p className="text-gray-400 text-sm">Δεν υπάρχουν κατανομές αδειών</p>
          ) : (
            <div className="space-y-3">
              {emp?.leaveBalances?.map((b: any) => (
                <div key={b.code}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: b.color }} />
                      {b.leaveType}
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {b.available} / {b.entitled} ημέρες
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(0, Math.min(100, (b.available / Math.max(b.entitled, 1)) * 100))}%`,
                        backgroundColor: b.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {(emp?.pendingLeaves || 0) > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center gap-3">
              <Clock size={16} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                {emp.pendingLeaves} εκκρεμή αίτημα/α αδείας
              </p>
              <Link href="/leaves" className="ml-auto text-xs text-yellow-700 dark:text-yellow-400 font-medium hover:underline">
                Προβολή
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Γρήγορες Ενέργειες</h2>
          <div className="space-y-2">
            <QuickAction href="/leaves/new" icon="🏖️" label="Νέο αίτημα άδειας" />
            <QuickAction href="/expenses/new" icon="💰" label="Νέο expense report" />
            <QuickAction href="/profile" icon="👤" label="Προφίλ μου" />
            {(isManager || isHR) && <QuickAction href="/leaves/approvals" icon="✅" label="Εκκρεμείς εγκρίσεις" badge={mgr?.pendingApprovals} />}
            {isHR && <QuickAction href="/employees/new" icon="➕" label="Νέος εργαζόμενος" />}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Leaves */}
        {(emp?.upcomingLeaves?.length || 0) > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-primary" /> Επερχόμενες Άδειες
            </h2>
            <div className="space-y-3">
              {emp.upcomingLeaves.map((l: any) => (
                <div key={l.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: l.leaveType?.color }} />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{l.leaveType?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(l.startDate)} — {formatDate(l.endDate)} · {l.workingDaysCount} ημέρες
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Announcements */}
        {(emp?.recentAnnouncements?.length || 0) > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Bell size={18} className="text-primary" /> Ανακοινώσεις
              </h2>
              <Link href="/announcements" className="text-sm text-primary hover:underline">Όλες</Link>
            </div>
            <div className="space-y-3">
              {emp.recentAnnouncements.map((a: any) => (
                <Link key={a.id} href={`/announcements`}
                  className="block p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-start gap-2">
                    {a.isPinned && <span className="text-xs">📌</span>}
                    <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">{a.title}</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {a.creator?.name} · {formatDate(a.publishedAt)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── HR Charts ── */}
      {isHR && hr && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leaves by Month */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-6">Άδειες ανά Μήνα (6μηνο)</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hr.leavesByMonth} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                  formatter={(v: any) => [`${v} αιτήματα`, "Άδειες"]}
                />
                <Bar dataKey="count" fill="#2E5FA3" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Leaves by Type */}
          {hr.leavesByType.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-6">Άδειες ανά Τύπο (φέτος)</h2>
              <div className="flex gap-6">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie
                      data={hr.leavesByType}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={80}
                      dataKey="days"
                      nameKey="name"
                    >
                      {hr.leavesByType.map((entry: any, index: number) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => [`${v} ημέρες`]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {hr.leavesByType.map((t: any) => (
                    <div key={t.name} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                      <span className="text-xs text-gray-600 dark:text-gray-400 flex-1 truncate">{t.name}</span>
                      <span className="text-xs font-semibold text-gray-900 dark:text-white">{t.days}ημ.</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function KpiCard({ title, value, icon, color, sub, href }: {
  title: string; value: number; icon: React.ReactNode
  color: "blue" | "green" | "yellow" | "red" | "purple"
  sub?: string; href?: string
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    green: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    yellow: "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400",
    red: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  }
  const card = (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 ${href ? "hover:border-primary hover:shadow-md transition-all cursor-pointer" : ""}`}>
      <div className={`inline-flex p-2.5 rounded-lg ${colors[color]} mb-3`}>{icon}</div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">{title}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
  return href ? <Link href={href}>{card}</Link> : card
}

function QuickAction({ href, icon, label, badge }: {
  href: string; icon: string; label: string; badge?: number
}) {
  return (
    <Link href={href}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
      <span className="text-lg w-8 text-center">{icon}</span>
      <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors flex-1">{label}</span>
      {badge ? (
        <span className="px-2 py-0.5 bg-primary text-white text-xs rounded-full">{badge}</span>
      ) : (
        <ChevronRight size={14} className="text-gray-400 group-hover:text-primary transition-colors" />
      )}
    </Link>
  )
}
