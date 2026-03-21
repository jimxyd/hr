import { NextRequest, NextResponse } from "next/server"
import { withTenantAuth } from "@/lib/utils/api-helpers"
import { successResponse, errorResponse } from "@/types/api"
import { calculateWorkingDays } from "@/lib/utils/holidays"

export const GET = withTenantAuth(async (req, { session, db }) => {
  const start = req.nextUrl.searchParams.get("start")
  const end = req.nextUrl.searchParams.get("end")
  if (!start || !end) {
    return NextResponse.json(errorResponse("MISSING_PARAMS", "Απαιτούνται start και end"), { status: 400 })
  }

  const emp = await db.employee.findUnique({ where: { userId: session.user.id } })
  const year = new Date(start).getFullYear()
  const holidays = await db.holiday.findMany({ where: { year } })

  const workingDays = calculateWorkingDays(
    new Date(start),
    new Date(end),
    holidays.map(h => h.date),
    emp?.daysPerWeek || 5
  )
  return NextResponse.json(successResponse({ workingDays }))
})
