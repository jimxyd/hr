import cron from "node-cron"
import { trialExpiryCheck } from "./trial-expiry"
import { leaveBalanceReminders, contractExpiryReminders } from "./leave-reminders"
import { holidayAutoLoader } from "./holiday-loader"

let initialized = false

export function initCronJobs() {
  if (initialized) return
  initialized = true

  // Daily 08:00 — Trial expiry check + auto-suspend
  cron.schedule("0 8 * * *", async () => {
    console.log("[CRON] Trial expiry check...")
    await trialExpiryCheck().catch(console.error)
  })

  // Daily 09:00 — Leave balance reminders
  cron.schedule("0 9 * * *", async () => {
    console.log("[CRON] Leave balance reminders...")
    await leaveBalanceReminders().catch(console.error)
  })

  // Daily 09:30 — Contract expiry reminders
  cron.schedule("30 9 * * *", async () => {
    console.log("[CRON] Contract expiry reminders...")
    await contractExpiryReminders().catch(console.error)
  })

  // Every Jan 1 at 00:01 — Load holidays for new year
  cron.schedule("1 0 1 1 *", async () => {
    console.log("[CRON] Loading holidays for new year...")
    await holidayAutoLoader().catch(console.error)
  })

  console.log("✅ Cron jobs initialized (4 jobs)")
}
