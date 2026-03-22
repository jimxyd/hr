import { NextRequest, NextResponse } from "next/server"
import { withTenantAuth } from "@/lib/utils/api-helpers"
import { successResponse, errorResponse } from "@/types/api"
import { hasAnyRole } from "@/lib/utils/roles"
import { z } from "zod"

const createSchema = z.object({
  title: z.string().min(2, "Τουλάχιστον 2 χαρακτήρες"),
  description: z.string().optional(),
  periodFrom: z.string(),
  periodTo: z.string(),
})

export const GET = withTenantAuth(async (req, { session, db }) => {
  const roles = session.user.role as string[]
  const isHR = hasAnyRole(roles, "ADMIN", "HR")
  const isManager = hasAnyRole(roles, "MANAGER")

  const page = parseInt(req.nextUrl.searchParams.get("page") || "1")
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20")
  const status = req.nextUrl.searchParams.get("status")
  const employeeId = req.nextUrl.searchParams.get("employeeId")

  const where: any = {}
  if (!isHR && !isManager) {
    const emp = await db.employee.findUnique({ where: { userId: session.user.id } })
    if (emp) where.employeeId = emp.id
    else where.employeeId = "none"
  } else if (employeeId) where.employeeId = employeeId
  if (status) where.status = status

  const [reports, total] = await Promise.all([
    db.expenseReport.findMany({
      where,
      include: {
        employee: { include: { user: { select: { name: true, email: true } } } },
        lines: { select: { amount: true, currency: true } },
        payment: { select: { paymentMethod: true, paymentDate: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.expenseReport.count({ where }),
  ])

  return NextResponse.json(successResponse(reports, { total, page, limit }))
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

  // Auto-generate report number: EXP-2026-0042
  const year = new Date().getFullYear()
  const count = await db.expenseReport.count({
    where: { reportNumber: { startsWith: `EXP-${year}-` } }
  })
  const reportNumber = `EXP-${year}-${String(count + 1).padStart(4, "0")}`

  const emp = await db.employee.findUnique({ where: { userId: session.user.id } })
  if (!emp) return NextResponse.json(errorResponse("NOT_FOUND", "Εργαζόμενος δεν βρέθηκε"), { status: 404 })

  const report = await db.expenseReport.create({
    data: {
      employeeId: emp.id,
      title: data.data.title,
      description: data.data.description,
      periodFrom: new Date(data.data.periodFrom),
      periodTo: new Date(data.data.periodTo),
      reportNumber,
      status: "DRAFT",
      totalAmount: 0,
      currency: "EUR",
      createdBy: session.user.id,
    }
  })

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      module: "EXPENSES",
      action: "REPORT_CREATED",
      entityType: "expense_report",
      entityId: report.id,
      newValue: { reportNumber, title: data.data.title },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    }
  })

  return NextResponse.json(successResponse(report), { status: 201 })
})
