import { NextRequest, NextResponse } from "next/server"
import { withTenantAuth } from "@/lib/utils/api-helpers"
import { successResponse, errorResponse } from "@/types/api"

export const POST = withTenantAuth(
  async (req, { params, session, db }) => {
    const report = await db.expenseReport.findUnique({
      where: { id: params.id },
      include: { employee: { include: { user: { select: { id: true, name: true } } } } }
    })
    if (!report) return NextResponse.json(errorResponse("NOT_FOUND", "Report δεν βρέθηκε"), { status: 404 })
    if (!["SUBMITTED","UNDER_REVIEW"].includes(report.status)) {
      return NextResponse.json(errorResponse("INVALID_STATUS", "Δεν μπορεί να εγκριθεί"), { status: 400 })
    }

    await db.expenseReport.update({ where: { id: params.id }, data: { status: "APPROVED" } })
    await db.expenseApproval.create({
      data: { reportId: params.id, approverId: session.user.id, level: 1, action: "APPROVED" }
    })

    await db.notification.create({
      data: {
        userId: report.employee.userId,
        type: "EXPENSE_APPROVED",
        title: "Το expense report σας εγκρίθηκε ✅",
        body: `${report.reportNumber} — €${report.totalAmount} εγκρίθηκε`,
        entityType: "expense_report",
        entityId: report.id,
      }
    })

    return NextResponse.json(successResponse({ approved: true }))
  },
  { roles: ["ADMIN", "HR", "MANAGER"] }
)
