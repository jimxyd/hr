import { NextRequest, NextResponse } from "next/server"
import { withTenantAuth } from "@/lib/utils/api-helpers"
import { successResponse } from "@/types/api"

function buildTree(employees: any[], parentId: string | null = null): any[] {
  return employees
    .filter(e => (e.employee?.reportsToId || null) === parentId)
    .map(e => ({
      id: e.id,
      name: e.name,
      email: e.email,
      title: e.employee?.title,
      positionLevel: e.employee?.positionLevel,
      department: e.department?.name,
      photoUrl: e.employee?.personalInfo?.photoUrl,
      children: buildTree(employees, e.id),
    }))
}

export const GET = withTenantAuth(async (req, { db }) => {
  const departmentId = req.nextUrl.searchParams.get("departmentId")
  const where: any = { isActive: true }
  if (departmentId) where.departmentId = departmentId

  const users = await db.user.findMany({
    where,
    include: {
      department: { select: { id: true, name: true } },
      employee: {
        select: {
          title: true,
          positionLevel: true,
          reportsToId: true,
          personalInfo: { select: { photoUrl: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(successResponse({
    tree: buildTree(users),
    flat: users.map(u => ({
      id: u.id,
      name: u.name,
      title: u.employee?.title,
      positionLevel: u.employee?.positionLevel,
      reportsToId: u.employee?.reportsToId,
      departmentId: u.departmentId,
      department: u.department?.name,
      photoUrl: u.employee?.personalInfo?.photoUrl,
    })),
  }))
})
