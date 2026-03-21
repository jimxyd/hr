"use client"
import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { data } = useQuery({
    queryKey: ["branding"],
    queryFn: () => fetch("/api/settings/branding").then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    const branding = data?.data
    if (!branding) return
    const root = document.documentElement
    if (branding.primaryColor) {
      root.style.setProperty("--primary", hexToHsl(branding.primaryColor))
    }
    if (branding.companyName) {
      document.title = branding.companyName
    }
    if (branding.faviconUrl) {
      const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']")
      if (link) link.href = branding.faviconUrl
    }
  }, [data])

  return <>{children}</>
}
