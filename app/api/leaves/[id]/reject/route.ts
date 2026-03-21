import { NextRequest, NextResponse } from "next/server"
import { withTenantAuth } from "@/lib/utils/api-helpers"
import { successResponse, errorResponse } from "@/types/api"

export const POST = withTenantAuth(
  async (req, { params, session, db }) => {
    const { reason } = await req.json()
    if (!reason?.trim()) return NextResponse.json(errorResponse("REASON_REQUIRED", "Απαιτείται αιτιολογία"), { status: 400 })

    const request = await db.leaveRequest.findUnique({
      where: { id: params.id },
      include: { employee: { include: { user: { select: { id: true } } } }, leaveType: true },
    })
    if (!request) return NextResponse.json(errorResponse("NOT_FOUND", "Αίτημα δεν βρέθηκε"), { status: 404 })

    await db.leaveRequest.update({ where: { id: params.id }, data: { status: "REJECTED" } })
    await db.leaveApproval.create({
      data: { requestId: params.id, approverId: session.user.id, level: 1, action: "REJECTED", reason },
    })

    await db.notification.create({
      data: {
        userId: request.employee.userId,
        type: "LEAVE_REJECTED",
        title: "Η άδειά σας απορρίφθηκε",
        body: `${request.leaveType.name} — Αιτιολογία: ${reason}`,
        entityType: "leave_request",
        entityId: request.id,
      },
    })

    return NextResponse.json(successResponse({ rejected: true }))
  },
  { roles: ["ADMIN", "HR", "MANAGER"] }
)
