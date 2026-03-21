import { NextRequest, NextResponse } from "next/server"
import { withTenantAuth } from "@/lib/utils/api-helpers"
import { successResponse } from "@/types/api"
import { hasAnyRole } from "@/lib/utils/roles"

export const GET = withTenantAuth(async (req, { session, db }) => {
  const roles = session.user.role as string[]
  const isHR = hasAnyRole(roles, "ADMIN", "HR")
  const isManager = hasAnyRole(roles, "MANAGER")
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()

  // ── Employee dashboard data ──────────────────────────
  const emp = await db.employee.findUnique({ where: { userId: session.user.id } })

  // Leave balances
  const leaveAllocations = emp ? await db.leaveAllocation.findMany({
    where: { employeeId: emp.id, year },
    include: { leaveType: { select: { name: true, color: true, code: true } } },
  }) : []

  // Pending leave requests
  const pendingLeaves = emp ? await db.leaveRequest.count({
    where: { employeeId: emp.id, status: { in: ["PENDING", "PENDING_L2"] } }
  }) : 0

  // Upcoming approved leaves
  const upcomingLeaves = emp ? await db.leaveRequest.findMany({
    where: {
      employeeId: emp.id,
      status: "APPROVED",
      startDate: { gte: today },
    },
    include: { leaveType: { select: { name: true, color: true } } },
    orderBy: { startDate: "asc" },
    take: 3,
  }) : []

  // Unread notifications
  const unreadNotifications = await db.notification.count({
    where: { userId: session.user.id, isRead: false }
  })

  // My assets
  const myAssets = emp ? await db.assetAssignment.count({
    where: { employeeId: emp.id, returns: { none: {} } }
  }) : 0

  // Recent announcements
  const recentAnnouncements = await db.announcement.findMany({
    where: {
      OR: [
        { targetType: "ALL" },
        { departmentId: session.user.tenantId },
      ]
    },
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
    take: 3,
    select: { id: true, title: true, isPinned: true, publishedAt: true, creator: { select: { name: true } } }
  })

  const employeeData = {
    leaveBalances: leaveAllocations.map(a => ({
      leaveType: a.leaveType.name,
      color: a.leaveType.color,
      code: a.leaveType.code,
      entitled: a.entitledDays + a.carriedOver,
      used: a.usedDays,
      available: a.entitledDays + a.carriedOver - a.usedDays,
    })),
    pendingLeaves,
    upcomingLeaves,
    unreadNotifications,
    myAssets,
    recentAnnouncements,
  }

  // ── Manager additional data ──────────────────────────
  let managerData = null
  if (isManager || isHR) {
    const deptId = session.user.role as string[]

    // Team absent today
    const teamAbsentToday = await db.leaveRequest.count({
      where: {
        status: "APPROVED",
        startDate: { lte: today },
        endDate: { gte: today },
      }
    })

    // Pending approvals
    const pendingApprovals = await db.leaveRequest.count({
      where: { status: { in: ["PENDING", "PENDING_L2"] } }
    })

    // Pending expense approvals
    const pendingExpenses = await db.expenseReport.count({
      where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } }
    }).catch(() => 0)

    managerData = { teamAbsentToday, pendingApprovals, pendingExpenses }
  }

  // ── HR/Admin additional data ──────────────────────────
  let hrData = null
  if (isHR) {
    const startOfMonth = new Date(year, month, 1)
    const endOfMonth = new Date(year, month + 1, 0)

    // Total employees
    const totalEmployees = await db.user.count({ where: { isActive: true } })

    // New employees this month
    const newEmployees = await db.employee.count({
      where: { contractStart: { gte: startOfMonth, lte: endOfMonth } }
    })

    // Expiring contracts (next 30 days)
    const expiringContracts = await db.employee.count({
      where: {
        contractEnd: {
          gte: today,
          lte: new Date(today.getTime() + 30 * 86400000),
        },
        contractType: { in: ["FIXED_TERM", "PROJECT"] },
      }
    })

    // Leaves by month (last 6 months)
    const leavesByMonth = await Promise.all(
      Array.from({ length: 6 }, (_, i) => {
        const d = new Date(year, month - 5 + i, 1)
        const start = new Date(d.getFullYear(), d.getMonth(), 1)
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
        return db.leaveRequest.count({
          where: { status: "APPROVED", startDate: { gte: start, lte: end } }
        }).then(count => ({
          month: d.toLocaleDateString("el-GR", { month: "short", year: "2-digit" }),
          count,
        }))
      })
    )

    // Leaves by type (current year)
    const leavesByType = await db.leaveRequest.groupBy({
      by: ["leaveTypeId"],
      where: { status: "APPROVED", startDate: { gte: new Date(year, 0, 1) } },
      _count: { id: true },
      _sum: { workingDaysCount: true },
    })

    const leaveTypeNames = await db.leaveType.findMany({
      where: { id: { in: leavesByType.map(l => l.leaveTypeId) } },
      select: { id: true, name: true, color: true }
    })

    const leavesByTypeFormatted = leavesByType.map(l => {
      const type = leaveTypeNames.find(t => t.id === l.leaveTypeId)
      return {
        name: type?.name || "Άγνωστο",
        color: type?.color || "#2E5FA3",
        count: l._count.id,
        days: l._sum.workingDaysCount || 0,
      }
    })

    // Pending change requests
    const pendingChangeRequests = await db.changeRequest.count({
      where: { status: "PENDING" }
    })

    hrData = {
      totalEmployees,
      newEmployees,
      expiringContracts,
      leavesByMonth,
      leavesByType: leavesByTypeFormatted,
      pendingChangeRequests,
    }
  }

  return NextResponse.json(successResponse({ employeeData, managerData, hrData }))
})
