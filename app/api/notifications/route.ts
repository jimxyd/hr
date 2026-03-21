import { NextRequest, NextResponse } from "next/server"
import { withTenantAuth } from "@/lib/utils/api-helpers"
import { successResponse } from "@/types/api"

export const GET = withTenantAuth(async (req, { session, db }) => {
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20")

  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    db.notification.count({
      where: { userId: session.user.id, isRead: false },
    }),
  ])

  return NextResponse.json(successResponse({ notifications, unreadCount }))
})
