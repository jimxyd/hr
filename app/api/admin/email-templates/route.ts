import { NextRequest, NextResponse } from "next/server"
import { withSuperAdmin } from "@/lib/utils/api-helpers"
import { masterPrisma } from "@/lib/prisma/master"
import { sendEmail } from "@/lib/email/client"
import { successResponse, errorResponse } from "@/types/api"

export const GET = withSuperAdmin(async () => {
  const templates = await masterPrisma.emailTemplate.findMany({ orderBy: { triggerEvent: "asc" } })
  return NextResponse.json(successResponse(templates))
})

export const PATCH = withSuperAdmin(async (req) => {
  const { id, subject, bodyHtml } = await req.json()
  if (!id) return NextResponse.json(errorResponse("MISSING_ID", "Απαιτείται id"), { status: 400 })
  const template = await masterPrisma.emailTemplate.update({ where: { id }, data: { subject, bodyHtml } })
  return NextResponse.json(successResponse(template))
})

export const POST = withSuperAdmin(async (req) => {
  const { templateId, testEmail } = await req.json()
  if (!templateId || !testEmail) {
    return NextResponse.json(errorResponse("MISSING_PARAMS", "Απαιτούνται templateId και testEmail"), { status: 400 })
  }
  const template = await masterPrisma.emailTemplate.findUnique({ where: { id: templateId } })
  if (!template) return NextResponse.json(errorResponse("NOT_FOUND", "Template δεν βρέθηκε"), { status: 404 })

  await sendEmail({ to: testEmail, subject: `[TEST] ${template.subject}`, html: template.bodyHtml })
  return NextResponse.json(successResponse({ sent: true }))
})
