import { NextRequest, NextResponse } from "next/server"
import { withTenantAuth } from "@/lib/utils/api-helpers"
import { successResponse, errorResponse } from "@/types/api"
import { getDomain } from "@/lib/utils/api-helpers"

export const POST = withTenantAuth(async (req, { params, session, db }) => {
  const report = await db.expenseReport.findUnique({
    where: { id: params.id },
    include: { lines: true, employee: { include: { user: true } } }
  })
  if (!report) return NextResponse.json(errorResponse("NOT_FOUND", "Report δεν βρέθηκε"), { status: 404 })
  if (!["DRAFT", "REJECTED"].includes(report.status)) {
    return NextResponse.json(errorResponse("INVALID_STATUS", "Το report δεν μπορεί να υποβληθεί"), { status: 400 })
  }
  if (report.lines.length === 0) {
    return NextResponse.json(errorResponse("NO_LINES", "Προσθέστε τουλάχιστον μία γραμμή"), { status: 400 })
  }

  await db.expenseReport.update({ where: { id: params.id }, data: { status: "SUBMITTED" } })

  // Notify HR/Admin
  const hrUsers = await db.user.findMany({
    where: { isActive: true, role: { array_contains: "HR" } },
    select: { id: true, email: true }
  })
  for (const hr of hrUsers) {
    await db.notification.create({
      data: {
        userId: hr.id,
        type: "EXPENSE_SUBMITTED",
        title: `Νέο expense report`,
        body: `${session.user.name}: ${report.reportNumber} — €${report.totalAmount}`,
        entityType: "expense_report",
        entityId: report.id,
      }
    })
  }

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      module: "EXPENSES",
      action: "REPORT_SUBMITTED",
      entityType: "expense_report",
      entityId: params.id,
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    }
  })

  return NextResponse.json(successResponse({ submitted: true }))
})
