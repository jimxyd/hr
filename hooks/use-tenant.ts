"use client"
import { useSession } from "next-auth/react"

export function useTenant() {
  const { data: session } = useSession()
  return {
    tenantId: session?.user?.tenantId,
    subdomain: session?.user?.tenantSubdomain,
    dbName: session?.user?.tenantDbName,
  }
}

export function useCurrentUser() {
  const { data: session } = useSession()
  return session?.user
}

export function useIsAdmin() {
  const { data: session } = useSession()
  const role = session?.user?.role || []
  return role.includes("ADMIN") || role.includes("HR") || session?.user?.isSuperAdmin
}

export function useIsSuperAdmin() {
  const { data: session } = useSession()
  return session?.user?.isSuperAdmin === true
}
