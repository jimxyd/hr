import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { getTenantPrisma } from "@/lib/prisma/tenant"
import { successResponse, errorResponse } from "@/types/api"
import { encryptIfExists, decryptIfExists } from "@/lib/encryption"
import nodemailer from "nodemailer"
import { z } from "zod"

export async function GET(req: NextRequest) {
  const session = await auth()
  const roles = session?.user?.role as string[] || []
  if (!roles.includes("ADMIN")) return NextResponse.json(errorResponse("FORBIDDEN", "Μόνο Admin"), { status: 403 })

  const db = getTenantPrisma(session.user.tenantDbName!)
  const smtp = await db.smtpSettings.findFirst()
  if (!smtp) return NextResponse.json(successResponse(null))

  // Never expose password
  const { passwordEncrypted, ...safe } = smtp
  return NextResponse.json(successResponse({ ...safe, hasPassword: !!passwordEncrypted }))
}

const smtpSchema = z.object({
  host: z.string().min(1),
  port: z.number().default(587),
  username: z.string().min(1),
  password: z.string().optional(),
  fromEmail: z.string().email(),
  fromName: z.string().min(1),
  useTls: z.boolean().default(true),
  isCustom: z.boolean().default(true),
})

export async function PUT(req: NextRequest) {
  const session = await auth()
  const roles = session?.user?.role as string[] || []
  if (!roles.includes("ADMIN")) return NextResponse.json(errorResponse("FORBIDDEN", "Μόνο Admin"), { status: 403 })

  const db = getTenantPrisma(session.user.tenantDbName!)
  const body = await req.json()
  const data = smtpSchema.safeParse(body)
  if (!data.success) return NextResponse.json(errorResponse("VALIDATION_ERROR", "Σφάλμα"), { status: 400 })

  const existing = await db.smtpSettings.findFirst()
  const update: any = {
    host: data.data.host,
    port: data.data.port,
    username: data.data.username,
    fromEmail: data.data.fromEmail,
    fromName: data.data.fromName,
    useTls: data.data.useTls,
    isCustom: data.data.isCustom,
  }
  if (data.data.password) {
    update.passwordEncrypted = encryptIfExists(data.data.password)
  }

  const smtp = existing
    ? await db.smtpSettings.update({ where: { id: existing.id }, data: update })
    : await db.smtpSettings.create({ data: { ...update, passwordEncrypted: update.passwordEncrypted || "" } })

  return NextResponse.json(successResponse({ saved: true }))
}

export async function POST(req: NextRequest) {
  // Test SMTP connection
  const session = await auth()
  const roles = session?.user?.role as string[] || []
  if (!roles.includes("ADMIN")) return NextResponse.json(errorResponse("FORBIDDEN", "Μόνο Admin"), { status: 403 })

  const { testEmail } = await req.json()
  const db = getTenantPrisma(session.user.tenantDbName!)
  const smtp = await db.smtpSettings.findFirst()
  if (!smtp) return NextResponse.json(errorResponse("NOT_FOUND", "SMTP δεν έχει ρυθμιστεί"), { status: 404 })

  try {
    const t = nodemailer.createTransport({
      host: smtp.host, port: smtp.port, secure: smtp.useTls && smtp.port === 465,
      auth: { user: smtp.username, pass: decryptIfExists(smtp.passwordEncrypted) || "" },
    })
    await t.verify()
    await t.sendMail({
      from: `"${smtp.fromName}" <${smtp.fromEmail}>`,
      to: testEmail,
      subject: "[TEST] ErgoHub SMTP Test",
      html: "<h1>✅ SMTP λειτουργεί σωστά!</h1><p>Το email στάλθηκε επιτυχώς από το ErgoHub.</p>",
    })
    return NextResponse.json(successResponse({ sent: true }))
  } catch (err: any) {
    return NextResponse.json(errorResponse("SMTP_ERROR", err.message), { status: 400 })
  }
}
