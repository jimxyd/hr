# HR Hub — Development Plan
> SaaS Platform για Διαχείριση Ανθρώπινου Δυναμικού  
> Version: 1.0 | Start: Μάρτιος 2026

---

## 📊 Progress Overview

| Phase | Τίτλος | Διάρκεια | Status |
|-------|--------|----------|--------|
| 0 | Server Setup | 1 εβδ. | ⬜ Pending |
| 1 | Master DB + Super Admin | 3 εβδ. | ⬜ Pending |
| 2 | HR Core | 4 εβδ. | ⬜ Pending |
| 3 | UI + Branding + Notifications | 2 εβδ. | ⬜ Pending |
| 4 | Leave Management | 3 εβδ. | ⬜ Pending |
| 5 | Email System | 2 εβδ. | ⬜ Pending |
| 6 | Dashboards | 2 εβδ. | ⬜ Pending |
| 7 | Expenses | 3 εβδ. | ⬜ Pending |
| 8 | Assets | 3 εβδ. | ⬜ Pending |
| 9 | Performance Reviews | 4 εβδ. | ⬜ Pending |
| 10 | Data, Security, i18n | 2 εβδ. | ⬜ Pending |
| 11 | Billing (Viva Wallet) | 2 εβδ. | ⬜ Pending |
| 12 | UAT + Production | 2 εβδ. | ⬜ Pending |

**Σύνολο: ~33 εβδομάδες**

---

## ⚙️ Phase 0 — Server Setup
> Διάρκεια: 1 εβδομάδα

### 0.1 Linode VPS
- [ ] SSH access επιβεβαίωση
- [ ] Update packages (`apt update && apt upgrade`)
- [ ] Install Node.js 20 LTS
- [ ] Install PM2 globally (`npm install -g pm2`)
- [ ] Install Git

### 0.2 MySQL 8
- [ ] Install MySQL 8.0
- [ ] Secure MySQL installation (`mysql_secure_installation`)
- [ ] Δημιουργία MySQL user για το project
- [ ] Test connection
- [ ] Configure utf8mb4 charset

### 0.3 Nginx + RunCloud
- [ ] Nginx wildcard virtual host `*.hrhub.gr`
- [ ] Nginx config για Next.js reverse proxy (port 3000)
- [ ] Gzip compression enable
- [ ] Security headers config

### 0.4 SSL Certificate
- [ ] Install Certbot
- [ ] Wildcard certificate `*.hrhub.gr` + `hrhub.gr`
- [ ] Auto-renewal test (`certbot renew --dry-run`)
- [ ] HTTPS redirect config

### 0.5 DNS Configuration
- [ ] A record: `hrhub.gr` → Linode IP
- [ ] A record: `*.hrhub.gr` → Linode IP (wildcard)
- [ ] A record: `www.hrhub.gr` → Linode IP
- [ ] DNS propagation test

### 0.6 Linode Object Storage
- [ ] Δημιουργία bucket `hrhub-files`
- [ ] Access Key + Secret
- [ ] Test upload/download
- [ ] Folder structure: `/logos`, `/pdfs`, `/documents`, `/backups`, `/assets`

### 0.7 GitHub Repository
- [ ] Private repo `hrhub`
- [ ] Initial commit με `.gitignore`, `README.md`
- [ ] Branch strategy: `main` (production), `develop` (staging), `feature/*`
- [ ] SSH deploy key στο Linode

### 0.8 GitHub Actions CI/CD
- [ ] Workflow: push to `main` → deploy production
- [ ] Workflow: push to `develop` → deploy staging
- [ ] Environment secrets setup (DB, SMTP, S3, Viva κ.λπ.)
- [ ] Test deployment pipeline

### 0.9 Project Scaffold
- [ ] `npx create-next-app@latest hrhub --typescript --tailwind --app`
- [ ] Install core dependencies
- [ ] `.env` + `.env.example` setup
- [ ] Prisma init + MySQL connection test
- [ ] shadcn/ui init
- [ ] Folder structure setup
- [ ] First PM2 deploy test

### 0.10 Install Script
- [ ] `scripts/setup.ts` — auto-setup script
- [ ] Master DB creation + Prisma migrate
- [ ] Default seed (email templates, settings, super admin)
- [ ] Object Storage bucket creation
- [ ] Test: `npm run setup`

---

## 🏗️ Phase 1 — Master DB + Tenant Provisioning + Super Admin
> Διάρκεια: 3 εβδομάδες

### 1.1 Master Database Schema
- [ ] `tenants` — id, name, subdomain, status, trial_ends_at, plan_id, db_name, active_modules
- [ ] `plans` — id, name, price_per_user, modules_included, max_users
- [ ] `subscriptions` — id, tenant_id, plan_id, status, current_period_end, viva_subscription_id
- [ ] `super_admins` — id, name, email, password_hash, totp_secret
- [ ] `email_templates` — id, trigger_event, module, subject, body_html, variables
- [ ] `platform_logs` — id, level, message, context, created_at
- [ ] Prisma migrate + seed

