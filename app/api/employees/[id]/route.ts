import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { getTenantPrisma } from "@/lib/prisma/tenant"
import { successResponse, errorResponse } from "@/types/api"
import { encryptIfExists, decryptIfExists } from "@/lib/encryption"
import { z } from "zod"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json(errorResponse("UNAUTHORIZED", "Μη εξουσιοδοτημένο"), { status: 401 })

  const db = getTenantPrisma(session.user.tenantDbName!)
  
  // Employee can only see own profile
  const isHR = (session.user.role as string[]).some(r => ["ADMIN","HR"].includes(r))
  if (!isHR && session.user.id !== params.id) {
    return NextResponse.json(errorResponse("FORBIDDEN", "Δεν έχετε πρόσβαση"), { status: 403 })
  }

  const user = await db.user.findUnique({
    where: { id: params.id },
    include: {
      department: true,
      employee: {
        include: {
          personalInfo: true,
          documents: { orderBy: { createdAt: "desc" } },
          history: { orderBy: { effectiveDate: "desc" } },
          leaveAllocations: { include: { leaveType: true } },
        }
      }
    }
  })

  if (!user) return NextResponse.json(errorResponse("NOT_FOUND", "Χρήστης δεν βρέθηκε"), { status: 404 })

  const { passwordHash, totpSecret, inviteToken, ...safeUser } = user

  // Decrypt sensitive fields if HR/Admin or own profile
  if (safeUser.employee?.personalInfo) {
    const pi = safeUser.employee.personalInfo
    safeUser.employee.personalInfo = {
      ...pi,
      afm: decryptIfExists(pi.afm),
      amka: decryptIfExists(pi.amka),
      iban: decryptIfExists(pi.iban),
      nationality: decryptIfExists(pi.nationality),
      residencePermit: decryptIfExists(pi.residencePermit),
    } as any
  }

  if (safeUser.employee && isHR) {
    safeUser.employee = {
      ...safeUser.employee,
      salaryGross: decryptIfExists(safeUser.employee.salaryGross),
      salaryNet: decryptIfExists(safeUser.employee.salaryNet),
    } as any
  } else if (safeUser.employee) {
    safeUser.employee = { ...safeUser.employee, salaryGross: null, salaryNet: null } as any
  }

  return NextResponse.json(successResponse(safeUser))
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  const roles = session?.user?.role as string[] || []
  if (!roles.some(r => ["ADMIN","HR"].includes(r))) {
    return NextResponse.json(errorResponse("FORBIDDEN", "Δεν έχετε δικαίωμα"), { status: 403 })
  }

  const db = getTenantPrisma(session.user.tenantDbName!)
  const body = await req.json()

  const { employeeData, ...userData } = body

  // Update user
  if (Object.keys(userData).length > 0) {
    const allowedUserFields = ["name", "departmentId", "isActive", "role"]
    const userUpdate: any = {}
    for (const key of allowedUserFields) {
      if (key in userData) userUpdate[key] = userData[key]
    }
    if (Object.keys(userUpdate).length > 0) {
      await db.user.update({ where: { id: params.id }, data: userUpdate })
    }
  }

  // Update employee record
  if (employeeData) {
    const emp = await db.employee.findUnique({ where: { userId: params.id } })
    if (emp) {
      const update: any = { ...employeeData }
      if (employeeData.salaryGross) update.salaryGross = encryptIfExists(employeeData.salaryGross)
      if (employeeData.salaryNet) update.salaryNet = encryptIfExists(employeeData.salaryNet)
      if (employeeData.contractStart) update.contractStart = new Date(employeeData.contractStart)
      if (employeeData.contractEnd) update.contractEnd = new Date(employeeData.contractEnd)
      await db.employee.update({ where: { userId: params.id }, data: update })
    }
  }

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      module: "HR_CORE",
      action: "EMPLOYEE_UPDATED",
      entityType: "user",
      entityId: params.id,
      newValue: body,
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    }
  })

  return NextResponse.json(successResponse({ updated: true }))
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  const roles = session?.user?.role as string[] || []
  if (!roles.includes("ADMIN")) {
    return NextResponse.json(errorResponse("FORBIDDEN", "Μόνο Admin"), { status: 403 })
  }
  const db = getTenantPrisma(session.user.tenantDbName!)
  await db.user.update({ where: { id: params.id }, data: { isActive: false } })
  return NextResponse.json(successResponse({ deleted: true }))
}
