import NextAuth, { type NextAuthConfig } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { masterPrisma } from "@/lib/prisma/master"
import { getTenantPrisma } from "@/lib/prisma/tenant"
import bcrypt from "bcryptjs"

const config: NextAuthConfig = {
  providers: [
    CredentialsProvider({
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

        if (!email || !password) return null

        // Super Admin login (admin subdomain or no subdomain)
        if (!subdomain || subdomain === "admin") {
          const admin = await masterPrisma.superAdmin.findUnique({ where: { email } })
          if (!admin?.isActive) return null
          const valid = await bcrypt.compare(password, admin.passwordHash)
          if (!valid) return null
          return {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: ["SUPER_ADMIN"],
            isSuperAdmin: true,
            tenantId: undefined,
            tenantSubdomain: undefined,
            tenantDbName: undefined,
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
          role: user.role as string[],
          isSuperAdmin: false,
          tenantId: tenant.id,
          tenantSubdomain: tenant.subdomain,
          tenantDbName: tenant.dbName,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.isSuperAdmin = (user as any).isSuperAdmin
        token.tenantId = (user as any).tenantId
        token.tenantSubdomain = (user as any).tenantSubdomain
        token.tenantDbName = (user as any).tenantDbName
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
