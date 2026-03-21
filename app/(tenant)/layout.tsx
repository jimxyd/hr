"use client"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { BrandingProvider } from "@/components/common/branding-provider"

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return (
    <BrandingProvider>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </BrandingProvider>
  )
}
