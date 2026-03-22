import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || ""
  const domain = process.env.NEXT_PUBLIC_DOMAIN || "ergohub.gr"

  // Extract subdomain
  let subdomain = ""
  if (hostname.includes("localhost")) {
    // Local dev: use x-tenant header or first part of hostname
    subdomain = request.headers.get("x-tenant") || ""
    // Support: company.localhost:3000
    const parts = hostname.split(".")
    if (parts.length > 1 && parts[0] !== "localhost") {
      subdomain = parts[0]
    }
  } else {
    const withoutPort = hostname.split(":")[0]
    if (withoutPort.endsWith(`.${domain}`)) {
      subdomain = withoutPort.replace(`.${domain}`, "")
    }
  }

  const response = NextResponse.next()

  // Add subdomain header for API routes and pages
  if (subdomain) {
    response.headers.set("x-tenant-subdomain", subdomain)
  }

  // Protect authenticated routes
  const isAuthRoute = request.nextUrl.pathname.startsWith("/login") ||
                      request.nextUrl.pathname.startsWith("/register") ||
                      request.nextUrl.pathname.startsWith("/activate") ||
                      request.nextUrl.pathname.startsWith("/reset-password")

  const isApiRoute = request.nextUrl.pathname.startsWith("/api")
  const isPublicRoute = isAuthRoute || isApiRoute ||
                        request.nextUrl.pathname.startsWith("/_next") ||
                        request.nextUrl.pathname.startsWith("/public")

  if (!isPublicRoute) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    // Suspended tenant check
    if (!token.isSuperAdmin && !token.tenantDbName) {
      return NextResponse.redirect(new URL("/suspended", request.url))
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
