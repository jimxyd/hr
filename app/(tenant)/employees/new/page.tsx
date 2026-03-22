"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

const schema = z.object({
  name: z.string().min(2, "Τουλάχιστον 2 χαρακτήρες"),
  email: z.string().email("Μη έγκυρο email"),
  departmentId: z.string().optional(),
  title: z.string().optional(),
  positionLevel: z.string().default("EMPLOYEE"),
  reportsToId: z.string().optional(),
  contractType: z.enum(["INDEFINITE", "FIXED_TERM", "PROJECT"]).default("INDEFINITE"),
  contractStart: z.string().min(1, "Υποχρεωτικό"),
  contractEnd: z.string().optional(),
  employmentType: z.enum(["EMPLOYEE", "FREELANCER", "INTERN"]).default("EMPLOYEE"),
  hoursPerWeek: z.coerce.number().default(40),
  daysPerWeek: z.coerce.number().default(5),
  salaryGross: z.string().optional(),
  salaryNet: z.string().optional(),
  role: z.string().default("EMPLOYEE"),
  sendInvite: z.boolean().default(true),
})

type FormData = z.infer<typeof schema>

export default function NewEmployeePage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [contractType, setContractType] = useState("INDEFINITE")

  const { data: depts } = useQuery({
    queryKey: ["departments"],
    queryFn: () => fetch("/api/departments").then(r => r.json()),
  })
  const { data: employees } = useQuery({
    queryKey: ["employees-simple"],
    queryFn: () => fetch("/api/employees?limit=100").then(r => r.json()),
  })

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { contractType: "INDEFINITE", employmentType: "EMPLOYEE", hoursPerWeek: 40, daysPerWeek: 5, sendInvite: true }
  })

  const watchedContractType = watch("contractType")

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, role: [data.role] }),
      })
      const json = await res.json()
      if (!json.success) { setError(json.error?.message || "Σφάλμα"); return }
      router.push(`/employees/${json.data.id}`)
    } catch (err) { setError("Σφάλμα σύνδεσης. Παρακαλώ δοκιμάστε ξανά.") }
    finally { setLoading(false) }
  }

  const positions = ["CEO", "COO", "HR_MANAGER", "MANAGER", "TEAM_LEADER", "EMPLOYEE"]
  const positionLabels: Record<string, string> = {
    CEO: "CEO / Διευθύνων Σύμβουλος",
    COO: "COO / Γενικός Διευθυντής",
    HR_MANAGER: "HR Manager",
    MANAGER: "Υπεύθυνος Τμήματος",
    TEAM_LEADER: "Team Leader",
    EMPLOYEE: "Εργαζόμενος",
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/employees" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft size={20} className="text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Νέος Εργαζόμενος</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Συμπλήρωσε τα στοιχεία του εργαζομένου</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Βασικά Στοιχεία</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Ονοματεπώνυμο *</label>
              <input {...register("name")} className="form-input" placeholder="Γιάννης Παπαδόπουλος" />
              {errors.name && <p className="error-text">{errors.name.message}</p>}
            </div>
            <div>
              <label className="form-label">Email *</label>
              <input {...register("email")} type="email" className="form-input" placeholder="user@company.gr" />
              {errors.email && <p className="error-text">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Τίτλος Θέσης</label>
              <input {...register("title")} className="form-input" placeholder="π.χ. Senior Developer" />
            </div>
            <div>
              <label className="form-label">Ιεραρχική Θέση</label>
              <select {...register("positionLevel")} className="form-input">
                {positions.map(p => <option key={p} value={p}>{positionLabels[p]}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Τμήμα</label>
              <select {...register("departmentId")} className="form-input">
                <option value="">Επιλογή τμήματος</option>
                {depts?.data?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Αναφέρεται σε</label>
              <select {...register("reportsToId")} className="form-input">
                <option value="">Επιλογή ανωτέρου</option>
                {employees?.data?.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Contract Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Εργασιακά Στοιχεία</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Τύπος Σύμβασης *</label>
              <select {...register("contractType")} className="form-input">
                <option value="INDEFINITE">Αορίστου Χρόνου</option>
                <option value="FIXED_TERM">Ορισμένου Χρόνου</option>
                <option value="PROJECT">Project</option>
              </select>
            </div>
            <div>
              <label className="form-label">Τύπος Απασχόλησης</label>
              <select {...register("employmentType")} className="form-input">
                <option value="EMPLOYEE">Υπάλληλος</option>
                <option value="FREELANCER">Freelancer</option>
                <option value="INTERN">Πρακτική</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Ημ. Έναρξης *</label>
              <input {...register("contractStart")} type="date" className="form-input" />
              {errors.contractStart && <p className="error-text">{errors.contractStart.message}</p>}
            </div>
            {watchedContractType !== "INDEFINITE" && (
              <div>
                <label className="form-label">Ημ. Λήξης *</label>
                <input {...register("contractEnd")} type="date" className="form-input" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Ώρες/Εβδομάδα</label>
              <input {...register("hoursPerWeek")} type="number" className="form-input" />
            </div>
            <div>
              <label className="form-label">Ημέρες/Εβδομάδα</label>
              <select {...register("daysPerWeek")} className="form-input">
                <option value={5}>5 ημέρες</option>
                <option value={6}>6 ημέρες</option>
                <option value={4}>4 ημέρες</option>
                <option value={3}>3 ημέρες</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Μισθός Brutto (€)</label>
              <input {...register("salaryGross")} type="text" className="form-input" placeholder="π.χ. 1500" />
            </div>
            <div>
              <label className="form-label">Μισθός Netto (€)</label>
              <input {...register("salaryNet")} type="text" className="form-input" placeholder="π.χ. 1200" />
            </div>
          </div>
        </div>

        {/* Role & Invite */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Ρόλος & Πρόσβαση</h2>
          
          <div>
            <label className="form-label">Ρόλος στο Σύστημα</label>
            <select {...register("role")} className="form-input">
              <option value="EMPLOYEE">Εργαζόμενος</option>
              <option value="MANAGER">Manager</option>
              <option value="HR">HR Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input {...register("sendInvite")} type="checkbox" id="sendInvite" defaultChecked />
            <label htmlFor="sendInvite" className="text-sm text-gray-700 dark:text-gray-300">
              Αποστολή email πρόσκλησης για ενεργοποίηση λογαριασμού
            </label>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Link href="/employees" className="flex-1 py-2 px-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Ακύρωση
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Αποθήκευση..." : "Δημιουργία Εργαζομένου"}
          </button>
        </div>
      </form>
    </div>
  )
}
