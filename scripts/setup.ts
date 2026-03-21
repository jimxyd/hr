import { PrismaClient } from "@prisma/master-client"
import bcrypt from "bcryptjs"
import { execSync } from "child_process"

const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } })

async function setup() {
  console.log("\n🚀 ErgoHub Setup Script")
  console.log("=" .repeat(40))

  // 1. Create master database and run migrations
  console.log("\n1️⃣  Running master database migrations...")
  try {
    execSync("npx prisma migrate deploy --schema=prisma/master/schema.prisma", { stdio: "inherit" })
    console.log("✅ Master database ready")
  } catch (e) {
    console.error("❌ Migration failed:", e)
    process.exit(1)
  }

  // 2. Create default plans
  console.log("\n2️⃣  Creating default plans...")
  await prisma.plan.upsert({
    where: { id: "plan_basic" },
    create: {
      id: "plan_basic",
      name: "Basic",
      description: "Leave Management + HR Core + Announcements",
      pricePerUser: 0,
      modulesIncluded: ["M1", "M2"],
    },
    update: {}
  })
  await prisma.plan.upsert({
    where: { id: "plan_performance" },
    create: {
      id: "plan_performance",
      name: "Performance Add-on",
      description: "Performance Reviews module",
      pricePerUser: 0,
      modulesIncluded: ["M3"],
    },
    update: {}
  })
  await prisma.plan.upsert({
    where: { id: "plan_expenses" },
    create: {
      id: "plan_expenses",
      name: "Expenses Add-on",
      description: "Expense Management module",
      pricePerUser: 0,
      modulesIncluded: ["M5"],
    },
    update: {}
  })
  await prisma.plan.upsert({
    where: { id: "plan_assets" },
    create: {
      id: "plan_assets",
      name: "Assets Add-on",
      description: "Asset Management module",
      pricePerUser: 0,
      modulesIncluded: ["M6"],
    },
    update: {}
  })
  console.log("✅ Plans created")

  // 3. Create default email templates
  console.log("\n3️⃣  Creating email templates...")
  const templates = [
    {
      triggerEvent: "WELCOME",
      subject: "Καλωσήλθατε στο ErgoHub!",
      bodyHtml: "<h1>Καλωσήλθατε!</h1><p>Ο λογαριασμός σας δημιουργήθηκε επιτυχώς.</p>",
      variables: ["name", "company", "loginUrl"],
    },
    {
      triggerEvent: "ACCOUNT_ACTIVATION",
      subject: "Ενεργοποίηση λογαριασμού ErgoHub",
      bodyHtml: "<h1>Ενεργοποιήστε τον λογαριασμό σας</h1><p>Κάντε κλικ στον παρακάτω σύνδεσμο: <a href='{{activationUrl}}'>Ενεργοποίηση</a></p>",
      variables: ["name", "activationUrl"],
    },
    {
      triggerEvent: "LEAVE_SUBMITTED",
      subject: "Νέο αίτημα άδειας από {{employeeName}}",
      bodyHtml: "<h1>Νέο αίτημα άδειας</h1><p>Ο/Η {{employeeName}} υπέβαλε αίτημα άδειας.</p>",
      variables: ["employeeName", "startDate", "endDate", "days", "approvalUrl"],
    },
    {
      triggerEvent: "LEAVE_APPROVED",
      subject: "Η άδειά σας εγκρίθηκε ✅",
      bodyHtml: "<h1>Εγκρίθηκε!</h1><p>Η άδειά σας από {{startDate}} έως {{endDate}} εγκρίθηκε.</p>",
      variables: ["name", "startDate", "endDate", "days"],
    },
    {
      triggerEvent: "LEAVE_REJECTED",
      subject: "Η άδειά σας απορρίφθηκε",
      bodyHtml: "<h1>Απορρίφθηκε</h1><p>Η άδειά σας απορρίφθηκε. Λόγος: {{reason}}</p>",
      variables: ["name", "reason"],
    },
    {
      triggerEvent: "TRIAL_EXPIRY_7",
      subject: "Η δοκιμαστική περίοδός σας λήγει σε 7 ημέρες",
      bodyHtml: "<h1>Προσοχή!</h1><p>Η δοκιμαστική περίοδος του {{company}} λήγει σε 7 ημέρες.</p>",
      variables: ["company", "expiryDate", "upgradeUrl"],
    },
    {
      triggerEvent: "TRIAL_EXPIRY_3",
      subject: "Η δοκιμαστική περίοδός σας λήγει σε 3 ημέρες",
      bodyHtml: "<h1>Τελευταία υπενθύμιση!</h1><p>Η δοκιμαστική περίοδος λήγει σε 3 ημέρες.</p>",
      variables: ["company", "expiryDate", "upgradeUrl"],
    },
    {
      triggerEvent: "EXPENSE_SUBMITTED",
      subject: "Νέο expense report από {{employeeName}}",
      bodyHtml: "<h1>Νέο Expense Report</h1><p>{{employeeName}} υπέβαλε expense report {{reportNumber}}.</p>",
      variables: ["employeeName", "reportNumber", "totalAmount", "approvalUrl"],
    },
    {
      triggerEvent: "EXPENSE_APPROVED",
      subject: "Το expense report σας εγκρίθηκε ✅",
      bodyHtml: "<h1>Εγκρίθηκε!</h1><p>Το expense report {{reportNumber}} εγκρίθηκε.</p>",
      variables: ["name", "reportNumber", "totalAmount"],
    },
  ]

  for (const t of templates) {
    await prisma.emailTemplate.upsert({
      where: { triggerEvent: t.triggerEvent },
      create: { ...t, module: "platform" },
      update: {}
    })
  }
  console.log(`✅ ${templates.length} email templates created`)

  // 4. Create Super Admin
  console.log("\n4️⃣  Creating Super Admin...")
  const adminEmail = process.env.SUPER_ADMIN_EMAIL
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD
  const adminName = process.env.SUPER_ADMIN_NAME || "Super Admin"

  if (!adminEmail || !adminPassword) {
    console.log("⚠️  SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD not set in .env — skipping")
  } else {
    const existing = await prisma.superAdmin.findUnique({ where: { email: adminEmail } })
    if (existing) {
      console.log("ℹ️  Super Admin already exists — skipping")
    } else {
      const hash = await bcrypt.hash(adminPassword, 12)
      await prisma.superAdmin.create({
        data: { name: adminName, email: adminEmail, passwordHash: hash }
      })
      console.log(`✅ Super Admin created: ${adminEmail}`)
    }
  }

  console.log("\n" + "=".repeat(40))
  console.log("✅ Setup complete! ErgoHub is ready.")
  console.log("\n📋 Next steps:")
  console.log("   1. Copy .env.example to .env and fill in your values")
  console.log("   2. Run: npm run dev")
  console.log("   3. Open: http://localhost:3000")
  console.log("   4. Super Admin: http://admin.localhost:3000")
  console.log("=".repeat(40) + "\n")
}

setup()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
