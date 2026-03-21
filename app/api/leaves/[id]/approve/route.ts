import { NextRequest, NextResponse } from "next/server"
import { withTenantAuth } from "@/lib/utils/api-helpers"
import { successResponse, errorResponse } from "@/types/api"

export const POST = withTenantAuth(
  async (req, { params, session, db }) => {
    const request = await db.leaveRequest.findUnique({
      where: { id: params.id },
      include: {
        employee: { include: { user: { select: { id: true, name: true } } } },
        leaveType: true,
      },
    })
    if (!request) return NextResponse.json(errorResponse("NOT_FOUND", "Αίτημα δεν βρέθηκε"), { status: 404 })
    if (!["PENDING", "PENDING_L2"].includes(request.status)) {
      return NextResponse.json(errorResponse("INVALID_STATUS", "Δεν μπορεί να εγκριθεί"), { status: 400 })
    }

    await db.leaveRequest.update({ where: { id: params.id }, data: { status: "APPROVED" } })
    await db.leaveApproval.create({
      data: {
        requestId: params.id,
        approverId: session.user.id,
        level: request.status === "PENDING_L2" ? 2 : 1,
        action: "APPROVED",
      },
    })

    // Deduct balance
    if (request.leaveType.deductsBalance) {
      const year = request.startDate.getFullYear()
      await db.leaveAllocation.updateMany({
        where: { employeeId: request.employeeId, leaveTypeId: request.leaveTypeId, year },
        data: { usedDays: { increment: request.workingDaysCount } },
      })
    }

    // Notify employee
    await db.notification.create({
      data: {
        userId: request.employee.userId,
        type: "LEAVE_APPROVED",
        title: "Η άδειά σας εγκρίθηκε ✅",
        body: `${request.leaveType.name}: ${request.startDate.toLocaleDateString("el-GR")} - ${request.endDate.toLocaleDateString("el-GR")}`,
        entityType: "leave_request",
        entityId: request.id,
      },
    })

    // Audit
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        module: "LEAVES",
        action: "LEAVE_APPROVED",
        entityType: "leave_request",
        entityId: params.id,
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      },
    })

    return NextResponse.json(successResponse({ approved: true }))
  },
  { roles: ["ADMIN", "HR", "MANAGER"] }
)
