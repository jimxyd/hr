# HR Hub — Master Context Prompt
> Δώσε αυτό το αρχείο στο Claude για να καταλάβει το project από Α έως Ω

---

## 🎯 Τι Είναι το Project

Χτίζω ένα **multi-tenant SaaS platform** για διαχείριση ανθρώπινου δυναμικού που λέγεται **HR Hub**.

- Κάθε εταιρεία-πελάτης (tenant) έχει το δικό της subdomain: `company.hrhub.gr`
- Κάθε tenant έχει **ξεχωριστή MySQL database** (database-per-tenant)
- Πλήρες **white-label branding** — το HR Hub είναι αόρατο στον τελικό χρήστη
- **Trial 30 ημερών** → συνδρομή ανά user/μήνα μέσω **Viva Wallet**
- Super Admin panel στο `admin.hrhub.gr` — μόνο για εμένα

---

## 🛠️ Tech Stack (ΑΜΕΤΆΒΛΗΤΟ)

| Layer | Τεχνολογία |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | MySQL 8.0 |
| ORM | Prisma |
| Auth | NextAuth.js v5 |
| UI | shadcn/ui + Tailwind CSS |
| State | Zustand + TanStack Query |
| Email | Nodemailer (SMTP) |
| PDF | @react-pdf/renderer |
| Excel | ExcelJS |
| Images | Sharp |
| Storage | Linode Object Storage (S3) |
| Cron | node-cron |
| 2FA | speakeasy + qrcode |
| Charts | Recharts |
| Calendar | FullCalendar |
| Editor | TipTap |
| i18n | next-intl (ΕΛ/EN) |
| Payments | Viva Wallet |
| Server | Linode VPS + Nginx + PM2 |
| CI/CD | GitHub Actions |

---

## 🗄️ Database Architecture

### Master DB: `hrhub_master`
```
tenants, plans, subscriptions, super_admins, email_templates, platform_logs
```

### Tenant DB: `hrhub_{subdomain}` (ξεχωριστή ανά εταιρεία)
```
Core:        users, departments, approval_flows, org_positions
             notifications, notification_preferences, audit_logs
             tenant_branding, smtp_settings, system_settings

HR Core:     employees, employee_personal (ENCRYPTED), employee_documents
             employee_history, change_requests
             announcements, announcement_reads

Leaves:      leave_types, leave_allocations, leave_requests
             leave_approvals, holidays

Performance: assessment_templates, assessment_questions, assessment_options
             assessment_responses, assessment_answers, assessment_meeting_notes
             assessment_recipients

Expenses:    expense_reports, expense_lines, expense_categories
             expense_approvals, expense_payments, expense_settings
             expense_permissions

Assets:      asset_types, assets, asset_assignments, asset_returns
             asset_history, asset_maintenance, offboarding_checklists
```

### Encrypted Fields (AES-256)
`afm, amka, iban, salary_gross, salary_net, nationality, residence_permit`

---

## 📦 Modules & Plans

### Basic Plan (υποχρεωτικό)
- **M1: Leave Management** — άδειες, εγκρίσεις, αργίες ΕΛ, PDF βεβαίωση
- **M2: HR Core** — ψηφιακός φάκελος, onboarding, Org Chart, Announcements

### Add-ons (προαιρετικά)
- **M3: Performance Reviews** — custom assessments, scoring, 1:1 meetings
- **M5: Expenses** — expense reports, approval flow, payment tracking
- **M6: Asset Management** — εξοπλισμός, QR codes, ανάθεση, επιστροφή

### Τιμολόγηση
- Ανά user/μήνα (tiered pricing — τιμές TBD)
- M2 HR Core = υποχρεωτικό για όλα τα plans
- Active modules αποθηκεύονται ως JSON στο `tenants.active_modules`

---

## 👥 Ρόλοι (RBAC)

| Ρόλος | Εμβέλεια | Περιγραφή |
|-------|---------|-----------|
| ⚡ Super Admin | Platform | Μόνο εγώ — διαχείριση όλων των tenants |
| ⚙️ Admin | Tenant | Ένας ανά tenant — full control |
| 🏢 HR Manager | Tenant | Εγκρίσεις, reports, onboarding |
| 👔 Manager | Τμήμα | Εγκρίσεις τμήματος, assessments |
| 👤 Employee | Εαυτός | Αιτήματα, self-assessment |

