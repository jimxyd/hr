import { NextRequest, NextResponse } from "next/server"
import { withSuperAdmin } from "@/lib/utils/api-helpers"
import { masterPrisma } from "@/lib/prisma/master"
import { getTenantPrisma } from "@/lib/prisma/tenant"
import { successResponse, errorResponse } from "@/types/api"

export const POST = withSuperAdmin(async (req, { params, session }) => {
  const tenant = await masterPrisma.tenant.findUnique({ where: { id: params.id } })
  if (!tenant) return NextResponse.json(errorResponse("NOT_FOUND", "Tenant δεν βρέθηκε"), { status: 404 })

  const tenantDb = getTenantPrisma(tenant.dbName)
  const adminUser = await tenantDb.user.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  })
  if (!adminUser) return NextResponse.json(errorResponse("NOT_FOUND", "Admin χρήστης δεν βρέθηκε"), { status: 404 })

  await masterPrisma.platformLog.create({
    data: {
      level: "WARN",
      message: `Super Admin impersonated tenant: ${tenant.subdomain}`,
      tenantId: tenant.id,
      context: { superAdminId: session.user.id, targetUserId: adminUser.id },
    },
  })

  return NextResponse.json(successResponse({
    tenantSubdomain: tenant.subdomain,
    tenantDbName: tenant.dbName,
    userId: adminUser.id,
    userEmail: adminUser.email,
    userName: adminUser.name,
  }))
})
