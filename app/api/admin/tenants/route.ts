import { NextRequest, NextResponse } from "next/server"
import { withSuperAdmin } from "@/lib/utils/api-helpers"
import { masterPrisma } from "@/lib/prisma/master"
import { getTenantPrisma, createTenantDatabase } from "@/lib/prisma/tenant"
import { successResponse, errorResponse } from "@/types/api"
import bcrypt from "bcryptjs"
import { z } from "zod"

export const GET = withSuperAdmin(async (req) => {
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1")
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20")
  const status = req.nextUrl.searchParams.get("status")
  const search = req.nextUrl.searchParams.get("search")

  const where: any = {}
  if (status) where.status = status
  if (search) where.OR = [{ name: { contains: search } }, { subdomain: { contains: search } }]

  const [tenants, total] = await Promise.all([
    masterPrisma.tenant.findMany({
      where,
      include: { plan: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    masterPrisma.tenant.count({ where }),
  ])

  return NextResponse.json(successResponse(tenants, { total, page, limit }))
})

const createSchema = z.object({
  companyName: z.string().min(2),
  subdomain: z.string().min(3).max(30).regex(/^[a-z0-9-]+$/),
  adminName: z.string().min(2),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
  activeModules: z.array(z.string()).default(["M1", "M2"]),
  trialDays: z.number().default(30),
})

export const POST = withSuperAdmin(async (req) => {
  const body = await req.json()
  const data = createSchema.safeParse(body)
  if (!data.success) return NextResponse.json(errorResponse("VALIDATION_ERROR", "Σφάλμα"), { status: 400 })

  const { companyName, subdomain, adminName, adminEmail, adminPassword, activeModules, trialDays } = data.data
  const dbName = `ergohub_${subdomain.replace(/-/g, "_")}`

  const existing = await masterPrisma.tenant.findUnique({ where: { subdomain } })
  if (existing) return NextResponse.json(errorResponse("CONFLICT", "Subdomain υπάρχει ήδη"), { status: 409 })

  const tenant = await masterPrisma.tenant.create({
    data: {
      name: companyName, subdomain, status: "TRIAL",
      trialEndsAt: new Date(Date.now() + trialDays * 86400000),
      dbName, activeModules,
    },
  })

  await createTenantDatabase(dbName)
  const tenantDb = getTenantPrisma(dbName)
  const hash = await bcrypt.hash(adminPassword, 12)
  await tenantDb.user.create({
    data: { name: adminName, email: adminEmail, passwordHash: hash, role: ["ADMIN"] },
  })
  await tenantDb.tenantBranding.create({ data: { companyName, primaryColor: "#2E5FA3" } })

  return NextResponse.json(successResponse(tenant), { status: 201 })
})
