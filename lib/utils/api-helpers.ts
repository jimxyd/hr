import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { masterPrisma } from "@/lib/prisma/master"
import { getTenantPrisma } from "@/lib/prisma/tenant"
import { errorResponse } from "@/types/api"
import type { PrismaClient } from "@prisma/tenant-client"

export type ApiHandler = (
  req: NextRequest,
  ctx: { params?: any; session: any; db: PrismaClient }
) => Promise<NextResponse>

// Wraps API routes with: auth check + tenant DB + try/catch
export function withTenantAuth(
  handler: ApiHandler,
  options: { roles?: string[]; allowSuperAdmin?: boolean } = {}
) {
  return async (req: NextRequest, ctx: { params?: any } = {}) => {
    try {
      const session = await auth()
      if (!session?.user) {
        return NextResponse.json(errorResponse("UNAUTHORIZED", "Μη εξουσιοδοτημένο"), { status: 401 })
      }

      // Super admin can access all tenants
      if (options.allowSuperAdmin && session.user.isSuperAdmin) {
        const db = session.user.tenantDbName
          ? getTenantPrisma(session.user.tenantDbName)
          : null
        return handler(req, { params: ctx.params, session, db: db as any })
      }

      // Check tenant DB
      if (!session.user.tenantDbName) {
        return NextResponse.json(errorResponse("NO_TENANT", "Δεν βρέθηκε tenant"), { status: 400 })
      }

      // Check roles
      if (options.roles && options.roles.length > 0) {
        const userRoles = session.user.role as string[]
        if (!userRoles.some(r => options.roles!.includes(r))) {
          return NextResponse.json(errorResponse("FORBIDDEN", "Δεν έχετε δικαίωμα"), { status: 403 })
        }
      }

      const db = getTenantPrisma(session.user.tenantDbName)
      return handler(req, { params: ctx.params, session, db })
    } catch (error: any) {
      console.error("[API Error]", req.nextUrl.pathname, error?.message)
      return NextResponse.json(
        errorResponse("SERVER_ERROR", "Εσωτερικό σφάλμα. Προσπαθήστε ξανά."),
        { status: 500 }
      )
    }
  }
}

// Wraps Super Admin routes
export function withSuperAdmin(handler: (req: NextRequest, ctx: any) => Promise<NextResponse>) {
  return async (req: NextRequest, ctx: any = {}) => {
    try {
      const session = await auth()
      if (!session?.user?.isSuperAdmin) {
        return NextResponse.json(errorResponse("FORBIDDEN", "Μόνο Super Admin"), { status: 403 })
      }
      return handler(req, { ...ctx, session })
    } catch (error: any) {
      console.error("[SuperAdmin API Error]", error?.message)
      return NextResponse.json(
        errorResponse("SERVER_ERROR", "Εσωτερικό σφάλμα."),
        { status: 500 }
      )
    }
  }
}

// Helper: get tenant DB safely
export async function getTenantDb(tenantDbName?: string | null) {
  if (!tenantDbName) throw new Error("No tenant DB name")
  return getTenantPrisma(tenantDbName)
}

// Helper: check if user has role
export function hasRole(session: any, ...roles: string[]): boolean {
  const userRoles = session?.user?.role as string[] || []
  return roles.some(r => userRoles.includes(r))
}

// Helper: get domain safely
export function getDomain(): string {
  return process.env.NEXT_PUBLIC_DOMAIN || "ergohub.gr"
}