### 1.2 Authentication
- [ ] NextAuth.js v5 setup
- [ ] JWT strategy + session management
- [ ] Tenant detection middleware (από subdomain)
- [ ] RBAC middleware (Super Admin / Admin / HR / Manager / Employee)
- [ ] Password hashing (bcrypt)
- [ ] Password reset flow (email link)
- [ ] Login page per tenant (branded)

### 1.3 Tenant Provisioning
- [ ] `POST /api/tenants/register` — self-registration endpoint
- [ ] Subdomain validation (unique, lowercase, no special chars)
- [ ] `CREATE DATABASE hrhub_{subdomain}` — dynamic DB creation
- [ ] Auto Prisma migrate σε νέα tenant DB
- [ ] Auto seed (default settings, Greek holidays, email templates)
- [ ] Welcome email μετά εγγραφή
- [ ] Trial countdown (30 μέρες)

### 1.4 Dynamic DB Connection
- [ ] Prisma Client factory ανά tenant
- [ ] Connection pooling
- [ ] Tenant context in request
- [ ] Error handling (tenant not found / suspended)

### 1.5 Super Admin — API
- [ ] `GET /api/admin/tenants` — λίστα με φίλτρα
- [ ] `POST /api/admin/tenants` — manual creation
- [ ] `PATCH /api/admin/tenants/:id` — update status/plan/trial
- [ ] `DELETE /api/admin/tenants/:id` — delete + DROP database
- [ ] `POST /api/admin/tenants/:id/impersonate` — impersonate με audit log
- [ ] `GET /api/admin/stats` — platform statistics
- [ ] `GET /api/admin/logs` — platform logs
- [ ] `GET/PUT /api/admin/email-templates` — CRUD templates
- [ ] `GET/PUT /api/admin/settings` — SMTP, Viva, domain

### 1.6 Super Admin — Frontend
- [ ] Login page (`admin.hrhub.gr`)
- [ ] Dashboard: tenants count, users, revenue, new signups chart
- [ ] Tenants list: search, filter by status, sort
- [ ] Tenant detail: info, modules, billing, actions
- [ ] Suspend / Activate / Delete / Extend trial
- [ ] Impersonate button
- [ ] Email templates list + TipTap editor + send test
- [ ] Settings page: SMTP, Viva Wallet, domain, trial days

---

## 📁 Phase 2 — HR Core
> Διάρκεια: 4 εβδομάδες

### 2.1 Tenant Database Schema
- [ ] `users` — id, name, email, password_hash, role, department_id, is_active, totp_secret
- [ ] `departments` — id, name, manager_id, max_absent_pct, approval_levels
- [ ] `approval_flows` — id, user_id, level1_approver_id, level2_approver_id
- [ ] `org_positions` — id, name, level, is_system, color
- [ ] `employees` — id, user_id, title, position_level, reports_to_id, contract_type, contract_start, contract_end, employment_type, hours_per_week, days_per_week, salary_gross ENCRYPTED, salary_net ENCRYPTED, leave_days_per_year, leave_renewal_date
- [ ] `employee_personal` — id, employee_id, afm ENCRYPTED, amka ENCRYPTED, dob, address, iban ENCRYPTED, nationality ENCRYPTED, residence_permit ENCRYPTED, emergency_name, emergency_phone, photo_url
- [ ] `employee_documents` — id, employee_id, category, filename, file_url, expires_at, version, uploaded_by
- [ ] `employee_history` — id, employee_id, change_type, old_value, new_value, effective_date, changed_by
- [ ] `change_requests` — id, employee_id, field_name, old_value, new_value, reason, status, reviewed_by
- [ ] `notifications` — id, user_id, type, title, body, entity_type, entity_id, is_read
- [ ] `notification_preferences` — id, user_id, notification_type, in_app, email
- [ ] `announcements` — id, title, body_html, department_id, created_by, published_at
- [ ] `announcement_reads` — id, announcement_id, user_id, read_at
- [ ] `audit_logs` — id, user_id, module, action, entity_type, entity_id, old_value, new_value, ip
- [ ] `tenant_branding` — id, logo_url, primary_color, favicon_url, company_name, show_powered_by
- [ ] `smtp_settings` — id, host, port, username, password_encrypted, from_email, from_name, use_tls, is_custom
- [ ] `system_settings` — key, value
- [ ] Prisma migrate + seed

