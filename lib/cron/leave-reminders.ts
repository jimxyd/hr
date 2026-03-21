import { masterPrisma } from "@/lib/prisma/master"
import { getTenantPrisma } from "@/lib/prisma/tenant"
import { sendTenantEmail } from "@/lib/email/sender"

export async function leaveBalanceReminders() {
  const tenants = await masterPrisma.tenant.findMany({ where: { status: "ACTIVE" } })
  const currentYear = new Date().getFullYear()

  for (const tenant of tenants) {
    try {
      const db = getTenantPrisma(tenant.dbName)
      
      // Get system settings for reminder days
      const reminderSetting = await db.systemSetting.findUnique({
        where: { settingKey: "reminder_days_before_expiry" }
      })
      const reminderDays = (reminderSetting?.settingValue || "60,30,15").split(",").map(Number)
      
      const expirySetting = await db.systemSetting.findUnique({
        where: { settingKey: "leave_expiry_date" }
      })
      const [expMonth, expDay] = (expirySetting?.settingValue || "03-31").split("-").map(Number)
      const expiryDate = new Date(currentYear + 1, expMonth - 1, expDay)
      
      const today = new Date()
      const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / 86400000)

      if (!reminderDays.includes(daysUntilExpiry)) continue

      // Find employees with remaining balance
      const allocations = await db.leaveAllocation.findMany({
        where: { year: currentYear, leaveType: { deductsBalance: true } },
        include: {
          employee: { include: { user: { select: { email: true, name: true } } } },
          leaveType: true,
        }
      })

      for (const alloc of allocations) {
        const remaining = alloc.entitledDays + alloc.carriedOver - alloc.usedDays
        if (remaining <= 0) continue

        await sendTenantEmail({
          tenantDbName: tenant.dbName,
          triggerEvent: "LEAVE_EXPIRY_REMINDER",
          to: alloc.employee.user.email,
          variables: {
            name: alloc.employee.user.name,
            remainingDays: String(remaining),
            leaveType: alloc.leaveType.name,
            expiryDate: expiryDate.toLocaleDateString("el-GR"),
            daysUntilExpiry: String(daysUntilExpiry),
          },
        })
      }
    } catch (err) {
      console.error(`Leave reminder error for ${tenant.subdomain}:`, err)
    }
  }
}

export async function contractExpiryReminders() {
  const tenants = await masterPrisma.tenant.findMany({ where: { status: "ACTIVE" } })
  const today = new Date()
  const in30 = new Date(today.getTime() + 30 * 86400000)
  const in15 = new Date(today.getTime() + 15 * 86400000)
  const in7 = new Date(today.getTime() + 7 * 86400000)

  for (const tenant of tenants) {
    try {
      const db = getTenantPrisma(tenant.dbName)
      
      const expiringContracts = await db.employee.findMany({
        where: {
          contractEnd: {
            gte: today,
            lte: in30,
          },
          contractType: { in: ["FIXED_TERM", "PROJECT"] },
        },
        include: { user: { select: { name: true, email: true } } }
      })

      // Notify HR/Admin
      const hrUsers = await db.user.findMany({
        where: { isActive: true, role: { string_contains: "HR" } },
        select: { email: true }
      })

      for (const emp of expiringContracts) {
        const daysLeft = Math.floor((emp.contractEnd!.getTime() - today.getTime()) / 86400000)
        
        for (const hr of hrUsers) {
          await sendTenantEmail({
            tenantDbName: tenant.dbName,
            triggerEvent: "CONTRACT_EXPIRY",
            to: hr.email,
            variables: {
              employeeName: emp.user.name,
              expiryDate: emp.contractEnd!.toLocaleDateString("el-GR"),
              daysLeft: String(daysLeft),
            },
          })
        }

        // Also create in-app notification
        await db.notification.create({
          data: {
            userId: emp.userId,
            type: "CONTRACT_EXPIRY",
            title: "Η σύμβασή σας λήγει σύντομα",
            body: `Η σύμβασή σας λήγει σε ${daysLeft} ημέρες (${emp.contractEnd!.toLocaleDateString("el-GR")})`,
            entityType: "employee",
            entityId: emp.id,
          }
        }).catch(() => {})
      }
    } catch (err) {
      console.error(`Contract reminder error for ${tenant.subdomain}:`, err)
    }
  }
}
