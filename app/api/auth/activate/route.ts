import { NextRequest, NextResponse } from "next/server"
import { masterPrisma } from "@/lib/prisma/master"
import { getTenantPrisma } from "@/lib/prisma/tenant"
import { successResponse, errorResponse } from "@/types/api"
import { encryptIfExists } from "@/lib/encryption"
import bcrypt from "bcryptjs"
import { z } from "zod"

// Public route — no auth required
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token")
    const subdomain = req.headers.get("x-tenant-subdomain")
    if (!token || !subdomain) return NextResponse.json(errorResponse("INVALID", "Άκυρος σύνδεσμος"), { status: 400 })

    const tenant = await masterPrisma.tenant.findUnique({ where: { subdomain } })
    if (!tenant) return NextResponse.json(errorResponse("NOT_FOUND", "Tenant δεν βρέθηκε"), { status: 404 })

    const db = getTenantPrisma(tenant.dbName)
    const user = await db.user.findUnique({ where: { inviteToken: token } })
    if (!user) return NextResponse.json(errorResponse("INVALID_TOKEN", "Άκυρος σύνδεσμος"), { status: 400 })
    if (user.inviteExpiry && user.inviteExpiry < new Date()) {
      return NextResponse.json(errorResponse("EXPIRED_TOKEN", "Ο σύνδεσμος έχει λήξει"), { status: 400 })
    }
    return NextResponse.json(successResponse({ valid: true, name: user.name, email: user.email }))
  } catch (err) {
    console.error("[Activate GET]", err)
    return NextResponse.json(errorResponse("SERVER_ERROR", "Σφάλμα"), { status: 500 })
  }
}

const schema = z.object({
  token: z.string(),
  password: z.string().min(8),
  personalData: z.object({
    afm: z.string().optional(),
    amka: z.string().optional(),
    dateOfBirth: z.string().optional(),
    address: z.string().optional(),
    iban: z.string().optional(),
    nationality: z.string().optional(),
    emergencyName: z.string().optional(),
    emergencyPhone: z.string().optional(),
  }).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const subdomain = req.headers.get("x-tenant-subdomain")
    if (!subdomain) return NextResponse.json(errorResponse("INVALID", "Άκυρο αίτημα"), { status: 400 })

    const tenant = await masterPrisma.tenant.findUnique({ where: { subdomain } })
    if (!tenant) return NextResponse.json(errorResponse("NOT_FOUND", "Tenant δεν βρέθηκε"), { status: 404 })

    const db = getTenantPrisma(tenant.dbName)
    const body = await req.json()
    const data = schema.safeParse(body)
    if (!data.success) return NextResponse.json(errorResponse("VALIDATION_ERROR", "Σφάλμα"), { status: 400 })

    const { token, password, personalData } = data.data
    const user = await db.user.findUnique({ where: { inviteToken: token } })
    if (!user || (user.inviteExpiry && user.inviteExpiry < new Date())) {
      return NextResponse.json(errorResponse("INVALID_TOKEN", "Άκυρος σύνδεσμος"), { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash, inviteToken: null, inviteExpiry: null, isActive: true },
    })

    if (personalData) {
      const emp = await db.employee.findUnique({ where: { userId: user.id } })
      if (emp) {
        await db.employeePersonal.upsert({
          where: { employeeId: emp.id },
          create: {
            employeeId: emp.id,
            afm: encryptIfExists(personalData.afm),
            amka: encryptIfExists(personalData.amka),
            dateOfBirth: personalData.dateOfBirth ? new Date(personalData.dateOfBirth) : null,
            address: personalData.address,
            iban: encryptIfExists(personalData.iban),
            nationality: encryptIfExists(personalData.nationality),
            emergencyName: personalData.emergencyName,
            emergencyPhone: personalData.emergencyPhone,
          },
          update: {
            afm: encryptIfExists(personalData.afm),
            amka: encryptIfExists(personalData.amka),
            dateOfBirth: personalData.dateOfBirth ? new Date(personalData.dateOfBirth) : null,
            address: personalData.address,
            iban: encryptIfExists(personalData.iban),
            nationality: encryptIfExists(personalData.nationality),
            emergencyName: personalData.emergencyName,
            emergencyPhone: personalData.emergencyPhone,
          },
        })
      }
    }

    return NextResponse.json(successResponse({ activated: true }))
  } catch (err) {
    console.error("[Activate POST]", err)
    return NextResponse.json(errorResponse("SERVER_ERROR", "Σφάλμα"), { status: 500 })
  }
}