### 2.2 Employee Management — API
- [ ] `GET /api/employees` — λίστα με φίλτρα (τμήμα, ρόλος, status)
- [ ] `POST /api/employees` — δημιουργία + αποστολή invite email
- [ ] `GET /api/employees/:id` — πλήρες προφίλ
- [ ] `PATCH /api/employees/:id` — update (HR/Admin only)
- [ ] `DELETE /api/employees/:id` — soft delete (is_active = false)
- [ ] `POST /api/employees/:id/resend-invite` — resend invite email
- [ ] `GET /api/employees/:id/history` — ιστορικό αλλαγών

### 2.3 Onboarding Flow
- [ ] Magic link generation (72ωρ expiry)
- [ ] `POST /api/auth/activate` — ενεργοποίηση account
- [ ] Step 1: Βασικά προσωπικά (ΑΦΜ, ΑΜΚΑ, ημ. γέννησης)
- [ ] Step 2: Διεύθυνση + emergency contact
- [ ] Step 3: IBAN + ιθαγένεια + άδεια παραμονής
- [ ] Step 4: Φωτογραφία προφίλ
- [ ] AES-256 encryption για sensitive fields
- [ ] Progress bar component
- [ ] HR bypass: συμπλήρωση για λογαριασμό εργαζομένου

### 2.4 Change Requests
- [ ] `POST /api/employees/:id/change-request` — υποβολή αιτήματος
- [ ] `GET /api/change-requests` — λίστα εκκρεμών (HR/Admin)
- [ ] `POST /api/change-requests/:id/approve` — έγκριση
- [ ] `POST /api/change-requests/:id/reject` — απόρριψη με αιτιολογία
- [ ] Notification σε HR κατά υποβολή
- [ ] Notification σε employee κατά απόφαση

### 2.5 Documents
- [ ] `POST /api/employees/:id/documents` — upload με Sharp processing
- [ ] `GET /api/employees/:id/documents` — λίστα
- [ ] `GET /api/employees/:id/documents/:docId` — signed URL (15 λεπτά)
- [ ] `DELETE /api/employees/:id/documents/:docId` — soft delete
- [ ] Version history management
- [ ] Expiry date + reminder cron job
- [ ] Linode Object Storage integration

### 2.6 Departments & Org Chart
- [ ] `GET/POST/PATCH/DELETE /api/departments` — CRUD
- [ ] `GET /api/org-chart` — πλήρες δέντρο ιεραρχίας
- [ ] `GET /api/org-chart/department/:id` — ανά τμήμα
- [ ] Interactive org chart component (d3.js ή react-organizational-chart)
- [ ] Zoom/pan support
- [ ] Export PNG/PDF
- [ ] Σύνδεση με approval flows

### 2.7 Announcements
- [ ] `GET/POST /api/announcements` — CRUD (HR/Admin)
- [ ] `POST /api/announcements/:id/read` — mark as read
- [ ] `GET /api/announcements/:id/reads` — ποιοι διάβασαν
- [ ] Rich text editor (TipTap)
- [ ] Target: all / department / specific users
- [ ] In-app notification κατά δημοσίευση
- [ ] Pinned announcements

### 2.8 Employee Profile — Frontend
- [ ] Employees list page με search + φίλτρα
- [ ] Employee profile page (tabs: Στοιχεία, Έγγραφα, Ιστορικό, Άδειες, Assets)
- [ ] Onboarding wizard (4 steps + progress bar)
- [ ] Change request form
- [ ] Photo upload με crop
- [ ] Department management page
- [ ] Org chart page (interactive)
- [ ] Announcements list + create page

---

## 🎨 Phase 3 — UI + Branding + Notifications
> Διάρκεια: 2 εβδομάδες

### 3.1 Design System
- [ ] shadcn/ui component library setup
- [ ] CSS custom properties για dynamic theming
- [ ] Color palette (primary, secondary, neutrals)
- [ ] Typography scale
- [ ] Spacing system
- [ ] Dark mode implementation (next-themes)
- [ ] Light/Dark toggle με persistence ανά user
- [ ] System preference sync ("Follow system")

### 3.2 White-label Branding
- [ ] Branding API: `GET/PUT /api/settings/branding`
- [ ] Logo upload → Sharp resize (sm/md/lg) → Object Storage
- [ ] Favicon auto-generation (32×32px crop)
- [ ] CSS variables inject ανά tenant request (middleware)
- [ ] Branded login page
- [ ] Branded email header component
- [ ] "Powered by HR Hub" toggle

### 3.3 Navigation & Layout
- [ ] App shell layout (sidebar + header + content)
- [ ] Responsive sidebar (collapse σε mobile)
- [ ] Mobile bottom navigation
- [ ] Breadcrumbs component
- [ ] Page transitions
- [ ] Loading skeletons
- [ ] Navigation items ανά role (RBAC)
- [ ] Module visibility (κρύβει inactive modules)

