import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { masterPrisma } from "@/lib/prisma/master"
import { createTenantDatabase, getTenantPrisma } from "@/lib/prisma/tenant"
import { sendEmail } from "@/lib/email/client"
import { successResponse, errorResponse } from "@/types/api"
import { getGreekHolidays } from "@/lib/utils/holidays"

const registerSchema = z.object({
  companyName: z.string().min(2, "Τουλάχιστον 2 χαρακτήρες"),
  subdomain: z.string()
    .min(3, "Τουλάχιστον 3 χαρακτήρες")
    .max(30, "Μέγιστο 30 χαρακτήρες")
    .regex(/^[a-z0-9-]+$/, "Μόνο πεζά γράμματα, αριθμοί και παύλα")
    .refine(s => !["admin","www","api","mail","smtp","ftp","dev","staging","app"].includes(s), {
      message: "Αυτό το subdomain είναι δεσμευμένο"
    }),
  adminName: z.string().min(2),
  adminEmail: z.string().email("Μη έγκυρο email"),
  adminPassword: z.string().min(8, "Τουλάχιστον 8 χαρακτήρες"),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = registerSchema.safeParse(body)

    if (!data.success) {
      return NextResponse.json(
        errorResponse("VALIDATION_ERROR", "Σφάλμα επικύρωσης", 
          Object.fromEntries(data.error.errors.map(e => [e.path.join("."), e.message]))
        ), { status: 400 }
      )
    }

    const { companyName, subdomain, adminName, adminEmail, adminPassword } = data.data

    // Check subdomain availability
    const existing = await masterPrisma.tenant.findUnique({ where: { subdomain } })
    if (existing) {
      return NextResponse.json(
        errorResponse("SUBDOMAIN_TAKEN", "Αυτό το subdomain είναι ήδη σε χρήση"),
        { status: 409 }
      )
    }

    const dbName = `ergohub_${subdomain.replace(/-/g, "_")}`
    const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    // Create tenant in master DB
    const tenant = await masterPrisma.tenant.create({
      data: {
        name: companyName,
        subdomain,
        status: "TRIAL",
        trialEndsAt,
        dbName,
        activeModules: ["M1", "M2"],
      },
    })

    // Create tenant database + run migrations
    await createTenantDatabase(dbName)

    // Seed tenant DB
    const tenantDb = getTenantPrisma(dbName)
    
    // Create admin user
    const passwordHash = await bcrypt.hash(adminPassword, 12)
    const user = await tenantDb.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        passwordHash,
        role: ["ADMIN"],
        isActive: true,
      },
    })

    // Create branding
    await tenantDb.tenantBranding.create({
      data: { companyName, primaryColor: "#2E5FA3" }
    })

    // Create default leave types
    await tenantDb.leaveType.createMany({
      data: [
        { name: "Κανονική Άδεια", code: "ANNUAL", deductsBalance: true, requiresApproval: true, color: "#2E5FA3" },
        { name: "Άδεια Ασθενείας", code: "SICK", deductsBalance: false, requiresApproval: false, color: "#E53E3E" },
        { name: "Άδεια Μητρότητας", code: "MATERNITY", deductsBalance: false, requiresApproval: true, color: "#D69E2E" },
        { name: "Άδεια Πατρότητας", code: "PATERNITY", deductsBalance: false, requiresApproval: true, color: "#38A169" },
      ]
    })

    // Seed Greek holidays for current year
    const year = new Date().getFullYear()
    const holidays = getGreekHolidays(year)
    await tenantDb.holiday.createMany({
      data: holidays.map(h => ({
        name: h.name,
        date: h.date,
        year,
        isRecurring: h.isRecurring,
        type: "NATIONAL",
      }))
    })

    // Create default expense categories
    await tenantDb.expenseCategory.createMany({
      data: [
        { name: "Μετακίνηση", code: "TRANSPORT", isSystem: true, sortOrder: 1 },
        { name: "Εστίαση", code: "MEALS", isSystem: true, sortOrder: 2 },
        { name: "Διαμονή", code: "ACCOMMODATION", isSystem: true, sortOrder: 3 },
        { name: "Εξοπλισμός", code: "EQUIPMENT", isSystem: true, sortOrder: 4 },
        { name: "Εκπαίδευση", code: "TRAINING", isSystem: true, sortOrder: 5 },
        { name: "Τηλεφωνία", code: "PHONE", isSystem: true, sortOrder: 6 },
        { name: "Αναλώσιμα", code: "SUPPLIES", isSystem: true, sortOrder: 7 },
      ]
    })

    // Create default asset types
    await tenantDb.assetType.createMany({
      data: [
        { name: "Laptop / Desktop", icon: "💻", requiresSerial: true, isSystem: true, sortOrder: 1 },
        { name: "Κινητό / Tablet", icon: "📱", requiresSerial: true, isSystem: true, sortOrder: 2 },
        { name: "Κλειδιά", icon: "🔑", requiresSerial: false, isSystem: true, sortOrder: 3 },
        { name: "Κάρτες", icon: "💳", requiresSerial: false, isSystem: true, sortOrder: 4 },
        { name: "Εταιρικό Όχημα", icon: "🚗", requiresSerial: true, isSharedAllowed: true, isSystem: true, sortOrder: 5 },
        { name: "Περιφερειακά", icon: "🎧", requiresSerial: false, isSystem: true, sortOrder: 6 },
        { name: "Στολή / Ρουχισμός", icon: "👗", requiresSerial: false, isSystem: true, sortOrder: 7 },
        { name: "Εργαλεία", icon: "🔧", requiresSerial: false, isSystem: true, sortOrder: 8 },
      ]
    })

    // Create default system settings
    await tenantDb.systemSetting.createMany({
      data: [
        { settingKey: "leave_expiry_date", settingValue: "03-31" },
        { settingKey: "reminder_days_before_expiry", settingValue: "60,30,15" },
        { settingKey: "max_absent_pct", settingValue: "40" },
        { settingKey: "trial_ends_at", settingValue: trialEndsAt.toISOString() },
      ]
    })

    // Send welcome email
    try {
      const domain = process.env.NEXT_PUBLIC_DOMAIN || "ergohub.gr"
      await sendEmail({
        to: adminEmail,
        subject: `Καλωσήλθατε στο ErgoHub — ${companyName}`,
        html: `
          <h1>Καλωσήλθατε στο ErgoHub!</h1>
          <p>Ο λογαριασμός σας για την εταιρεία <strong>${companyName}</strong> δημιουργήθηκε επιτυχώς.</p>
          <p><strong>Subdomain:</strong> ${subdomain}.${domain}</p>
          <p><strong>Trial λήγει:</strong> ${trialEndsAt.toLocaleDateString("el-GR")}</p>
          <p><a href="https://${subdomain}.${domain}/login" style="background:#2E5FA3;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">Σύνδεση στο ErgoHub</a></p>
        `,
      })
    } catch (emailError) {
      console.error("Welcome email failed:", emailError)
      // Don't fail registration if email fails
    }

    return NextResponse.json(
      successResponse({
        tenantId: tenant.id,
        subdomain,
        trialEndsAt,
        loginUrl: `https://${subdomain}.${process.env.NEXT_PUBLIC_DOMAIN || "ergohub.gr"}/login`,
      }),
      { status: 201 }
    )
  } catch (error) {
    console.error("Tenant registration error:", error)
    return NextResponse.json(
      errorResponse("SERVER_ERROR", "Σφάλμα κατά τη δημιουργία λογαριασμού"),
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  // Check subdomain availability
  const subdomain = req.nextUrl.searchParams.get("subdomain")
  if (!subdomain) {
    return NextResponse.json(errorResponse("MISSING_PARAM", "Απαιτείται subdomain"), { status: 400 })
  }
  const existing = await masterPrisma.tenant.findUnique({ where: { subdomain } })
  return NextResponse.json(successResponse({ available: !existing }))
}
