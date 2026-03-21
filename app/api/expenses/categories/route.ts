import { NextRequest, NextResponse } from "next/server"
import { withTenantAuth } from "@/lib/utils/api-helpers"
import { successResponse, errorResponse } from "@/types/api"
import { z } from "zod"

export const GET = withTenantAuth(async (req, { db }) => {
  const categories = await db.expenseCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  })
  return NextResponse.json(successResponse(categories))
})

export const POST = withTenantAuth(
  async (req, { db }) => {
    const schema = z.object({
      name: z.string().min(2),
      code: z.string().min(2).toUpperCase(),
      maxAmountPerLine: z.number().optional(),
      receiptRequired: z.boolean().default(false),
      sortOrder: z.number().default(99),
    })
    const body = await req.json()
    const data = schema.safeParse(body)
    if (!data.success) return NextResponse.json(errorResponse("VALIDATION_ERROR", "Σφάλμα"), { status: 400 })
    const cat = await db.expenseCategory.create({ data: data.data })
    return NextResponse.json(successResponse(cat), { status: 201 })
  },
  { roles: ["ADMIN", "HR"] }
)