### 3.4 In-App Notifications
- [ ] Notifications API: `GET /api/notifications`, `PATCH /api/notifications/read-all`
- [ ] Server-Sent Events (SSE) endpoint για real-time
- [ ] Bell icon με badge counter
- [ ] Notification dropdown (last 20)
- [ ] "Mark all as read" button
- [ ] Notification preferences page (email on/off ανά τύπο)
- [ ] Grouping παρόμοιων notifications
- [ ] Notification center page (full history)

### 3.5 i18n Setup
- [ ] next-intl configuration
- [ ] Greek (el) translations file
- [ ] English (en) translations file
- [ ] Language switcher component
- [ ] Date/time locale formatting
- [ ] Number formatting (€ currency)

---

## 🏖️ Phase 4 — Leave Management
> Διάρκεια: 3 εβδομάδες

### 4.1 Database Schema
- [ ] `leave_types` — id, name, code, deducts_balance, requires_approval, max_days_per_year
- [ ] `leave_allocations` — id, user_id, year, leave_type_id, entitled_days, carried_over, used_days
- [ ] `leave_requests` — id, user_id, leave_type_id, start_date, end_date, working_days_count, status, note, pdf_url
- [ ] `leave_approvals` — id, request_id, approver_id, level, action, reason, actioned_at
- [ ] `holidays` — id, name, date, year, is_recurring, type (national/company), created_by
- [ ] Prisma migrate + seed (Greek national holidays 2026)

### 4.2 Holiday Engine
- [ ] Greek holidays calculator (σταθερές + κινητές Πάσχα - Meeus/Jones/Butcher algorithm)
- [ ] Auto-load holidays κάθε 1 Ιανουαρίου (cron job)
- [ ] Admin override: create/edit/delete holidays
- [ ] Company holidays (recurring ή one-time)
- [ ] `GET /api/holidays?year=2026` endpoint

### 4.3 Leave Requests — API
- [ ] `GET /api/leaves` — λίστα με φίλτρα (user, year, status, type)
- [ ] `POST /api/leaves` — υποβολή αιτήματος
- [ ] `GET /api/leaves/:id` — λεπτομέρειες
- [ ] `POST /api/leaves/:id/approve` — έγκριση (επίπεδο 1 ή 2)
- [ ] `POST /api/leaves/:id/reject` — απόρριψη με αιτιολογία
- [ ] `POST /api/leaves/:id/cancel` — ακύρωση (employee)
- [ ] `POST /api/leaves/:id/withdraw` — ανάκληση (pending only)
- [ ] Working days calculator (εξαιρεί αργίες + Σ/Κ βάσει ωραρίου)
- [ ] Balance validation (έλεγχος υπολοίπου)
- [ ] Conflict detection (overlapping requests)

### 4.4 Leave Allocations — API
- [ ] `GET /api/leave-allocations/:userId` — υπόλοιπα ανά έτος
- [ ] `POST /api/leave-allocations` — manual allocation (HR/Admin)
- [ ] `PATCH /api/leave-allocations/:id` — override
- [ ] Αρχαιότητα calculator (βάσει hire_date)
- [ ] Auto-allocation κάθε 1 Ιανουαρίου (cron job)
- [ ] Carried over calculation (από προηγούμενο έτος)

### 4.5 PDF Generation
- [ ] Leave approval PDF template (branded)
- [ ] @react-pdf/renderer component
- [ ] Logo + company name + employee details
- [ ] Upload PDF → Object Storage
- [ ] Email attachment μετά APPROVED

### 4.6 Team Calendar
- [ ] `GET /api/calendar/team?month=2026-03` — ποιοι λείπουν
- [ ] FullCalendar integration
- [ ] Color coding ανά τύπο άδειας
- [ ] Warning στελέχωσης (>X% απόντες)
- [ ] Visibility settings ανά employee (admin ορίζει)

### 4.7 Leave Management — Frontend
- [ ] Employee: My leaves page (balance cards + history + new request button)
- [ ] New leave request form (date picker + live days counter)
- [ ] Manager: Pending approvals page
- [ ] Manager: Team calendar page
- [ ] HR: All leaves page (με φίλτρα)
- [ ] Admin: Leave types management page
- [ ] Admin: Holidays management page
- [ ] Admin: Allocations management page

---

## 📧 Phase 5 — Email System
> Διάρκεια: 2 εβδομάδες

### 5.1 Nodemailer Setup
- [ ] SMTP service (platform + tenant custom)
- [ ] HTML email templates (React Email ή Handlebars)
- [ ] Variable interpolation ({{name}}, {{days}} κ.λπ.)
- [ ] Attachment support (PDF)
- [ ] Email queue (για αποφυγή rate limiting)
- [ ] Retry logic (3 attempts)
- [ ] Delivery logging

