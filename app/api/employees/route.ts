import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { getTenantPrisma } from "@/lib/prisma/tenant"
import { successResponse, errorResponse } from "@/types/api"
import { z } from "zod"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { sendEmail } from "@/lib/email/client"
import { encryptIfExists } from "@/lib/encryption"
import { getLeaveDaysEntitlement, calculateSeniority } from "@/lib/utils/dates"
import { anyRoleFilter } from "@/lib/utils/roles"

async function getTenantDb(session: any) {
  if (!session?.user?.tenantDbName) throw new Error("No tenant DB")
  return getTenantPrisma(session.user.tenantDbName)
}

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  departmentId: z.string().optional(),
  title: z.string().optional(),
  positionLevel: z.string().default("EMPLOYEE"),
  reportsToId: z.string().optional(),
  contractType: z.enum(["INDEFINITE", "FIXED_TERM", "PROJECT"]).default("INDEFINITE"),
  contractStart: z.string(),
  contractEnd: z.string().optional(),
  employmentType: z.enum(["EMPLOYEE", "FREELANCER", "INTERN"]).default("EMPLOYEE"),
  hoursPerWeek: z.number().default(40),
  daysPerWeek: z.number().default(5),
  salaryGross: z.string().optional(),
  salaryNet: z.string().optional(),
  role: z.array(z.string()).default(["EMPLOYEE"]),
  sendInvite: z.boolean().default(true),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json(errorResponse("UNAUTHORIZED", "Μη εξουσιοδοτημένο"), { status: 401 })

  const db = await getTenantDb(session)
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1")
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20")
  const search = req.nextUrl.searchParams.get("search") || ""
  const departmentId = req.nextUrl.searchParams.get("departmentId")
  const isActive = req.nextUrl.searchParams.get("isActive")

  const where: any = {}
  if (search) where.OR = [{ name: { contains: search } }, { email: { contains: search } }]
  if (departmentId) where.departmentId = departmentId
  if (isActive !== null) where.isActive = isActive === "true"

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      include: {
        department: true,
        employee: { select: { title: true, positionLevel: true, contractType: true, contractStart: true, hoursPerWeek: true } }
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.user.count({ where }),
  ])

  // Remove sensitive data
  const safe = users.map(({ passwordHash, totpSecret, inviteToken, ...u }) => u)
  return NextResponse.json(successResponse(safe, { total, page, limit }))
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const roles = session?.user?.role as string[] || []
  if (!roles.some(r => ["ADMIN", "HR"].includes(r))) {
    return NextResponse.json(errorResponse("FORBIDDEN", "Δεν έχετε δικαίωμα"), { status: 403 })
  }

  const db = await getTenantDb(session)
  const body = await req.json()
  const data = createSchema.safeParse(body)
  if (!data.success) {
    return NextResponse.json(
      errorResponse("VALIDATION_ERROR", "Σφάλμα επικύρωσης",
        Object.fromEntries(data.error.errors.map(e => [e.path.join("."), e.message]))
      ), { status: 400 }
    )
  }

  const d = data.data

  // Check email uniqueness
  const existing = await db.user.findUnique({ where: { email: d.email } })
  if (existing) return NextResponse.json(errorResponse("EMAIL_EXISTS", "Το email υπάρχει ήδη"), { status: 409 })

  // Generate invite token
  const inviteToken = crypto.randomBytes(32).toString("hex")
  const inviteExpiry = new Date(Date.now() + 72 * 60 * 60 * 1000) // 72 hours

  // Create user with temp password
  const tempPassword = crypto.randomBytes(16).toString("hex")
  const passwordHash = await bcrypt.hash(tempPassword, 12)

  const user = await db.user.create({
    data: {
      name: d.name,
      email: d.email,
      passwordHash,
      role: d.role,
      departmentId: d.departmentId,
      isActive: true,
      inviteToken,
      inviteExpiry,
    }
  })

  // Calculate leave entitlement based on seniority
  const seniority = calculateSeniority(d.contractStart)
  const leaveDays = getLeaveDaysEntitlement(seniority)

  // Create employee record
  await db.employee.create({
    data: {
      userId: user.id,
      title: d.title,
      positionLevel: d.positionLevel,
      reportsToId: d.reportsToId,
      contractType: d.contractType as any,
      contractStart: new Date(d.contractStart),
      contractEnd: d.contractEnd ? new Date(d.contractEnd) : null,
      employmentType: d.employmentType as any,
      hoursPerWeek: d.hoursPerWeek,
      daysPerWeek: d.daysPerWeek,
      salaryGross: encryptIfExists(d.salaryGross),
      salaryNet: encryptIfExists(d.salaryNet),
      leaveDaysPerYear: leaveDays,
    }
  })

  // Create leave allocation for current year
  const currentYear = new Date().getFullYear()
  const annualLeaveType = await db.leaveType.findFirst({ where: { code: "ANNUAL" } })
  if (annualLeaveType) {
    await db.leaveAllocation.create({
      data: {
        employeeId: user.id,
        year: currentYear,
        leaveTypeId: annualLeaveType.id,
        entitledDays: leaveDays,
        carriedOver: 0,
        usedDays: 0,
      }
    })
  }

  // Send invite email
  if (d.sendInvite) {
    const domain = process.env.NEXT_PUBLIC_DOMAIN || "ergohub.gr"
    const subdomain = session.user.tenantSubdomain
    const activationUrl = `https://${subdomain}.${domain}/activate?token=${inviteToken}`

    try {
      await sendEmail({
        to: d.email,
        subject: "Πρόσκληση στο ErgoHub",
        html: `
          <h1>Καλωσήλθατε!</h1>
          <p>Γεια σας <strong>${d.name}</strong>,</p>
          <p>Δημιουργήθηκε λογαριασμός για εσάς στο ErgoHub.</p>
          <p>Κάντε κλικ για να ενεργοποιήσετε τον λογαριασμό σας:</p>
          <p><a href="${activationUrl}" style="background:#2E5FA3;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Ενεργοποίηση Λογαριασμού</a></p>
          <p><small>Ο σύνδεσμος λήγει σε 72 ώρες.</small></p>
        `,
      })
    } catch (e) {
      console.error("Invite email failed:", e)
    }
  }

  // Audit log
  await db.auditLog.create({
    data: {
      userId: session.user.id,
      module: "HR_CORE",
      action: "EMPLOYEE_CREATED",
      entityType: "user",
      entityId: user.id,
      newValue: { name: d.name, email: d.email, role: d.role },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    }
  })

  const { passwordHash: _, inviteToken: __, ...safeUser } = user
  return NextResponse.json(successResponse(safeUser), { status: 201 })
}
