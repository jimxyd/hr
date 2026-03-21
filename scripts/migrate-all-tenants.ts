import { PrismaClient } from "@prisma/master-client"
import { execSync } from "child_process"

const prisma = new PrismaClient()

async function migrateAllTenants() {
  const tenants = await prisma.tenant.findMany({ select: { subdomain: true, dbName: true } })
  console.log(`Migrating ${tenants.length} tenant databases...`)

  for (const tenant of tenants) {
    console.log(`\nMigrating: ${tenant.subdomain} (${tenant.dbName})`)
    try {
      execSync(
        `TENANT_DATABASE_URL="${process.env.TENANT_DATABASE_BASE_URL}/${tenant.dbName}" npx prisma migrate deploy --schema=prisma/tenant/schema.prisma`,
        { stdio: "inherit" }
      )
      console.log(`✅ ${tenant.subdomain} migrated`)
    } catch (error) {
      console.error(`❌ Failed to migrate ${tenant.subdomain}:`, error)
    }
  }
}

migrateAllTenants()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
