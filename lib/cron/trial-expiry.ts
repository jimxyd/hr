import { masterPrisma } from "@/lib/prisma/master"
import { sendEmail } from "@/lib/email/client"

export async function trialExpiryCheck() {
  const now = new Date()
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const domain = process.env.NEXT_PUBLIC_DOMAIN || "ergohub.gr"

  // Find tenants expiring in 7 days
  const expiring7 = await masterPrisma.tenant.findMany({
    where: {
      status: "TRIAL",
      trialEndsAt: {
        gte: new Date(in7Days.getFullYear(), in7Days.getMonth(), in7Days.getDate()),
        lt: new Date(in7Days.getFullYear(), in7Days.getMonth(), in7Days.getDate() + 1),
      }
    }
  })

  for (const tenant of expiring7) {
    console.log(`[CRON] Sending 7-day trial reminder to ${tenant.subdomain}`)
    // In real app, get admin email from tenant DB
  }

  // Find tenants expiring in 3 days
  const expiring3 = await masterPrisma.tenant.findMany({
    where: {
      status: "TRIAL",
      trialEndsAt: {
        gte: new Date(in3Days.getFullYear(), in3Days.getMonth(), in3Days.getDate()),
        lt: new Date(in3Days.getFullYear(), in3Days.getMonth(), in3Days.getDate() + 1),
      }
    }
  })

  for (const tenant of expiring3) {
    console.log(`[CRON] Sending 3-day trial reminder to ${tenant.subdomain}`)
  }

  // Auto-suspend expired tenants
  const expired = await masterPrisma.tenant.updateMany({
    where: {
      status: "TRIAL",
      trialEndsAt: { lt: now }
    },
    data: { status: "SUSPENDED" }
  })

  if (expired.count > 0) {
    console.log(`[CRON] Auto-suspended ${expired.count} expired tenants`)
  }
}