### 5.2 Email Templates
- [ ] Welcome / Account activation
- [ ] Leave request submitted (προς approver)
- [ ] Leave approved (προς employee) + PDF attachment
- [ ] Leave rejected (προς employee)
- [ ] Leave cancelled
- [ ] Expense report submitted
- [ ] Expense approved / rejected / paid
- [ ] Asset assigned
- [ ] Assessment sent
- [ ] Assessment reminder
- [ ] Contract expiry reminder
- [ ] Leave balance expiry reminder
- [ ] Trial expiry (7 & 3 ημέρες)
- [ ] Password reset

### 5.3 TipTap Email Editor (Super Admin)
- [ ] Rich text editor component
- [ ] Variable insertion toolbar ({{name}}, {{company}} κ.λπ.)
- [ ] Live preview panel
- [ ] Send test email button
- [ ] Save changes on-the-fly
- [ ] Reset to default button

### 5.4 Cron Jobs (node-cron)
- [ ] Daily: Trial expiry check + reminder emails
- [ ] Daily: Leave balance expiry reminders
- [ ] Daily: Contract expiry reminders
- [ ] Daily: Warranty expiry reminders (assets)
- [ ] Daily: Inactive employees reminder (δεν έχουν πάρει άδεια)
- [ ] 1 Ιανουαρίου: Auto-load holidays νέου έτους
- [ ] 1 Ιανουαρίου: Auto-allocate leave days
- [ ] Weekly: Platform stats email σε Super Admin

---

## 📊 Phase 6 — Dashboards
> Διάρκεια: 2 εβδομάδες

### 6.1 Employee Dashboard
- [ ] Leave balance cards (ανά κατηγορία)
- [ ] Upcoming leaves widget
- [ ] Pending requests widget
- [ ] Recent announcements widget
- [ ] My assets widget
- [ ] Quick actions (New leave request κ.λπ.)

### 6.2 Manager Dashboard
- [ ] Pending approvals widget (leaves + expenses)
- [ ] Team availability today widget
- [ ] Team calendar (FullCalendar)
- [ ] Staffing warning widget
- [ ] Παρουσιολόγιο (ποιος λείπει σήμερα/εβδομάδα)
- [ ] Department stats

### 6.3 HR / Admin Dashboard
- [ ] Company-wide KPIs
- [ ] Leaves by month chart (Recharts LineChart)
- [ ] Leaves by department chart (BarChart)
- [ ] Pending items summary (leaves, expenses, change requests)
- [ ] Expiring contracts widget
- [ ] Top absences widget
- [ ] Quick links

### 6.4 Reports
- [ ] Leave report με φίλτρα
- [ ] Attendance report
- [ ] Export buttons (XLS / PDF)

---

## 💰 Phase 7 — Expenses
> Διάρκεια: 3 εβδομάδες

### 7.1 Database Schema
- [ ] `expense_reports` — id, employee_id, title, description, period_from, period_to, deadline, report_number, status, approver_id, total_amount, currency
- [ ] `expense_lines` — id, report_id, expense_date, vendor_name, category_id, amount, currency, description, project, receipt_url
- [ ] `expense_categories` — id, name, code, max_amount_per_line, receipt_required, is_active
- [ ] `expense_approvals` — id, report_id, approver_id, level, action, reason, actioned_at
- [ ] `expense_payments` — id, report_id, payment_method, payment_date, reference_number, notes, recorded_by
- [ ] `expense_settings` — max_amount_per_report, approval_levels, default_currency
- [ ] `expense_permissions` — user_id, role, can_submit_expenses
- [ ] Prisma migrate + seed (default categories)

### 7.2 Expense Reports — API
- [ ] `GET /api/expenses` — λίστα με φίλτρα (status, employee, period)
- [ ] `POST /api/expenses` — δημιουργία report (DRAFT)
- [ ] `GET /api/expenses/:id` — λεπτομέρειες + lines
- [ ] `PATCH /api/expenses/:id` — update (DRAFT only)
- [ ] `DELETE /api/expenses/:id` — delete (DRAFT only)
- [ ] `POST /api/expenses/:id/submit` — υποβολή (DRAFT → SUBMITTED)
- [ ] `POST /api/expenses/:id/approve` — έγκριση (SUBMITTED → UNDER REVIEW → APPROVED)
- [ ] `POST /api/expenses/:id/reject` — απόρριψη (→ DRAFT)
- [ ] `POST /api/expenses/:id/pay` — καταγραφή πληρωμής (→ PAID)
- [ ] `POST /api/expenses/:id/cancel` — ακύρωση

### 7.3 Expense Lines — API
- [ ] `POST /api/expenses/:id/lines` — προσθήκη line
- [ ] `PATCH /api/expenses/:id/lines/:lineId` — update line
- [ ] `DELETE /api/expenses/:id/lines/:lineId` — διαγραφή line
- [ ] Receipt upload → Object Storage
- [ ] Running total calculation
- [ ] Limit validation (ανά κατηγορία + ανά report)
- [ ] Currency support

