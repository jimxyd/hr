import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { getTenantPrisma } from "@/lib/prisma/tenant"
import { uploadFile, generateKey } from "@/lib/storage"
import { successResponse, errorResponse } from "@/types/api"
import sharp from "sharp"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json(errorResponse("UNAUTHORIZED", "Μη εξουσιοδοτημένο"), { status: 401 })
  const db = getTenantPrisma(session.user.tenantDbName!)
  const branding = await db.tenantBranding.findFirst()
  return NextResponse.json(successResponse(branding))
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  const roles = session?.user?.role as string[] || []
  if (!roles.includes("ADMIN")) return NextResponse.json(errorResponse("FORBIDDEN", "Μόνο Admin"), { status: 403 })

  const db = getTenantPrisma(session.user.tenantDbName!)
  const formData = await req.formData()

  const updates: any = {}

  // Handle logo upload
  const logoFile = formData.get("logo") as File | null
  if (logoFile) {
    const buffer = Buffer.from(await logoFile.arrayBuffer())
    const subdomain = session.user.tenantSubdomain!

    // Resize to different sizes using Sharp
    const [sm, md, lg, favicon] = await Promise.all([
      sharp(buffer).resize(120, 40, { fit: "inside" }).webp().toBuffer(),
      sharp(buffer).resize(200, 60, { fit: "inside" }).webp().toBuffer(),
      sharp(buffer).resize(300, 80, { fit: "inside" }).webp().toBuffer(),
      sharp(buffer).resize(32, 32, { fit: "cover" }).png().toBuffer(),
    ])

    const [smUrl, mdUrl, lgUrl, faviconUrl] = await Promise.all([
      uploadFile(`logos/${subdomain}/logo-sm.webp`, sm, "image/webp"),
      uploadFile(`logos/${subdomain}/logo-md.webp`, md, "image/webp"),
      uploadFile(`logos/${subdomain}/logo-lg.webp`, lg, "image/webp"),
      uploadFile(`logos/${subdomain}/favicon.png`, favicon, "image/png"),
    ])

    updates.logoUrl = mdUrl
    updates.logoSmUrl = smUrl
    updates.logoLgUrl = lgUrl
    updates.faviconUrl = faviconUrl
  }

  // Handle color update
  const primaryColor = formData.get("primaryColor") as string | null
  if (primaryColor) updates.primaryColor = primaryColor

  const companyName = formData.get("companyName") as string | null
  if (companyName) updates.companyName = companyName

  const showPoweredBy = formData.get("showPoweredBy")
  if (showPoweredBy !== null) updates.showPoweredBy = showPoweredBy === "true"

  const branding = await db.tenantBranding.upsert({
    where: { id: (await db.tenantBranding.findFirst())?.id || "new" },
    create: { companyName: companyName || "Company", ...updates },
    update: updates,
  })

  return NextResponse.json(successResponse(branding))
}
