import { masterPrisma } from "@/lib/prisma/master"
import { getTenantPrisma } from "@/lib/prisma/tenant"
import { getGreekHolidays } from "@/lib/utils/holidays"

export async function holidayAutoLoader() {
  const year = new Date().getFullYear()
  const tenants = await masterPrisma.tenant.findMany({ where: { status: "ACTIVE" } })
  const holidays = getGreekHolidays(year)

  for (const tenant of tenants) {
    try {
      const db = getTenantPrisma(tenant.dbName)
      // Remove old national holidays for year and re-add
      await db.holiday.deleteMany({ where: { year, type: "NATIONAL" } })
      await db.holiday.createMany({
        data: holidays.map(h => ({
          name: h.name,
          date: h.date,
          year,
          isRecurring: h.isRecurring,
          type: "NATIONAL" as any,
        }))
      })
      console.log(`[CRON] Loaded ${holidays.length} holidays for ${tenant.subdomain} (${year})`)
    } catch (err) {
      console.error(`Holiday loader error for ${tenant.subdomain}:`, err)
    }
  }
}
