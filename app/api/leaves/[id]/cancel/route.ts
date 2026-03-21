import { NextRequest, NextResponse } from "next/server"
import { withTenantAuth } from "@/lib/utils/api-helpers"
import { successResponse, errorResponse } from "@/types/api"

export const POST = withTenantAuth(async (req, { params, session, db }) => {
  const emp = await db.employee.findUnique({ where: { userId: session.user.id } })
  const request = await db.leaveRequest.findUnique({
    where: { id: params.id },
    include: { leaveType: true },
  })

  if (!request || request.employeeId !== emp?.id) {
    return NextResponse.json(errorResponse("NOT_FOUND", "Αίτημα δεν βρέθηκε"), { status: 404 })
  }

  if (request.status === "APPROVED") {
    if (request.leaveType.deductsBalance) {
      await db.leaveAllocation.updateMany({
        where: { employeeId: emp.id, leaveTypeId: request.leaveTypeId, year: request.startDate.getFullYear() },
        data: { usedDays: { decrement: request.workingDaysCount } },
      })
    }
    await db.leaveRequest.update({ where: { id: params.id }, data: { status: "CANCELLED" } })
  } else if (["PENDING", "PENDING_L2"].includes(request.status)) {
    await db.leaveRequest.update({ where: { id: params.id }, data: { status: "WITHDRAWN" } })
  } else {
    return NextResponse.json(errorResponse("INVALID_STATUS", "Δεν μπορεί να ακυρωθεί"), { status: 400 })
  }

  return NextResponse.json(successResponse({ cancelled: true }))
})
