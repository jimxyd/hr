import { NextRequest, NextResponse } from "next/server"
import { withTenantAuth } from "@/lib/utils/api-helpers"
import { successResponse, errorResponse } from "@/types/api"
import { z } from "zod"

export const GET = withTenantAuth(async (req, { session, db }) => {
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1")
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "10")

  const [announcements, total] = await Promise.all([
    db.announcement.findMany({
      include: {
        creator: { select: { name: true } },
        _count: { select: { reads: true } },
        reads: { where: { userId: session.user.id }, select: { readAt: true } },
      },
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.announcement.count(),
  ])

  return NextResponse.json(successResponse(announcements, { total, page, limit }))
})

const schema = z.object({
  title: z.string().min(2),
  bodyHtml: z.string().min(1),
  targetType: z.enum(["ALL", "DEPARTMENT"]).default("ALL"),
  departmentId: z.string().optional(),
  isPinned: z.boolean().default(false),
})

export const POST = withTenantAuth(
  async (req, { session, db }) => {
    const body = await req.json()
    const data = schema.safeParse(body)
    if (!data.success) return NextResponse.json(errorResponse("VALIDATION_ERROR", "Σφάλμα"), { status: 400 })

    const announcement = await db.announcement.create({
      data: { ...data.data, createdBy: session.user.id },
    })

    // Notify relevant users
    const where: any = { isActive: true }
    if (data.data.targetType === "DEPARTMENT" && data.data.departmentId) {
      where.departmentId = data.data.departmentId
    }
    const users = await db.user.findMany({ where, select: { id: true } })
    if (users.length > 0) {
      await db.notification.createMany({
        data: users.map(u => ({
          userId: u.id,
          type: "ANNOUNCEMENT",
          title: "Νέα Ανακοίνωση",
          body: data.data.title,
          entityType: "announcement",
          entityId: announcement.id,
        })),
      })
    }

    return NextResponse.json(successResponse(announcement), { status: 201 })
  },
  { roles: ["ADMIN", "HR"] }
)