---

## 🔄 Tenant Lifecycle

```
Εγγραφή → CREATE DATABASE → Migrate → Seed → Trial 30d → Viva payment → Active
                                                              ↓ (αν δεν πληρωθεί)
                                                          Suspended
```

### Tenant Detection (Middleware)
```typescript
// Κάθε request:
// 1. Διαβάζει subdomain από hostname
// 2. Query Master DB για tenant info
// 3. Dynamic Prisma connection σε tenant DB
// 4. Αν suspended → redirect /suspended
```

---

## 🌐 URL Structure

```
hrhub.gr              → Landing page
admin.hrhub.gr        → Super Admin Panel
company.hrhub.gr      → Tenant App (branded)
company.hrhub.gr/api  → Tenant API Routes
```

---

## 📧 Email Architecture

```
Platform emails    → Κεντρικό SMTP (trial, billing, onboarding)
Tenant emails      → Default: noreply@hrhub.gr με From: "HR CompanyName"
                  → Premium: custom SMTP ανά tenant (hr@company.gr)
```

---

## 🎨 White-label Branding

Κάθε tenant μπορεί να ορίσει:
- Logo (PNG/JPG/WebP → Sharp resize → Object Storage)
- Primary color (CSS variables inject ανά request)
- Company name (εμφανίζεται παντού αντί για "HR Hub")
- Favicon (auto-generated από logo)
- "Powered by HR Hub" (optional footer — κρύβεται από admin)

---

## 🏖️ M1: Leave Management — Λεπτομέρειες

### Κατηγορίες Αδειών
- Κανονική (αφαιρεί από υπόλοιπο, requires approval)
- Ασθενείας (δεν αφαιρεί, καταχωρεί HR)
- Μητρότητας/Πατρότητας (δεν αφαιρεί, βάσει νόμου)
- Ειδικές custom (admin ορίζει)

### Ωράρια
- Full-time 5ήμ/8ωρ → 20 ημέρες/έτος (έως 25 με αρχαιότητα)
- Full-time 6ήμ/8ωρ
- Part-time → αναλογικά (ώρες/εβδ ÷ 40) × full-time
- Custom → admin ορίζει ώρες + ημέρες/εβδ

### Αργίες Ελλάδας
- Σταθερές: auto-load κάθε χρόνο
- Κινητές: αλγοριθμικός υπολογισμός Πάσχα (Meeus/Jones/Butcher)
- Admin: override/προσθήκη/διαγραφή
- Εταιρικές αργίες: recurring ή one-time

### Status Machine
```
PENDING → PENDING_L2 → APPROVED / REJECTED / CANCELLED / WITHDRAWN
```

### Approval Flow
- 1 ή 2 επίπεδα — ανά τμήμα ή ανά εργαζόμενο
- Default approver = ο "reports to" από Org Chart
- Override δυνατό ανά άτομο

### XLS Export/Import
- 4 καρτέλες: Εργαζόμενοι | Υπόλοιπα | Αιτήματα | Audit Log
- Φίλτρα: από/έως, employee, τμήμα, έτος, κατηγορία, status
- Import: μόνο LeaveFlow-format αρχεία, preview + merge/replace, rollback

---

## 📁 M2: HR Core — Λεπτομέρειες

### Employee Profile
**Υποχρεωτικά (HR/Admin):**
ονοματεπώνυμο, email, τμήμα, τίτλος θέσης, ιεραρχική θέση (CEO/COO/HR/Manager/Team Leader/Employee/Custom), reports_to, τύπος σύμβασης (αορίστου/ορισμένου/project), ημ. έναρξης, ημ. λήξης (μόνο αν ορισμένου), τύπος απασχόλησης (υπάλληλος/freelancer/πρακτική), ωράριο, μισθός gross/net (ENCRYPTED)

**Προαιρετικά (εργαζόμενος ή HR):**
ΑΦΜ, ΑΜΚΑ, ημ. γέννησης, διεύθυνση, IBAN, emergency contact, ιθαγένεια, άδεια παραμονής, φωτογραφία

