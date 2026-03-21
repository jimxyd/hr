import { NextRequest, NextResponse } from "next/server"
import { withTenantAuth } from "@/lib/utils/api-helpers"
import { successResponse, errorResponse } from "@/types/api"
import { getGreekHolidays } from "@/lib/utils/holidays"
import { z } from "zod"

export const GET = withTenantAuth(async (req, { db }) => {
  const year = parseInt(req.nextUrl.searchParams.get("year") || String(new Date().getFullYear()))
  const holidays = await db.holiday.findMany({ where: { year }, orderBy: { date: "asc" } })
  return NextResponse.json(successResponse(holidays))
})

const schema = z.object({
  name: z.string().min(2).optional(),
  date: z.string().optional(),
  isRecurring: z.boolean().default(false),
  type: z.enum(["NATIONAL", "COMPANY"]).default("COMPANY"),
  action: z.enum(["auto-load", "create"]).default("create"),
  year: z.number().optional(),
})

export const POST = withTenantAuth(
  async (req, { session, db }) => {
    const body = await req.json()
    const data = schema.safeParse(body)
    if (!data.success) return NextResponse.json(errorResponse("VALIDATION_ERROR", "Σφάλμα"), { status: 400 })

    if (data.data.action === "auto-load") {
      const year = data.data.year || new Date().getFullYear()
      const holidays = getGreekHolidays(year)
      await db.holiday.deleteMany({ where: { year, type: "NATIONAL" } })
      await db.holiday.createMany({
        data: holidays.map(h => ({
          name: h.name, date: h.date, year, isRecurring: h.isRecurring, type: "NATIONAL" as any,
        })),
      })
      return NextResponse.json(successResponse({ loaded: holidays.length }))
    }

    if (!data.data.name || !data.data.date) {
      return NextResponse.json(errorResponse("VALIDATION_ERROR", "Απαιτούνται name και date"), { status: 400 })
    }

    const holiday = await db.holiday.create({
      data: {
        name: data.data.name,
        date: new Date(data.data.date),
        year: new Date(data.data.date).getFullYear(),
        isRecurring: data.data.isRecurring,
        type: data.data.type as any,
        createdBy: session.user.id,
      },
    })
    return NextResponse.json(successResponse(holiday), { status: 201 })
  },
  { roles: ["ADMIN", "HR"] }
)
