import { sendEmail } from "./client"
import { masterPrisma } from "@/lib/prisma/master"
import { getTenantPrisma } from "@/lib/prisma/tenant"

// Replace template variables {{varName}} with actual values
function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || `{{${key}}}`)
}

interface SendTenantEmailOptions {
  tenantDbName: string
  triggerEvent: string
  to: string | string[]
  variables?: Record<string, string>
  attachments?: Array<{ filename: string; content: Buffer; contentType: string }>
  replyTo?: string
}

export async function sendTenantEmail(opts: SendTenantEmailOptions): Promise<void> {
  const { tenantDbName, triggerEvent, to, variables = {}, attachments, replyTo } = opts

  // Get template from master DB
  const template = await masterPrisma.emailTemplate.findUnique({
    where: { triggerEvent }
  })
  if (!template || !template.isActive) return

  // Get tenant SMTP settings (if custom)
  const tenantDb = getTenantPrisma(tenantDbName)
  const smtpSettings = await tenantDb.smtpSettings.findFirst({
    where: { isCustom: true, isActive: true }
  })

  // Get tenant branding for from name
  const branding = await tenantDb.tenantBranding.findFirst()
  const companyName = branding?.companyName || "ErgoHub"

  const subject = interpolate(template.subject, variables)
  const html = interpolate(template.bodyHtml, {
    ...variables,
    companyName,
    year: new Date().getFullYear().toString(),
  })

  const customSmtp = smtpSettings ? {
    host: smtpSettings.host,
    port: smtpSettings.port,
    user: smtpSettings.username,
    pass: smtpSettings.passwordEncrypted, // Should be decrypted
    tls: smtpSettings.useTls,
  } : undefined

  await sendEmail({
    to,
    subject,
    html,
    from: smtpSettings
      ? `"HR ${companyName}" <${smtpSettings.fromEmail}>`
      : `"HR ${companyName}" <noreply@ergohub.gr>`,
    replyTo: replyTo || smtpSettings?.fromEmail,
    attachments,
  }, customSmtp)
}

// Convenience functions for each trigger event
export async function sendLeaveApprovedEmail(opts: {
  tenantDbName: string
  to: string
  employeeName: string
  leaveType: string
  startDate: string
  endDate: string
  days: number
  pdfBuffer?: Buffer
}) {
  await sendTenantEmail({
    tenantDbName: opts.tenantDbName,
    triggerEvent: "LEAVE_APPROVED",
    to: opts.to,
    variables: {
      name: opts.employeeName,
      leaveType: opts.leaveType,
      startDate: opts.startDate,
      endDate: opts.endDate,
      days: String(opts.days),
    },
    attachments: opts.pdfBuffer ? [{
      filename: `adeia-${opts.startDate}.pdf`,
      content: opts.pdfBuffer,
      contentType: "application/pdf",
    }] : undefined,
  })
}

export async function sendLeaveRejectedEmail(opts: {
  tenantDbName: string
  to: string
  employeeName: string
  reason: string
}) {
  await sendTenantEmail({
    tenantDbName: opts.tenantDbName,
    triggerEvent: "LEAVE_REJECTED",
    to: opts.to,
    variables: { name: opts.employeeName, reason: opts.reason },
  })
}

export async function sendLeaveSubmittedEmail(opts: {
  tenantDbName: string
  to: string
  employeeName: string
  leaveType: string
  startDate: string
  endDate: string
  days: number
  approvalUrl: string
}) {
  await sendTenantEmail({
    tenantDbName: opts.tenantDbName,
    triggerEvent: "LEAVE_SUBMITTED",
    to: opts.to,
    variables: {
      employeeName: opts.employeeName,
      leaveType: opts.leaveType,
      startDate: opts.startDate,
      endDate: opts.endDate,
      days: String(opts.days),
      approvalUrl: opts.approvalUrl,
    },
  })
}

export async function sendExpenseSubmittedEmail(opts: {
  tenantDbName: string
  to: string
  employeeName: string
  reportNumber: string
  totalAmount: string
  approvalUrl: string
}) {
  await sendTenantEmail({
    tenantDbName: opts.tenantDbName,
    triggerEvent: "EXPENSE_SUBMITTED",
    to: opts.to,
    variables: {
      employeeName: opts.employeeName,
      reportNumber: opts.reportNumber,
      totalAmount: opts.totalAmount,
      approvalUrl: opts.approvalUrl,
    },
  })
}

export async function sendExpenseApprovedEmail(opts: {
  tenantDbName: string
  to: string
  employeeName: string
  reportNumber: string
  totalAmount: string
}) {
  await sendTenantEmail({
    tenantDbName: opts.tenantDbName,
    triggerEvent: "EXPENSE_APPROVED",
    to: opts.to,
    variables: {
      name: opts.employeeName,
      reportNumber: opts.reportNumber,
      totalAmount: opts.totalAmount,
    },
  })
}

export async function sendTrialExpiryEmail(opts: {
  to: string
  companyName: string
  expiryDate: string
  upgradeUrl: string
  daysLeft: 7 | 3
}) {
  const trigger = opts.daysLeft === 7 ? "TRIAL_EXPIRY_7" : "TRIAL_EXPIRY_3"
  const template = await masterPrisma.emailTemplate.findUnique({ where: { triggerEvent: trigger } })
  if (!template) return

  const html = template.bodyHtml
    .replace(/\{\{company\}\}/g, opts.companyName)
    .replace(/\{\{expiryDate\}\}/g, opts.expiryDate)
    .replace(/\{\{upgradeUrl\}\}/g, opts.upgradeUrl)

  await sendEmail({
    to: opts.to,
    subject: template.subject.replace(/\{\{company\}\}/g, opts.companyName),
    html,
  })
}
