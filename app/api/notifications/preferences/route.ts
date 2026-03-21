import { NextRequest, NextResponse } from "next/server"
import { withTenantAuth } from "@/lib/utils/api-helpers"
import { successResponse } from "@/types/api"

export const GET = withTenantAuth(async (req, { session, db }) => {
  const prefs = await db.notificationPreference.findMany({
    where: { userId: session.user.id },
  })
  return NextResponse.json(successResponse(prefs))
})

export const PUT = withTenantAuth(async (req, { session, db }) => {
  const { notificationType, inApp, email } = await req.json()
  const pref = await db.notificationPreference.upsert({
    where: { userId_notificationType: { userId: session.user.id, notificationType } },
    create: { userId: session.user.id, notificationType, inApp, email },
    update: { inApp, email },
  })
  return NextResponse.json(successResponse(pref))
})
