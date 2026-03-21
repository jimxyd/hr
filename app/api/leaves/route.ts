import { NextRequest, NextResponse } from "next/server"
import { withTenantAuth } from "@/lib/utils/api-helpers"
import { successResponse, errorResponse } from "@/types/api"
import { z } from "zod"
import { calculateWorkingDays } from "@/lib/utils/holidays"

const createSchema = z.object({
  leaveTypeId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  note: z.string().optional(),
})

export const GET = withTenantAuth(async (req, { session, db }) => {
  const roles = session.user.role as string[]
  const isHR = roles.some(r => ["ADMIN", "HR", "MANAGER"].includes(r))

  const page = parseInt(req.nextUrl.searchParams.get("page") || "1")
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20")
  const status = req.nextUrl.searchParams.get("status")
  const employeeId = req.nextUrl.searchParams.get("employeeId")
  const year = req.nextUrl.searchParams.get("year")

  const where: any = {}
  if (!isHR) {
    const emp = await db.employee.findUnique({ where: { userId: session.user.id } })
    if (emp) where.employeeId = emp.id
  }
  if (employeeId && isHR) {
    const emp = await db.employee.findUnique({ where: { userId: employeeId } })
    if (emp) where.employeeId = emp.id
  }
  if (status) where.status = status
  if (year) {
    where.startDate = {
      gte: new Date(`${year}-01-01`),
      lt: new Date(`${parseInt(year) + 1}-01-01`),
    }
  }

  const [requests, total] = await Promise.all([
    db.leaveRequest.findMany({
      where,
      include: {
        leaveType: true,
        employee: { include: { user: { select: { id: true, name: true, email: true } } } },
        approvals: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.leaveRequest.count({ where }),
  ])

  return NextResponse.json(successResponse(requests, { total, page, limit }))
})

export const POST = withTenantAuth(async (req, { session, db }) => {
  const body = await req.json()
  const data = createSchema.safeParse(body)
  if (!data.success) {
    return NextResponse.json(
      errorResponse("VALIDATION_ERROR", "Σφάλμα επικύρωσης",
        Object.fromEntries(data.error.errors.map(e => [e.path.join("."), e.message]))
      ), { status: 400 }
    )
  }

  const { leaveTypeId, startDate, endDate, note } = data.data
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (start > end) {
    return NextResponse.json(errorResponse("INVALID_DATES", "Η ημ. έναρξης πρέπει να είναι πριν τη λήξη"), { status: 400 })
  }

  const emp = await db.employee.findUnique({ where: { userId: session.user.id } })
  if (!emp) return NextResponse.json(errorResponse("NOT_FOUND", "Εργαζόμενος δεν βρέθηκε"), { status: 404 })

  const leaveType = await db.leaveType.findUnique({ where: { id: leaveTypeId } })
  if (!leaveType) return NextResponse.json(errorResponse("NOT_FOUND", "Τύπος άδειας δεν βρέθηκε"), { status: 404 })

  const year = start.getFullYear()
  const holidays = await db.holiday.findMany({ where: { year } })
  const workingDays = calculateWorkingDays(start, end, holidays.map(h => h.date), emp.daysPerWeek)

  if (workingDays === 0) {
    return NextResponse.json(errorResponse("NO_WORKING_DAYS", "Δεν υπάρχουν εργάσιμες ημέρες"), { status: 400 })
  }

  if (leaveType.deductsBalance) {
    const allocation = await db.leaveAllocation.findFirst({
      where: { employeeId: emp.id, leaveTypeId, year }
    })
    const available = allocation ? (allocation.entitledDays + allocation.carriedOver - allocation.usedDays) : 0
    if (workingDays > available) {
      return NextResponse.json(
        errorResponse("INSUFFICIENT_BALANCE", `Ανεπαρκές υπόλοιπο. Διαθέσιμο: ${available} ημέρες`),
        { status: 400 }
      )
    }
  }

  // Overlap check
  const overlap = await db.leaveRequest.findFirst({
    where: {
      employeeId: emp.id,
      status: { in: ["PENDING", "PENDING_L2", "APPROVED"] },
      startDate: { lte: end },
      endDate: { gte: start },
    }
  })
  if (overlap) {
    return NextResponse.json(errorResponse("OVERLAP", "Υπάρχει επικαλυπτόμενο αίτημα"), { status: 409 })
  }

  const request = await db.leaveRequest.create({
    data: { employeeId: emp.id, leaveTypeId, startDate: start, endDate: end, workingDaysCount: workingDays, status: "PENDING", note },
  })

  // Get approver and notify
  const approvalFlow = await db.approvalFlow.findFirst({
    where: { OR: [{ userId: session.user.id }, { departmentId: emp.userId }] }
  })
  if (approvalFlow?.level1ApproverId) {
    await db.notification.create({
      data: {
        userId: approvalFlow.level1ApproverId,
        type: "LEAVE_REQUEST",
        title: "Νέο αίτημα άδειας",
        body: `${session.user.name}: ${workingDays} ημ. ${leaveType.name}`,
        entityType: "leave_request",
        entityId: request.id,
      },
    })
  }

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      module: "LEAVES",
      action: "LEAVE_REQUESTED",
      entityType: "leave_request",
      entityId: request.id,
      newValue: { leaveTypeId, startDate, endDate, workingDays },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    },
  })

  return NextResponse.json(successResponse(request), { status: 201 })
})
