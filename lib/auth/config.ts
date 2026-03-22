import NextAuth, { type NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { masterPrisma } from "@/lib/prisma/master"
import { getTenantPrisma } from "@/lib/prisma/tenant"
import bcrypt from "bcryptjs"

const config: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        subdomain: { label: "Subdomain", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string
        const password = credentials?.password as string
        const subdomain = credentials?.subdomain as string | undefined

        console.log("[AUTH] authorize called:", { email, subdomain, hasPassword: !!password })

        if (!email || !password) {
          console.log("[AUTH] Missing email or password")
          return null
        }

        // Super Admin login (admin subdomain or no subdomain)
        if (!subdomain || subdomain === "admin") {
          const admin = await masterPrisma.superAdmin.findUnique({ where: { email } })
          console.log("[AUTH] Super admin found:", !!admin, "isActive:", admin?.isActive)
          if (!admin?.isActive) return null
          const valid = await bcrypt.compare(password, admin.passwordHash)
          console.log("[AUTH] Password valid:", valid)
          if (!valid) return null
          return {
            id: admin.id,
            email: admin.email,
            name: admin.name,
          }
        }

        // Tenant user login
        const tenant = await masterPrisma.tenant.findUnique({ where: { subdomain } })
        if (!tenant) return null
        if (tenant.status === "SUSPENDED") return null

        const tenantDb = getTenantPrisma(tenant.dbName)
        const user = await tenantDb.user.findUnique({ where: { email } })
        if (!user?.isActive) return null

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        // Look up role info from DB on first sign-in
        const admin = await masterPrisma.superAdmin.findUnique({
          where: { email: user.email! },
        })
        if (admin) {
          token.role = ["SUPER_ADMIN"]
          token.isSuperAdmin = true
        } else {
          token.isSuperAdmin = false
          // Look up tenant user info
          // Find which tenant this user belongs to by checking all active tenants
          const tenants = await masterPrisma.tenant.findMany({
            where: { status: { in: ["ACTIVE", "TRIAL"] } },
          })
          for (const tenant of tenants) {
            try {
              const tenantDb = getTenantPrisma(tenant.dbName)
              const tenantUser = await tenantDb.user.findUnique({
                where: { email: user.email! },
              })
              if (tenantUser) {
                token.tenantId = tenant.id
                token.tenantSubdomain = tenant.subdomain
                token.tenantDbName = tenant.dbName
                token.role = tenantUser.role as string[]
                break
              }
            } catch {
              // Skip tenants with DB issues
            }
          }
        }
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as string[]
      session.user.isSuperAdmin = token.isSuperAdmin as boolean
      session.user.tenantId = token.tenantId as string | undefined
      session.user.tenantSubdomain = token.tenantSubdomain as string | undefined
      session.user.tenantDbName = token.tenantDbName as string | undefined
      return session
    },
  },
  pages: { signIn: "/login", error: "/login" },
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  trustHost: true,
}

export const { handlers, auth, signIn, signOut } = NextAuth(config)
