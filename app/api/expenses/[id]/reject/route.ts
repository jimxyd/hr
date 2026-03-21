import { NextRequest, NextResponse } from "next/server"
import { withTenantAuth } from "@/lib/utils/api-helpers"
import { successResponse, errorResponse } from "@/types/api"

export const POST = withTenantAuth(
  async (req, { params, session, db }) => {
    const { reason } = await req.json()
    if (!reason?.trim()) return NextResponse.json(errorResponse("REASON_REQUIRED", "Απαιτείται αιτιολογία"), { status: 400 })

    const report = await db.expenseReport.findUnique({
      where: { id: params.id },
      include: { employee: { include: { user: { select: { id: true } } } } }
    })
    if (!report) return NextResponse.json(errorResponse("NOT_FOUND", "Report δεν βρέθηκε"), { status: 404 })

    await db.expenseReport.update({ where: { id: params.id }, data: { status: "REJECTED" } })
    await db.expenseApproval.create({
      data: { reportId: params.id, approverId: session.user.id, level: 1, action: "REJECTED", reason }
    })

    await db.notification.create({
      data: {
        userId: report.employee.userId,
        type: "EXPENSE_REJECTED",
        title: "Το expense report απορρίφθηκε",
        body: `${report.reportNumber} — Αιτιολογία: ${reason}`,
        entityType: "expense_report",
        entityId: report.id,
      }
    })

    return NextResponse.json(successResponse({ rejected: true }))
  },
  { roles: ["ADMIN", "HR", "MANAGER"] }
)
