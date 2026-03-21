import { NextRequest, NextResponse } from "next/server"
import { withTenantAuth } from "@/lib/utils/api-helpers"
import { successResponse, errorResponse } from "@/types/api"

export const GET = withTenantAuth(async (req, { params, session, db }) => {
  const report = await db.expenseReport.findUnique({
    where: { id: params.id },
    include: {
      employee: { include: { user: { select: { id: true, name: true, email: true } } } },
      lines: { include: { category: true }, orderBy: { expenseDate: "asc" } },
      approvals: true,
      payment: true,
    }
  })
  if (!report) return NextResponse.json(errorResponse("NOT_FOUND", "Report δεν βρέθηκε"), { status: 404 })

  // Check ownership (employees can only see own)
  const roles = session.user.role as string[]
  const isHR = roles.some(r => ["ADMIN","HR","MANAGER"].includes(r))
  if (!isHR && report.employee.user.id !== session.user.id) {
    return NextResponse.json(errorResponse("FORBIDDEN", "Δεν έχετε πρόσβαση"), { status: 403 })
  }

  return NextResponse.json(successResponse(report))
})

export const DELETE = withTenantAuth(async (req, { params, session, db }) => {
  const report = await db.expenseReport.findUnique({ where: { id: params.id } })
  if (!report) return NextResponse.json(errorResponse("NOT_FOUND", "Report δεν βρέθηκε"), { status: 404 })
  if (report.status !== "DRAFT") {
    return NextResponse.json(errorResponse("INVALID_STATUS", "Μόνο DRAFT reports μπορούν να διαγραφούν"), { status: 400 })
  }
  await db.expenseReport.delete({ where: { id: params.id } })
  return NextResponse.json(successResponse({ deleted: true }))
})
