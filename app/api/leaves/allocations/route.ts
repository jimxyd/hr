import { NextRequest, NextResponse } from "next/server"
import { withTenantAuth } from "@/lib/utils/api-helpers"
import { successResponse, errorResponse } from "@/types/api"

export const GET = withTenantAuth(async (req, { session, db }) => {
  const employeeId = req.nextUrl.searchParams.get("employeeId") || session.user.id
  const year = parseInt(req.nextUrl.searchParams.get("year") || String(new Date().getFullYear()))

  const emp = await db.employee.findUnique({ where: { userId: employeeId } })
  if (!emp) return NextResponse.json(errorResponse("NOT_FOUND", "Εργαζόμενος δεν βρέθηκε"), { status: 404 })

  const allocations = await db.leaveAllocation.findMany({
    where: { employeeId: emp.id, year },
    include: { leaveType: true },
  })
  return NextResponse.json(successResponse(allocations))
})
