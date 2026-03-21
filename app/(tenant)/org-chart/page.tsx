"use client"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Building2, Users } from "lucide-react"
import { useQuery as useDeptsQuery } from "@tanstack/react-query"

function OrgNode({ node, depth = 0 }: { node: any; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2)
  const hasChildren = node.children?.length > 0

  return (
    <div className="flex flex-col items-center">
      {/* Node card */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 min-w-[180px] text-center shadow-sm hover:shadow-md hover:border-primary transition-all cursor-pointer"
        onClick={() => hasChildren && setExpanded(e => !e)}>
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold text-lg flex items-center justify-center mx-auto mb-2">
          {node.name?.charAt(0).toUpperCase()}
        </div>
        <p className="font-medium text-gray-900 dark:text-white text-sm">{node.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{node.title || node.positionLevel}</p>
        {node.department && (
          <span className="mt-1 inline-block px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs rounded-full">
            {node.department}
          </span>
        )}
        {hasChildren && (
          <p className="text-xs text-gray-400 mt-1">{expanded ? "▲" : "▼"} {node.children.length}</p>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="mt-4 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-4 bg-gray-300 dark:bg-gray-600" />
          <div className="flex gap-6 mt-4">
            {node.children.map((child: any) => (
              <div key={child.id} className="relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-px h-4 bg-gray-300 dark:bg-gray-600" />
                <OrgNode node={child} depth={depth + 1} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function OrgChartPage() {
  const [view, setView] = useState<"company" | "department">("company")
  const [selectedDept, setSelectedDept] = useState("")

  const { data: orgData, isLoading } = useQuery({
    queryKey: ["org-chart", selectedDept],
    queryFn: () => fetch(`/api/org-chart${selectedDept ? `?departmentId=${selectedDept}` : ""}`).then(r => r.json()),
  })

  const { data: depts } = useQuery({
    queryKey: ["departments"],
    queryFn: () => fetch("/api/departments").then(r => r.json()),
  })

  const tree = orgData?.data?.tree || []

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Οργανόγραμμα</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ιεραρχία εταιρείας</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button onClick={() => { setView("company"); setSelectedDept("") }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${view === "company" ? "bg-white dark:bg-gray-700 shadow text-primary" : "text-gray-500"}`}>
              <Building2 size={14} /> Εταιρεία
            </button>
            <button onClick={() => setView("department")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${view === "department" ? "bg-white dark:bg-gray-700 shadow text-primary" : "text-gray-500"}`}>
              <Users size={14} /> Τμήμα
            </button>
          </div>
          {view === "department" && (
            <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Επιλογή τμήματος</option>
              {depts?.data?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8 overflow-auto min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : tree.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Building2 size={48} className="mb-4" />
            <p>Δεν υπάρχουν δεδομένα για το οργανόγραμμα</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {tree.map((node: any) => <OrgNode key={node.id} node={node} />)}
          </div>
        )}
      </div>
    </div>
  )
}
