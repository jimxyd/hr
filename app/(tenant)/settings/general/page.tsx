"use client"
import { useState, useRef } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Upload, Palette, Eye } from "lucide-react"
import { HelpBox } from "@/components/common/help-box"

export default function GeneralSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [primaryColor, setPrimaryColor] = useState("#2E5FA3")
  const [companyName, setCompanyName] = useState("")
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ["branding"],
    queryFn: () => fetch("/api/settings/branding").then(r => r.json()),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData()
    formData.append("primaryColor", primaryColor)
    formData.append("companyName", companyName)
    if (fileRef.current?.files?.[0]) {
      formData.append("logo", fileRef.current.files[0])
    }
    try {
      const res = await fetch("/api/settings/branding", { method: "PATCH", body: formData })
      const json = await res.json()
      if (json.success) {
        setSuccess(true)
        queryClient.invalidateQueries({ queryKey: ["branding"] })
        setTimeout(() => setSuccess(false), 3000)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ρυθμίσεις Εταιρείας</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Branding και εμφάνιση</p>
        </div>
        <HelpBox
          storageKey="settings-general"
          title="Οδηγός Ρυθμίσεων Εταιρείας"
          items={[
            "Αλλάξτε το όνομα εταιρείας που εμφανίζεται σε όλη την εφαρμογή.",
            "Ανεβάστε logo (PNG/JPG/WebP, max 2MB) — δημιουργούνται αυτόματα όλα τα μεγέθη.",
            "Επιλέξτε Primary Color για να ταιριάξει η εφαρμογή με τα χρώματα της εταιρείας σας.",
          ]}
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Name */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Στοιχεία Εταιρείας</h2>
          <div>
            <label className="form-label">Όνομα Εταιρείας</label>
            <input
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              className="form-input"
              placeholder="Acme Corp"
            />
          </div>
        </div>

        {/* Logo */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Upload size={18} /> Logo
          </h2>
          {data?.data?.logoUrl && !preview && (
            <img src={data.data.logoUrl} alt="Current logo" className="h-12 mb-4 object-contain" />
          )}
          {preview && (
            <img src={preview} alt="Preview" className="h-12 mb-4 object-contain" />
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) setPreview(URL.createObjectURL(file))
            }}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer"
          />
          <p className="text-xs text-gray-400 mt-2">PNG, JPG ή WebP — max 2MB. Auto-resize σε sm/md/lg + favicon.</p>
        </div>

        {/* Primary Color */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Palette size={18} /> Primary Color
          </h2>
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={primaryColor}
              onChange={e => setPrimaryColor(e.target.value)}
              className="w-12 h-12 rounded-lg cursor-pointer border border-gray-200"
            />
            <input
              value={primaryColor}
              onChange={e => setPrimaryColor(e.target.value)}
              className="form-input w-40"
              placeholder="#2E5FA3"
            />
            <div
              className="flex-1 h-10 rounded-lg flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: primaryColor }}
            >
              Preview Button
            </div>
          </div>
        </div>

        {success && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
            ✅ Οι αλλαγές αποθηκεύτηκαν!
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Αποθήκευση..." : "Αποθήκευση Αλλαγών"}
        </button>
      </form>
    </div>
  )
}