### Onboarding Flow
1. HR δημιουργεί εργαζόμενο → στέλνει email invite (magic link 72ωρ)
2. Employee κάνει κλικ → ορίζει password
3. Step-by-step wizard (4 βήματα + progress bar)
4. Τα δεδομένα πηγαίνουν σε HR για έγκριση πριν αποθηκευτούν
5. Αν employee δεν θέλει → HR συμπληρώνει για λογαριασμό του

### Change Requests
Employee υποβάλλει αλλαγή (π.χ. νέο IBAN) με αιτιολογία → HR εγκρίνει/απορρίπτει

### Org Chart
- Auto-generated από "reports_to" hierarchy
- Interactive δέντρο (zoom/pan, click for profile)
- Views: ολόκληρη εταιρεία ή ανά τμήμα
- Export PNG/PDF

### Announcements (included στο Basic)
- Rich text, targeting ανά τμήμα/όλοι
- Pinned announcements
- Read tracking (% αναγνώσεων)

---

## 🎯 M3: Performance Reviews — Λεπτομέρειες

### Assessment Builder
- Τύποι ερωτήσεων: Multiple choice, Checkboxes, Scale 1-5/10, Text, Yes/No, Αστέρια
- Scoring: βαρύτητα ανά ερώτηση (weight %), score ανά απάντηση → 0-100
- Scoring on/off toggle
- Drag & drop reorder ερωτήσεων
- Preview mode

### Ροή
1. Manager δημιουργεί assessment → DRAFT
2. Duplicate περσινού + edit + publish με 1 κουμπί
3. Employee λαμβάνει notification → κάνει self-assessment
4. Manager αξιολογεί κάθε εργαζόμενο ξεχωριστά
5. Side-by-side: self vs manager score
6. Manager επιλέγει αν employee βλέπει αξιολόγηση
7. 1:1 meeting notes (προαιρετική κοινοποίηση)

### Ιεραρχία
Director αξιολογεί Managers (configurable ανά tenant) — βάσει Org Chart

---

## 💰 M5: Expenses — Λεπτομέρειες

### Expense Report Model
Header: τίτλος, περίοδος, auto-αριθμός (EXP-2026-0042), approver
Lines: ημερομηνία, vendor, κατηγορία, ποσό, νόμισμα, περιγραφή, project, απόδειξη (optional)

### Κατηγορίες
Μετακίνηση, Εστίαση, Διαμονή, Εξοπλισμός, Εκπαίδευση, Τηλεφωνία, Αναλώσιμα, Custom

### Status Machine
```
DRAFT → SUBMITTED → UNDER REVIEW → APPROVED / REJECTED → PENDING PAYMENT → PAID / CANCELLED
```

### Payment Tracking
HR καταγράφει: Έμβασμα (+ reference) / Μετρητά / Μισθοδοσία

### Όρια (configurable)
- Max ανά κατηγορία
- Max ανά report
- Ποιοι εργαζόμενοι μπορούν να κάνουν expenses

### Φυσικές Αποδείξεις
Αν δεν γίνει upload → εμφανίζεται: "Ομαδοποιήστε φυσικές αποδείξεις με αριθμό: EXP-2026-0042"

---

## 📦 M6: Asset Management — Λεπτομέρειες

### Τύποι Assets
Laptop/Desktop, Κινητό/Tablet, Κλειδιά, Κάρτες, Εταιρικό Όχημα, Περιφερειακά, Στολή, Εργαλεία, Custom

### Καταστάσεις
- ✅ Ενεργό — Σε χρήση
- ✅ Ενεργό — Ελεύθερο
- 🔧 Σε Συντήρηση
- ⚠️ Εκτός Λειτουργίας
- ❓ Χαμένο
- 🗑️ Αποσυρθέν

### QR System
- Auto-generated κατά δημιουργία: `company.hrhub.gr/assets/AST-2026-0001`
- Bulk print PDF με labels (white-label)

### Shared Assets
Ένα asset → πολλοί ταυτόχρονα (π.χ. εταιρικό όχημα)

### Offboarding Integration
Αποχώρηση εργαζομένου (HR Core) → auto checklist assets προς επιστροφή

### PDF Παραλαβής
Manual από HR/Admin (χωρίς υπογραφή στο MVP)

