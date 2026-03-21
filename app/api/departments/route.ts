import { NextRequest, NextResponse } from "next/server"
import { withTenantAuth } from "@/lib/utils/api-helpers"
import { successResponse, errorResponse } from "@/types/api"
import { z } from "zod"

export const GET = withTenantAuth(async (req, { db }) => {
  const departments = await db.department.findMany({
    include: { _count: { select: { users: true } } },
    orderBy: { name: "asc" },
  })
  return NextResponse.json(successResponse(departments))
})

const schema = z.object({
  name: z.string().min(2),
  managerId: z.string().optional(),
  maxAbsentPct: z.number().default(40),
  approvalLevels: z.number().min(1).max(2).default(1),
})

export const POST = withTenantAuth(
  async (req, { db }) => {
    const body = await req.json()
    const data = schema.safeParse(body)
    if (!data.success) {
      return NextResponse.json(errorResponse("VALIDATION_ERROR", "Σφάλμα"), { status: 400 })
    }
    const dept = await db.department.create({ data: data.data })
    return NextResponse.json(successResponse(dept), { status: 201 })
  },
  { roles: ["ADMIN", "HR"] }
)
