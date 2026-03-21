import { NextRequest, NextResponse } from "next/server"
import { withSuperAdmin } from "@/lib/utils/api-helpers"
import { masterPrisma } from "@/lib/prisma/master"
import { successResponse, errorResponse } from "@/types/api"

export const GET = withSuperAdmin(async (req, { params }) => {
  const tenant = await masterPrisma.tenant.findUnique({
    where: { id: params.id },
    include: { plan: true, subscriptions: { include: { payments: { orderBy: { createdAt: "desc" }, take: 5 } } } },
  })
  if (!tenant) return NextResponse.json(errorResponse("NOT_FOUND", "Tenant δεν βρέθηκε"), { status: 404 })
  return NextResponse.json(successResponse(tenant))
})

export const PATCH = withSuperAdmin(async (req, { params }) => {
  const body = await req.json()
  const allowed = ["status", "planId", "activeModules", "trialEndsAt", "name"]
  const data: any = {}
  for (const key of allowed) if (key in body) data[key] = body[key]
  const tenant = await masterPrisma.tenant.update({ where: { id: params.id }, data })
  return NextResponse.json(successResponse(tenant))
})

export const DELETE = withSuperAdmin(async (req, { params }) => {
  await masterPrisma.tenant.update({
    where: { id: params.id },
    data: { status: "CANCELLED" },
  })
  return NextResponse.json(successResponse({ cancelled: true }))
})
