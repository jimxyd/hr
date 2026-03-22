"use client"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const schema = z.object({
  email: z.string().email("Μη έγκυρο email"),
  password: z.string().min(1, "Υποχρεωτικό πεδίο"),
  subdomain: z.string().optional(),
})

type FormData = z.infer<typeof schema>

function getSubdomainFromUrl(): string {
  if (typeof window === "undefined") return ""
  const hostname = window.location.hostname
  const parts = hostname.split(".")
  // Support company.localhost or company.ergohub.gr
  if (parts.length > 1 && parts[0] !== "localhost" && parts[0] !== "www") {
    return parts[0]
  }
  return ""
}

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const detectedSubdomain = getSubdomainFromUrl()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "admin@ergohub.gr",
      password: "change-this-password!",
      subdomain: detectedSubdomain,
    },
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError("")
    try {
      const subdomain = data.subdomain || detectedSubdomain || undefined
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        subdomain: subdomain || "",
        redirect: false,
      })
      console.log("[LOGIN] signIn result:", JSON.stringify(result))
      // NextAuth v5 beta: check ok/status instead of error
      if (result?.ok === false || result?.status === 401) {
        setError("Λάθος email ή κωδικός πρόσβασης")
      } else {
        // Check session to determine redirect
        const sessionRes = await fetch("/api/auth/session")
        const session = await sessionRes.json()
        if (session?.user?.isSuperAdmin) {
          router.push("/admin/dashboard")
        } else {
          router.push("/dashboard")
        }
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">ErgoHub</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Σύνδεση στον λογαριασμό σας</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Subdomain field - shown on localhost when no subdomain detected in URL */}
          {!detectedSubdomain && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Εταιρεία (subdomain)
              </label>
              <input
                {...register("subdomain")}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Κενό για Super Admin"
              />
              <p className="mt-1 text-xs text-gray-400">Αφήστε κενό για σύνδεση ως Super Admin</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              {...register("email")}
              type="email"
              autoComplete="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="user@company.gr"
            />
            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Κωδικός Πρόσβασης
            </label>
            <input
              {...register("password")}
              type="password"
              autoComplete="current-password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="••••••••"
            />
            {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
          </div>

          <div className="flex items-center justify-between">
            <a href="/reset-password" className="text-sm text-primary hover:underline">
              Ξέχασα τον κωδικό μου
            </a>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm dark:bg-red-900/20 dark:border-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Σύνδεση..." : "Σύνδεση"}
          </button>
        </form>
      </div>
    </div>
  )
}
