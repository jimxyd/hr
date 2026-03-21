"use client"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Plus, Search } from "lucide-react"
import { PageLoading, PageError, EmptyState, SkeletonCard } from "@/components/common/page-states"

export default function EmployeesPage() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["employees", search, page],
    queryFn: () => fetch(`/api/employees?search=${encodeURIComponent(search)}&page=${page}`).then(r => {
      if (!r.ok) throw new Error("Σφάλμα φόρτωσης")
      return r.json()
    }),
    staleTime: 30000,
  })

  if (isError) return <PageError message={(error as Error)?.message} />

  const employees = data?.data || []
  const total = data?.meta?.total || 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Εργαζόμενοι</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{total} εργαζόμενοι</p>
        </div>
        <Link href="/employees/new" className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} aria-hidden="true" /> Νέος Εργαζόμενος
        </Link>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Αναζήτηση εργαζομένου..."
          aria-label="Αναζήτηση εργαζομένου"
          className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} lines={2} />)}
        </div>
      ) : employees.length === 0 ? (
        <EmptyState icon="👤" title="Δεν βρέθηκαν εργαζόμενοι"
          action={{ label: "Προσθήκη πρώτου εργαζομένου", href: "/employees/new" }} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {employees.map((emp: any) => (
            <Link key={emp.id} href={`/employees/${emp.id}`}
              className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:border-primary hover:shadow-md transition-all group">
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg mb-3 group-hover:bg-primary group-hover:text-white transition-colors">
                {emp.name.charAt(0).toUpperCase()}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">{emp.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">{emp.employee?.title || "—"}</p>
              {emp.department && (
                <span className="mt-2 inline-block px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                  {emp.department.name}
                </span>
              )}
              <div className="mt-3 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${emp.isActive ? "bg-green-500" : "bg-gray-400"}`} />
                <span className="text-xs text-gray-500 dark:text-gray-400">{emp.isActive ? "Ενεργός" : "Ανενεργός"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {total > 20 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="btn-secondary text-sm disabled:opacity-50" aria-label="Προηγούμενη σελίδα">
            ← Προηγ.
          </button>
          <span className="text-sm text-gray-500">Σελίδα {page} από {Math.ceil(total / 20)}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)}
            className="btn-secondary text-sm disabled:opacity-50" aria-label="Επόμενη σελίδα">
            Επόμ. →
          </button>
        </div>
      )}
    </div>
  )
}
