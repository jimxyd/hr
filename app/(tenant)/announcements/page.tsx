"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { Plus, Pin } from "lucide-react"
import { useSession } from "next-auth/react"
import { PageLoading, PageError, EmptyState, SkeletonCard } from "@/components/common/page-states"
import { useToast } from "@/components/common/toast"
import { hasAnyRole } from "@/lib/utils/roles"
import { formatDateTime } from "@/lib/utils/dates"

export default function AnnouncementsPage() {
  const { data: session } = useSession()
  const roles = (session?.user?.role as string[]) || []
  const isHR = hasAnyRole(roles, "ADMIN", "HR")
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data, isLoading, isError } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => fetch("/api/announcements?limit=20").then(r => {
      if (!r.ok) throw new Error("Σφάλμα φόρτωσης")
      return r.json()
    }),
  })

  const markRead = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/announcements/${id}/read`, { method: "POST" }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["announcements"] }),
    onError: () => toast("error", "Σφάλμα ενημέρωσης"),
  })

  if (isLoading) return <PageLoading />
  if (isError) return <PageError />

  const announcements = data?.data || []

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ανακοινώσεις</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{data?.meta?.total || 0} ανακοινώσεις</p>
        </div>
        {isHR && (
          <Link href="/announcements/new" className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} aria-hidden="true" /> Νέα Ανακοίνωση
          </Link>
        )}
      </div>

      {announcements.length === 0 ? (
        <EmptyState icon="📢" title="Δεν υπάρχουν ανακοινώσεις"
          action={isHR ? { label: "Νέα ανακοίνωση", href: "/announcements/new" } : undefined} />
      ) : (
        <ul role="list" className="space-y-4">
          {announcements.map((a: any) => {
            const isRead = a.reads?.length > 0
            return (
              <li key={a.id}>
                <article
                  onClick={() => !isRead && markRead.mutate(a.id)}
                  className={`bg-white dark:bg-gray-800 rounded-xl p-6 border transition-all cursor-pointer hover:shadow-md ${
                    !isRead ? "border-l-4 border-l-primary border-gray-200 dark:border-gray-700 shadow-sm" : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    {a.isPinned && <Pin size={14} className="text-primary flex-shrink-0 mt-0.5" aria-label="Καρφιτσωμένο" />}
                    <h2 className="font-semibold text-gray-900 dark:text-white text-sm">{a.title}</h2>
                    {!isRead && (
                      <span className="ml-auto px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium flex-shrink-0">Νέο</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3"
                    dangerouslySetInnerHTML={{ __html: a.bodyHtml }} />
                  <footer className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                    <span>{a.creator?.name}</span>
                    <span>·</span>
                    <span>{formatDateTime(a.publishedAt)}</span>
                    {isHR && <span className="ml-auto">{a._count?.reads || 0} αναγνώσεις</span>}
                  </footer>
                </article>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