### 7.4 PDF Generation
- [ ] Expense report PDF template (branded)
- [ ] Lines table + totals
- [ ] Approval history
- [ ] Payment info
- [ ] Note για φυσικές αποδείξεις (αριθμός report)

### 7.5 Expenses — Frontend
- [ ] My expenses list page
- [ ] New expense report form (header)
- [ ] Expense lines inline form (add/edit/delete)
- [ ] Receipt upload per line (drag & drop)
- [ ] Submit confirmation modal
- [ ] Manager: Pending approvals page
- [ ] HR: All expenses + payment tracking
- [ ] Expense dashboard (charts)
- [ ] Category settings page (Admin)
- [ ] Permissions settings page (Admin)

---

## 📦 Phase 8 — Asset Management
> Διάρκεια: 3 εβδομάδες

### 8.1 Database Schema
- [ ] `asset_types` — id, name, icon, requires_serial, is_shared_allowed, is_system
- [ ] `assets` — id, asset_code, type_id, name, brand, model, serial_number, purchase_date, purchase_value, warranty_expiry, status, location, notes, photo_url, qr_code_url, is_shared
- [ ] `asset_assignments` — id, asset_id, employee_id, assigned_date, expected_return, condition_at_delivery, notes, assigned_by
- [ ] `asset_returns` — id, assignment_id, asset_id, employee_id, returned_date, condition_at_return, notes, photo_url, recorded_by
- [ ] `asset_history` — id, asset_id, event_type, description, old_value, new_value, employee_id, performed_by
- [ ] `asset_maintenance` — id, asset_id, sent_date, reason, returned_date, cost, notes
- [ ] `offboarding_checklists` — id, employee_id, termination_date, assets JSON, completed_at
- [ ] Prisma migrate + seed (default asset types)

### 8.2 Assets — API
- [ ] `GET /api/assets` — λίστα με φίλτρα (type, status, employee)
- [ ] `POST /api/assets` — δημιουργία + auto QR generation
- [ ] `GET /api/assets/:id` — λεπτομέρειες + history
- [ ] `PATCH /api/assets/:id` — update
- [ ] `DELETE /api/assets/:id` — soft delete (status = retired)
- [ ] `POST /api/assets/:id/assign` — ανάθεση σε εργαζόμενο
- [ ] `POST /api/assets/:id/return` — καταγραφή επιστροφής
- [ ] `POST /api/assets/:id/maintenance` — αποστολή για service
- [ ] `GET /api/assets/:id/qr` — QR code image
- [ ] `POST /api/assets/qr-labels` — bulk QR PDF

### 8.3 QR Code System
- [ ] QR generation (qrcode library) κατά δημιουργία asset
- [ ] URL format: `https://company.hrhub.gr/assets/{asset_code}`
- [ ] QR label PDF template (branded, bulk)
- [ ] Public asset page (redirect to login αν δεν είναι logged in)

### 8.4 Offboarding Integration
- [ ] Hook στο employee termination (HR Core)
- [ ] Auto-fetch assigned assets κατά αποχώρηση
- [ ] Offboarding checklist creation
- [ ] `GET /api/offboarding/:employeeId/checklist`
- [ ] `PATCH /api/offboarding/:employeeId/checklist/:assetId` — mark as returned
- [ ] Reminder cron: X μέρες μετά αποχώρηση αν assets δεν επιστράφηκαν

### 8.5 Assets — Frontend
- [ ] Assets catalog page (list + grid view)
- [ ] Asset detail page (info + history timeline)
- [ ] New asset form
- [ ] Assign to employee modal
- [ ] Return asset modal (κατάσταση + φωτογραφία)
- [ ] QR labels print page
- [ ] Dashboard: summary ανά τύπο, εκκρεμείς επιστροφές
- [ ] Employee profile: My Assets tab
- [ ] Offboarding checklist modal

---

## 🎯 Phase 9 — Performance Reviews
> Διάρκεια: 4 εβδομάδες

### 9.1 Database Schema
- [ ] `assessment_templates` — id, title, description, period_from, period_to, deadline, created_by, target_type, status, scoring_enabled, results_visible_to_employee, include_self_assessment
- [ ] `assessment_recipients` — id, template_id, employee_id, sent_at
- [ ] `assessment_questions` — id, template_id, question_text, question_type, weight, order_index, is_required
- [ ] `assessment_options` — id, question_id, option_text, score, order_index
- [ ] `assessment_responses` — id, template_id, employee_id, respondent_id, response_type (self/manager), submitted_at, total_score
- [ ] `assessment_answers` — id, response_id, question_id, selected_option_ids, text_answer, scale_value, score_earned
- [ ] `assessment_meeting_notes` — id, template_id, employee_id, manager_id, meeting_date, notes_html, action_items, next_goals, shared_with_employee
- [ ] Prisma migrate

