import { PrismaClient } from "@prisma/tenant-client"
import { execSync } from "child_process"
import logger from "@/lib/utils/logger"

const tenantClients = new Map<string, PrismaClient>()

export function getTenantPrisma(dbName: string): PrismaClient {
  if (!dbName) throw new Error("getTenantPrisma: dbName is required")

  if (!tenantClients.has(dbName)) {
    const baseUrl = process.env.TENANT_DATABASE_BASE_URL
    if (!baseUrl) throw new Error("TENANT_DATABASE_BASE_URL not configured")

    const client = new PrismaClient({
      datasources: { db: { url: `${baseUrl}/${dbName}` } },
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    })
    tenantClients.set(dbName, client)
    logger.debug(`Created Prisma client for tenant: ${dbName}`)
  }

  return tenantClients.get(dbName)!
}

export async function createTenantDatabase(dbName: string): Promise<void> {
  const baseUrl = process.env.TENANT_DATABASE_BASE_URL
  if (!baseUrl) throw new Error("TENANT_DATABASE_BASE_URL not configured")

  const url = new URL(baseUrl.replace("mysql://", "http://"))
  const host = url.hostname
  const port = url.port || "3306"
  const user = decodeURIComponent(url.username)
  const password = decodeURIComponent(url.password)

  logger.info(`Creating tenant database: ${dbName}`)

  try {
    execSync(
      `mysql -h ${host} -P ${port} -u ${user} ${password ? `-p${password}` : ""} -e "CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"`,
      { stdio: "pipe" }
    )

    execSync(
      `TENANT_DATABASE_URL="${baseUrl}/${dbName}" npx prisma migrate deploy --schema=prisma/tenant/schema.prisma`,
      { stdio: "inherit" }
    )

    logger.info(`✅ Tenant database '${dbName}' created and migrated`)
  } catch (err) {
    logger.error(`Failed to create tenant database '${dbName}'`, err)
    throw err
  }
}

export async function tenantDbExists(dbName: string): Promise<boolean> {
  try {
    const client = getTenantPrisma(dbName)
    await client.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}
