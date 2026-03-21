import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { getTenantPrisma } from "@/lib/prisma/tenant"
import { successResponse, errorResponse } from "@/types/api"
import { z } from "zod"

const schema = z.object({
  fieldName: z.string(),
  newValue: z.string(),
  reason: z.string().min(10, "Τουλάχιστον 10 χαρακτήρες"),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json(errorResponse("UNAUTHORIZED", "Μη εξουσιοδοτημένο"), { status: 401 })

  // Only own profile
  if (session.user.id !== params.id) {
    return NextResponse.json(errorResponse("FORBIDDEN", "Μόνο για το δικό σας προφίλ"), { status: 403 })
  }

  const db = getTenantPrisma(session.user.tenantDbName!)
  const body = await req.json()
  const data = schema.safeParse(body)
  if (!data.success) return NextResponse.json(errorResponse("VALIDATION_ERROR", "Σφάλμα"), { status: 400 })

  const emp = await db.employee.findUnique({ where: { userId: params.id } })
  if (!emp) return NextResponse.json(errorResponse("NOT_FOUND", "Εργαζόμενος δεν βρέθηκε"), { status: 404 })

  const request = await db.changeRequest.create({
    data: {
      employeeId: emp.id,
      fieldName: data.data.fieldName,
      newValue: data.data.newValue,
      reason: data.data.reason,
      status: "PENDING",
    }
  })

  // Notify HR/Admin
  const hrUsers = await db.user.findMany({
    where: { isActive: true, role: { string_contains: "HR" } }
  })
  for (const hr of hrUsers) {
    await db.notification.create({
      data: {
        userId: hr.id,
        type: "CHANGE_REQUEST",
        title: "Νέο αίτημα αλλαγής στοιχείων",
        body: `${session.user.name} ζητά αλλαγή: ${data.data.fieldName}`,
        entityType: "change_request",
        entityId: request.id,
      }
    })
  }

  return NextResponse.json(successResponse(request), { status: 201 })
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json(errorResponse("UNAUTHORIZED", "Μη εξουσιοδοτημένο"), { status: 401 })

  const db = getTenantPrisma(session.user.tenantDbName!)
  const emp = await db.employee.findUnique({ where: { userId: params.id } })
  if (!emp) return NextResponse.json(errorResponse("NOT_FOUND", "Εργαζόμενος δεν βρέθηκε"), { status: 404 })

  const requests = await db.changeRequest.findMany({
    where: { employeeId: emp.id },
    orderBy: { createdAt: "desc" }
  })

  return NextResponse.json(successResponse(requests))
}
