"use client"
import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { Mail, Phone, MapPin, Calendar, Briefcase, Shield } from "lucide-react"
import { formatDate } from "@/lib/utils/dates"

export default function ProfilePage() {
  const { data: session } = useSession()

  const { data, isLoading } = useQuery({
    queryKey: ["profile", session?.user?.id],
    queryFn: () => fetch(`/api/employees/${session?.user?.id}`).then(r => r.json()),
    enabled: !!session?.user?.id,
  })

  const user = data?.data
  const emp = user?.employee
  const personal = emp?.personalInfo

  if (isLoading) {
    return (
      <div className="p-6 animate-pulse space-y-6">
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-5">
          {personal?.photoUrl ? (
            <img src={personal.photoUrl} alt={user?.name} className="w-20 h-20 rounded-full object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user?.name}</h1>
            <p className="text-gray-500 dark:text-gray-400">{emp?.title || "—"}</p>
            <div className="flex items-center gap-2 mt-2">
              {(user?.role as string[])?.map((r: string) => (
                <span key={r} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">{r}</span>
              ))}
              {user?.department && (
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                  {user.department.name}
                </span>
              )}
            </div>
          </div>
          <div className="ml-auto">
            <a href="/profile/settings" className="btn-secondary text-sm">Επεξεργασία</a>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Επικοινωνία</h2>
          <div className="space-y-3">
            <InfoRow icon={<Mail size={16} />} label="Email" value={user?.email} />
            {personal?.address && <InfoRow icon={<MapPin size={16} />} label="Διεύθυνση" value={personal.address} />}
            {personal?.emergencyName && (
              <InfoRow icon={<Phone size={16} />} label="Επαφή Ανάγκης"
                value={`${personal.emergencyName} ${personal.emergencyPhone ? `(${personal.emergencyPhone})` : ""}`} />
            )}
          </div>
        </div>

        {/* Employment */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Εργασιακά</h2>
          <div className="space-y-3">
            {emp?.contractStart && <InfoRow icon={<Calendar size={16} />} label="Έναρξη" value={formatDate(emp.contractStart)} />}
            <InfoRow icon={<Briefcase size={16} />} label="Σύμβαση"
              value={emp?.contractType === "INDEFINITE" ? "Αορίστου" : emp?.contractType === "FIXED_TERM" ? "Ορισμένου" : "Project"} />
            <InfoRow icon={<Shield size={16} />} label="Ωράριο" value={`${emp?.hoursPerWeek}ω/${emp?.daysPerWeek}ημ. εβδ.`} />
          </div>
        </div>
      </div>

      {/* Leave Allocations */}
      {emp?.leaveAllocations?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Υπόλοιπα Αδειών {new Date().getFullYear()}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {emp.leaveAllocations.map((a: any) => {
              const available = a.entitledDays + a.carriedOver - a.usedDays
              return (
                <div key={a.id} className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="text-2xl font-bold" style={{ color: a.leaveType?.color }}>{available}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{a.leaveType?.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">από {a.entitledDays}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      <span className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  )
}
