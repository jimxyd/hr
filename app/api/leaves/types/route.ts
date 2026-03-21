import { NextRequest, NextResponse } from "next/server"
import { withTenantAuth } from "@/lib/utils/api-helpers"
import { successResponse, errorResponse } from "@/types/api"
import { z } from "zod"

export const GET = withTenantAuth(async (req, { db }) => {
  const types = await db.leaveType.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  })
  return NextResponse.json(successResponse(types))
})

const schema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).toUpperCase(),
  deductsBalance: z.boolean().default(true),
  requiresApproval: z.boolean().default(true),
  maxDaysPerYear: z.number().optional(),
  color: z.string().default("#2E5FA3"),
})

export const POST = withTenantAuth(
  async (req, { db }) => {
    const body = await req.json()
    const data = schema.safeParse(body)
    if (!data.success) return NextResponse.json(errorResponse("VALIDATION_ERROR", "Σφάλμα"), { status: 400 })
    const type = await db.leaveType.create({ data: data.data })
    return NextResponse.json(successResponse(type), { status: 201 })
  },
  { roles: ["ADMIN", "HR"] }
)
