import { NextRequest, NextResponse } from "next/server"
import { withSuperAdmin } from "@/lib/utils/api-helpers"
import { masterPrisma } from "@/lib/prisma/master"
import { successResponse } from "@/types/api"

export const GET = withSuperAdmin(async (req) => {
  const [total, active, trial, suspended, recentTenants, totalPayments] = await Promise.all([
    masterPrisma.tenant.count(),
    masterPrisma.tenant.count({ where: { status: "ACTIVE" } }),
    masterPrisma.tenant.count({ where: { status: "TRIAL" } }),
    masterPrisma.tenant.count({ where: { status: "SUSPENDED" } }),
    masterPrisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, subdomain: true, status: true, createdAt: true },
    }),
    masterPrisma.payment.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
    }),
  ])

  return NextResponse.json(successResponse({
    tenants: { total, active, trial, suspended },
    revenue: { total: totalPayments._sum.amount || 0 },
    recentTenants,
  }))
})
