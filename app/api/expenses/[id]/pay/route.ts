import { NextRequest, NextResponse } from "next/server"
import { withTenantAuth } from "@/lib/utils/api-helpers"
import { successResponse, errorResponse } from "@/types/api"
import { z } from "zod"

const schema = z.object({
  paymentMethod: z.enum(["BANK_TRANSFER", "CASH", "PAYROLL"]),
  paymentDate: z.string(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
})

export const POST = withTenantAuth(
  async (req, { params, session, db }) => {
    const body = await req.json()
    const data = schema.safeParse(body)
    if (!data.success) return NextResponse.json(errorResponse("VALIDATION_ERROR", "Σφάλμα"), { status: 400 })

    const report = await db.expenseReport.findUnique({
      where: { id: params.id },
      include: { employee: { include: { user: { select: { id: true } } } } }
    })
    if (!report) return NextResponse.json(errorResponse("NOT_FOUND", "Report δεν βρέθηκε"), { status: 404 })
    if (report.status !== "APPROVED") {
      return NextResponse.json(errorResponse("INVALID_STATUS", "Μόνο εγκεκριμένα reports μπορούν να πληρωθούν"), { status: 400 })
    }

    await db.expenseReport.update({ where: { id: params.id }, data: { status: "PAID" } })
    await db.expensePayment.create({
      data: {
        reportId: params.id,
        paymentMethod: data.data.paymentMethod as any,
        paymentDate: new Date(data.data.paymentDate),
        referenceNumber: data.data.referenceNumber,
        notes: data.data.notes,
        recordedBy: session.user.id,
      }
    })

    const methodLabels: Record<string, string> = {
      BANK_TRANSFER: "Τραπεζικό Έμβασμα",
      CASH: "Μετρητά",
      PAYROLL: "Μισθοδοσία",
    }

    await db.notification.create({
      data: {
        userId: report.employee.userId,
        type: "EXPENSE_PAID",
        title: "Πληρωμή Expense Report ✅",
        body: `${report.reportNumber} — €${report.totalAmount} μέσω ${methodLabels[data.data.paymentMethod]}`,
        entityType: "expense_report",
        entityId: report.id,
      }
    })

    return NextResponse.json(successResponse({ paid: true }))
  },
  { roles: ["ADMIN", "HR"] }
)
