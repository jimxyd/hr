import nodemailer from "nodemailer"

let transporter: nodemailer.Transporter | null = null

export function getEmailTransporter(customSmtp?: {
  host: string; port: number; user: string; pass: string; tls: boolean
}): nodemailer.Transporter {
  if (customSmtp) {
    return nodemailer.createTransport({
      host: customSmtp.host,
      port: customSmtp.port,
      secure: customSmtp.tls,
      auth: { user: customSmtp.user, pass: customSmtp.pass },
    })
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.PLATFORM_SMTP_HOST,
      port: parseInt(process.env.PLATFORM_SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.PLATFORM_SMTP_USER,
        pass: process.env.PLATFORM_SMTP_PASS,
      },
    })
  }
  return transporter
}

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
  attachments?: Array<{ filename: string; content: Buffer; contentType: string }>
}

export async function sendEmail(
  options: SendEmailOptions,
  customSmtp?: { host: string; port: number; user: string; pass: string; tls: boolean }
): Promise<void> {
  const t = getEmailTransporter(customSmtp)
  await t.sendMail({
    from: options.from || `"${process.env.PLATFORM_FROM_NAME}" <${process.env.PLATFORM_FROM_EMAIL}>`,
    to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
    replyTo: options.replyTo,
    subject: options.subject,
    html: options.html,
    attachments: options.attachments,
  })
}
