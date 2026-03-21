import { NextRequest, NextResponse } from "next/server"
import { withTenantAuth } from "@/lib/utils/api-helpers"
import { successResponse } from "@/types/api"

export const GET = withTenantAuth(async (req, { db }) => {
  const month = req.nextUrl.searchParams.get("month")
  const [year, mon] = (month || new Date().toISOString().slice(0, 7)).split("-").map(Number)
  const start = new Date(year, mon - 1, 1)
  const end = new Date(year, mon, 0)

  const requests = await db.leaveRequest.findMany({
    where: {
      status: "APPROVED",
      startDate: { lte: end },
      endDate: { gte: start },
    },
    include: {
      leaveType: { select: { name: true, color: true } },
      employee: { include: { user: { select: { id: true, name: true, departmentId: true } } } },
    },
  })

  const events = requests.map(r => ({
    id: r.id,
    title: r.employee.user.name,
    start: r.startDate.toISOString().slice(0, 10),
    end: new Date(r.endDate.getTime() + 86400000).toISOString().slice(0, 10),
    backgroundColor: r.leaveType.color || "#2E5FA3",
    extendedProps: {
      employeeId: r.employee.userId,
      leaveType: r.leaveType.name,
      days: r.workingDaysCount,
    },
  }))

  return NextResponse.json(successResponse(events))
})