---

## 🔔 Notifications

- **In-app**: SSE (Server-Sent Events) — real-time bell icon
- **Email**: Προαιρετικό ανά user ανά κατηγορία
- **Triggers**: αίτημα άδειας, έγκριση/απόρριψη, expense status, asset ανάθεση, assessment, αλλαγή στοιχείων, λήξη σύμβασης, λήξη αδειών, νέα ανακοίνωση, trial expiry

---

## ⚙️ Auto-Setup (Install Script)

```bash
npm run setup
```

Κάνει αυτόματα:
1. Δημιουργία Master DB + Prisma migrate
2. Super Admin account (από .env)
3. Default email templates + settings
4. Object Storage buckets
5. SSL + Nginx config

---

## 💳 Billing

- **Viva Wallet**: webhooks, subscriptions, auto-charge
- **Μοντέλο**: ανά user/μήνα (tiered — τιμές TBD)
- **Flow**: Trial λήγει → email CTA → Viva payment → webhook → activate
- **Auto-suspend**: αν δεν πληρωθεί μετά trial

---

## 📁 Project Structure (Σύντομη)

```
app/
  (auth)/          → login, register, activate
  (tenant)/        → tenant app (dashboard, leaves, expenses κ.λπ.)
  (super-admin)/   → super admin panel
  api/             → all API routes

components/        → ui/, layout/, forms/, charts/, calendar/
lib/               → prisma/, auth/, email/, storage/, pdf/, excel/, cron/
prisma/
  master/schema.prisma
  tenant/schema.prisma
scripts/           → setup.ts, seed.ts, migrate-all-tenants.ts
messages/          → el.json, en.json
```

---

## 🚦 Development Phases (Τρέχουσα Κατάσταση)

| Phase | Τίτλος | Status |
|-------|--------|--------|
| 0 | Server Setup | ⬜ |
| 1 | Master DB + Super Admin | ⬜ |
| 2 | HR Core | ⬜ |
| 3 | UI + Branding + Notifications | ⬜ |
| 4 | Leave Management | ⬜ |
| 5 | Email System | ⬜ |
| 6 | Dashboards | ⬜ |
| 7 | Expenses | ⬜ |
| 8 | Assets | ⬜ |
| 9 | Performance Reviews | ⬜ |
| 10 | Data, Security, i18n | ⬜ |
| 11 | Billing (Viva Wallet) | ⬜ |
| 12 | UAT + Production | ⬜ |

---

## 📋 Κανόνες για το AI

Όταν γράφεις κώδικα για αυτό το project:

1. **ΠΑΝΤΑ** χρησιμοποίησε TypeScript — όχι JavaScript
2. **ΠΑΝΤΑ** χρησιμοποίησε Prisma για DB queries — ποτέ raw SQL
3. **ΠΑΝΤΑ** validate με Zod πριν αποθηκεύσεις
4. **ΠΑΝΤΑ** έλεγχος RBAC permissions σε κάθε API route
5. **ΠΑΝΤΑ** χρησιμοποίησε dynamic tenant Prisma client (ποτέ hardcoded DB)
6. **ΠΑΝΤΑ** encrypt sensitive fields (ΑΦΜ, ΑΜΚΑ, IBAN, μισθός) με AES-256
7. **ΠΑΝΤΑ** log σε audit_logs για mutations (create/update/delete)
8. **ΠΑΝΤΑ** shadcn/ui components για UI — ποτέ custom από scratch
9. **ΠΟΤΕ** μην αποθηκεύεις credentials σε κώδικα — ΠΑΝΤΑ από .env
10. **ΠΟΤΕ** μην χρησιμοποιείς `any` TypeScript type

---

## 🔧 Τρέχουσα Εργασία

> **Ενημέρωσε αυτό το section κάθε φορά που ξεκινάς νέα συνεδρία**

- **Phase**: 0 — Server Setup
- **Τελευταίο completed task**: —
- **Επόμενο task**: Linode VPS setup
- **Blockers**: Αναμένεται GitHub repo URL

---

*HR Hub Master Context — v1.0 — Μάρτιος 2026*
*Δώσε αυτό το αρχείο σε κάθε νέα συνεδρία Claude για πλήρες context*