### 9.2 Assessment Builder — API
- [ ] `GET /api/assessments` — λίστα (με ιστορικό)
- [ ] `POST /api/assessments` — δημιουργία (DRAFT)
- [ ] `GET /api/assessments/:id` — πλήρης λεπτομέρεια
- [ ] `PATCH /api/assessments/:id` — update (DRAFT only)
- [ ] `POST /api/assessments/:id/publish` — δημοσίευση + notifications
- [ ] `POST /api/assessments/:id/duplicate` — αντιγραφή → νέο DRAFT
- [ ] `POST /api/assessments/:id/close` — κλείσιμο
- [ ] Questions CRUD (add/edit/delete/reorder)
- [ ] Options CRUD με score per option
- [ ] Weight validation (αθροίζουν 100%)

### 9.3 Assessment Responses — API
- [ ] `GET /api/assessments/:id/my-response` — δική μου απάντηση
- [ ] `POST /api/assessments/:id/responses` — save/submit response
- [ ] `GET /api/assessments/:id/responses` — όλες (Manager/HR)
- [ ] `GET /api/assessments/:id/responses/:employeeId` — συγκεκριμένου (Manager)
- [ ] Score calculation (weighted average)
- [ ] Comparison: self vs manager

### 9.4 Meeting Notes — API
- [ ] `GET/POST/PATCH /api/assessments/:id/meeting-notes/:employeeId`
- [ ] Share with employee toggle

### 9.5 Performance — Frontend
- [ ] Assessment list page (με ιστορικό ανά περίοδο)
- [ ] Assessment builder (drag & drop questions, question types)
- [ ] Question editor (options + scores + weight)
- [ ] Preview mode
- [ ] Publish + recipients modal
- [ ] Duplicate & edit flow
- [ ] Employee: My assessments page
- [ ] Assessment form (multi-step, progress bar, save draft)
- [ ] Manager: Results dashboard (% completion, scores table)
- [ ] Manager: Employee results detail (side-by-side)
- [ ] Meeting notes editor (TipTap + action items)
- [ ] Results comparison chart (current vs previous)

---

## 💾 Phase 10 — Data, Security, i18n
> Διάρκεια: 2 εβδομάδες

### 10.1 XLS Export (Leave)
- [ ] Export modal με φίλτρα (από/έως, employee, τμήμα, έτος, κατηγορία, status)
- [ ] ExcelJS: 4 καρτέλες (Εργαζόμενοι / Υπόλοιπα / Αιτήματα / Audit Log)
- [ ] Logo embed στην Καρτέλα 1
- [ ] Frozen header rows + auto-filter
- [ ] Filename: `hrhub_export_{company}_{date}.xlsx`

### 10.2 XLS Import (Leave)
- [ ] Upload .xlsx endpoint
- [ ] Header signature validation (LeaveFlow format check)
- [ ] Preview screen (αλλαγές που θα γίνουν)
- [ ] Conflict detection (existing data)
- [ ] Merge vs Replace επιλογή
- [ ] Import execution με transaction
- [ ] Rollback σε αποτυχία
- [ ] Audit log entry

### 10.3 Audit Log
- [ ] Audit middleware (auto-log σε κάθε mutation)
- [ ] `GET /api/audit-logs` — φίλτρα (user, action, date range)
- [ ] Audit log viewer (HR/Admin)
- [ ] Immutable (no delete/edit)

### 10.4 2FA (Two-Factor Authentication)
- [ ] speakeasy TOTP setup
- [ ] QR code generation για authenticator app
- [ ] 2FA enable/disable (user settings)
- [ ] Backup codes generation
- [ ] 2FA verification σε login

### 10.5 i18n Completion
- [ ] Πλήρης ελληνική μετάφραση (el.json)
- [ ] Πλήρης αγγλική μετάφραση (en.json)
- [ ] Date/time locale formatting
- [ ] Currency formatting
- [ ] Language switcher

### 10.6 Security
- [ ] Rate limiting (API routes)
- [ ] CORS configuration
- [ ] CSP headers
- [ ] SQL injection prevention (Prisma parameterized queries)
- [ ] XSS prevention
- [ ] Sensitive data masking σε logs
- [ ] Session expiry configuration

---

## 💳 Phase 11 — Billing (Viva Wallet)
> Διάρκεια: 2 εβδομάδες

### 11.1 Viva Wallet Integration
- [ ] Viva SDK setup
- [ ] API Key + Secret configuration
- [ ] Test mode / Live mode toggle
- [ ] Payment page (hosted ή embedded)
- [ ] Webhook endpoint (`/api/webhooks/viva`)
- [ ] Webhook signature verification
- [ ] Subscription creation
- [ ] Subscription cancellation
- [ ] Payment success handler → activate tenant
- [ ] Payment failure handler → notification

