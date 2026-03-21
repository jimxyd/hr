import { PrismaClient } from "@prisma/master-client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding master database...")

  // Create demo tenant for local development
  const hash = await bcrypt.hash("demo123", 12)
  
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: "demo" },
    create: {
      name: "Demo Company",
      subdomain: "demo",
      status: "TRIAL",
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      dbName: "ergohub_demo",
      activeModules: ["M1", "M2"],
    },
    update: {},
  })

  console.log("✅ Demo tenant created:", tenant.subdomain)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
