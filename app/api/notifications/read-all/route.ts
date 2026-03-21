import { NextRequest, NextResponse } from "next/server"
import { withTenantAuth } from "@/lib/utils/api-helpers"
import { successResponse } from "@/types/api"

export const POST = withTenantAuth(async (req, { session, db }) => {
  await db.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  })
  return NextResponse.json(successResponse({ updated: true }))
})