### 11.2 Subscription Management
- [ ] Plans display page (για tenants)
- [ ] Upgrade/downgrade plan
- [ ] Add/remove modules
- [ ] Billing history page (invoices)
- [ ] Current plan widget στο Admin dashboard
- [ ] Auto-suspend trigger (payment failed)
- [ ] Reactivation flow (after payment)

### 11.3 Trial Management
- [ ] Trial countdown widget
- [ ] "Upgrade now" CTA
- [ ] Trial expiry cron (daily check)
- [ ] Reminder emails (7 & 3 ημέρες πριν)
- [ ] Auto-suspend μετά λήξη
- [ ] Suspended page (με payment CTA)
- [ ] Super Admin: extend trial manually

---

## 🚀 Phase 12 — UAT + Production
> Διάρκεια: 2 εβδομάδες

### 12.1 Testing
- [ ] Vitest: unit tests για utilities (date calculations, scoring κ.λπ.)
- [ ] Vitest: API route tests
- [ ] Playwright: E2E tests για critical flows (login, leave request, expense)
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile testing (iOS Safari, Android Chrome)

### 12.2 Performance
- [ ] Next.js bundle analysis (`@next/bundle-analyzer`)
- [ ] Image optimization (next/image)
- [ ] API response caching (Redis ή in-memory)
- [ ] Database query optimization (indexes)
- [ ] Lazy loading για heavy components
- [ ] Lighthouse score > 90

### 12.3 Mobile Polish
- [ ] Responsive breakpoints review (mobile, tablet, desktop)
- [ ] Touch-friendly tap targets (min 44px)
- [ ] Mobile navigation optimization
- [ ] Form usability σε mobile
- [ ] PWA manifest (optional)

### 12.4 Production Deploy
- [ ] Staging environment final testing
- [ ] Environment variables production check
- [ ] Database backup πριν deploy
- [ ] Zero-downtime deployment (PM2 cluster)
- [ ] Post-deploy smoke tests
- [ ] Monitoring alerts setup (Uptime Kuma)
- [ ] Error tracking setup (Sentry optional)

### 12.5 Documentation
- [ ] README.md (setup, deployment, env vars)
- [ ] API documentation (Swagger/OpenAPI optional)
- [ ] Admin user guide
- [ ] Tenant onboarding guide

---

## 🔮 Future — v2.0

- [ ] Native Mobile App (iOS + Android) — touch signature για assets
- [ ] ΕΡΓΑΝΗ sync
- [ ] Stripe alternative billing
- [ ] Custom SMTP per tenant (premium feature)
- [ ] WordPress Plugin wrapper
- [ ] Zapier / Make integrations
- [ ] Advanced analytics & reporting
- [ ] HR chatbot (AI-powered)

---

## 📁 Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@prisma/client": "^5.0.0",
    "next-auth": "^5.0.0",
    "nodemailer": "^6.0.0",
    "node-cron": "^3.0.0",
    "sharp": "^0.33.0",
    "exceljs": "^4.0.0",
    "@react-pdf/renderer": "^3.0.0",
    "speakeasy": "^2.0.0",
    "qrcode": "^1.5.0",
    "@aws-sdk/client-s3": "^3.0.0",
    "zod": "^3.0.0",
    "bcryptjs": "^2.4.0",
    "zustand": "^4.0.0",
    "@tanstack/react-query": "^5.0.0",
    "next-intl": "^3.0.0",
    "next-themes": "^0.2.0",
    "@fullcalendar/react": "^6.0.0",
    "recharts": "^2.0.0",
    "@tiptap/react": "^2.0.0",
    "react-hook-form": "^7.0.0",
    "winston": "^3.0.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0",
    "@playwright/test": "^1.0.0",
    "tailwindcss": "^3.0.0"
  }
}
```

---

## 🔐 Environment Variables

```env
# Database
DATABASE_URL=mysql://user:pass@localhost:3306/hrhub_master

# Auth
NEXTAUTH_URL=https://hrhub.gr
NEXTAUTH_SECRET=

# Platform SMTP
PLATFORM_SMTP_HOST=
PLATFORM_SMTP_PORT=587
PLATFORM_SMTP_USER=
PLATFORM_SMTP_PASS=
PLATFORM_FROM_EMAIL=noreply@hrhub.gr
PLATFORM_FROM_NAME=HR Hub

# Linode Object Storage
LINODE_S3_ENDPOINT=https://eu-central-1.linodeobjects.com
LINODE_S3_BUCKET=hrhub-files
LINODE_S3_KEY=
LINODE_S3_SECRET=
LINODE_S3_REGION=eu-central-1

# Viva Wallet
VIVA_API_KEY=
VIVA_SECRET=
VIVA_MERCHANT_ID=
VIVA_MODE=test

# App
DOMAIN=hrhub.gr
NODE_ENV=production
ENCRYPTION_KEY=
```

---

*HR Hub Development Plan v1.0 — Μάρτιος 2026*
