import { NextRequest, NextResponse } from "next/server"
import { withTenantAuth } from "@/lib/utils/api-helpers"
import { successResponse } from "@/types/api"

export const POST = withTenantAuth(async (req, { params, session, db }) => {
  await db.announcementRead.upsert({
    where: { announcementId_userId: { announcementId: params.id, userId: session.user.id } },
    create: { announcementId: params.id, userId: session.user.id },
    update: { readAt: new Date() },
  })
  return NextResponse.json(successResponse({ read: true }))
})
