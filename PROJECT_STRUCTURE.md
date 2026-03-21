# HR Hub — Project Structure
> Αναλυτική Αρχιτεκτονική & Οργάνωση Αρχείων

---

## 📁 Πλήρης Δομή Φακέλων

```
hrhub/
│
├── 📁 app/                                    # Next.js 14 App Router
│   │
│   ├── 📁 (auth)/                             # Auth group (no layout)
│   │   ├── login/page.tsx                     # Login page (branded ανά tenant)
│   │   ├── register/page.tsx                  # Self-registration
│   │   ├── reset-password/page.tsx            # Password reset request
│   │   ├── reset-password/[token]/page.tsx    # New password form
│   │   └── activate/[token]/page.tsx          # Account activation (onboarding)
│   │
│   ├── 📁 (tenant)/                           # Tenant app (με sidebar layout)
│   │   ├── layout.tsx                         # Main layout (sidebar + header)
│   │   ├── dashboard/page.tsx                 # Dashboard (role-based)
│   │   │
│   │   ├── 📁 profile/
│   │   │   ├── page.tsx                       # My profile
│   │   │   ├── onboarding/page.tsx            # Onboarding wizard
│   │   │   └── settings/page.tsx             # Notification preferences, 2FA
│   │   │
│   │   ├── 📁 employees/                      # HR Core — Εργαζόμενοι
│   │   │   ├── page.tsx                       # Employees list
│   │   │   ├── new/page.tsx                   # Create employee
│   │   │   ├── [id]/page.tsx                  # Employee profile
│   │   │   ├── [id]/edit/page.tsx             # Edit employee (HR/Admin)
│   │   │   └── [id]/documents/page.tsx        # Employee documents
│   │   │
│   │   ├── 📁 org-chart/
│   │   │   └── page.tsx                       # Interactive org chart
│   │   │
│   │   ├── 📁 announcements/
│   │   │   ├── page.tsx                       # Announcements list
│   │   │   └── new/page.tsx                   # Create announcement (HR/Admin)
│   │   │
│   │   ├── 📁 leaves/                         # Leave Management
│   │   │   ├── page.tsx                       # My leaves + balance
│   │   │   ├── new/page.tsx                   # New leave request
│   │   │   ├── [id]/page.tsx                  # Leave detail
│   │   │   ├── approvals/page.tsx             # Pending approvals (Manager/HR)
│   │   │   ├── calendar/page.tsx              # Team calendar
│   │   │   └── reports/page.tsx               # Leave reports (HR/Admin)
│   │   │
│   │   ├── 📁 expenses/                       # Expenses
│   │   │   ├── page.tsx                       # My expense reports
│   │   │   ├── new/page.tsx                   # New expense report
│   │   │   ├── [id]/page.tsx                  # Expense report detail + lines
│   │   │   ├── approvals/page.tsx             # Pending approvals
│   │   │   ├── payments/page.tsx              # Payment tracking (HR/Admin)
│   │   │   └── reports/page.tsx               # Expense reports (HR/Admin)
│   │   │
│   │   ├── 📁 assets/                         # Asset Management
│   │   │   ├── page.tsx                       # Assets catalog
│   │   │   ├── new/page.tsx                   # Add new asset
│   │   │   ├── [id]/page.tsx                  # Asset detail + history
│   │   │   ├── qr-labels/page.tsx             # QR labels print
│   │   │   └── reports/page.tsx               # Assets reports
│   │   │
│   │   ├── 📁 performance/                    # Performance Reviews
│   │   │   ├── page.tsx                       # My assessments
│   │   │   ├── create/page.tsx                # Assessment builder
│   │   │   ├── [id]/page.tsx                  # Assessment detail
│   │   │   ├── [id]/fill/page.tsx             # Fill assessment (employee)
│   │   │   ├── [id]/results/page.tsx          # Results dashboard (manager)
│   │   │   └── [id]/meeting-notes/page.tsx    # 1:1 meeting notes
│   │   │
│   │   └── 📁 settings/                       # Admin Settings
│   │       ├── general/page.tsx               # Company info, branding
│   │       ├── departments/page.tsx           # Departments management
│   │       ├── leave-types/page.tsx           # Leave types config
│   │       ├── holidays/page.tsx              # Holidays management
│   │       ├── approvals/page.tsx             # Approval flows config
│   │       ├── expense-categories/page.tsx    # Expense categories
│   │       ├── asset-types/page.tsx           # Asset types
│   │       └── smtp/page.tsx                  # Custom SMTP settings
│   │
│   ├── 📁 (super-admin)/                      # Super Admin Panel
│   │   ├── layout.tsx                         # Super admin layout
│   │   ├── dashboard/page.tsx                 # Platform overview
│   │   ├── 📁 tenants/
│   │   │   ├── page.tsx                       # Tenants list
│   │   │   ├── new/page.tsx                   # Create tenant manually
│   │   │   └── [id]/page.tsx                  # Tenant detail
│   │   ├── 📁 billing/
│   │   │   └── page.tsx                       # Billing overview
│   │   ├── 📁 templates/
│   │   │   └── page.tsx                       # Email templates editor
│   │   ├── 📁 logs/
│   │   │   └── page.tsx                       # Platform logs
│   │   └── 📁 settings/
│   │       └── page.tsx                       # SMTP, Viva, domain
│   │
│   └── 📁 api/                                # API Routes
│       ├── 📁 auth/
│       │   ├── [...nextauth]/route.ts          # NextAuth handler
│       │   ├── activate/route.ts              # Account activation
│       │   └── reset-password/route.ts        # Password reset
│       │
│       ├── 📁 tenants/
│       │   ├── route.ts                       # GET list, POST create
│       │   └── [id]/
│       │       ├── route.ts                   # GET, PATCH, DELETE
│       │       └── impersonate/route.ts       # Impersonate
│       │
│       ├── 📁 employees/
│       │   ├── route.ts                       # GET list, POST create
│       │   └── [id]/
│       │       ├── route.ts                   # GET, PATCH, DELETE
│       │       ├── documents/route.ts         # Documents CRUD
│       │       ├── history/route.ts           # Change history
│       │       └── change-request/route.ts    # Submit change request
│       │
│       ├── 📁 departments/route.ts
│       ├── 📁 org-chart/route.ts
│       ├── 📁 announcements/route.ts
│       │
│       ├── 📁 leaves/
│       │   ├── route.ts                       # GET list, POST create
│       │   ├── [id]/route.ts                  # GET, PATCH
│       │   ├── [id]/approve/route.ts
│       │   ├── [id]/reject/route.ts
│       │   ├── [id]/cancel/route.ts
│       │   ├── allocations/route.ts
│       │   ├── holidays/route.ts
│       │   └── calendar/route.ts
│       │
│       ├── 📁 expenses/
│       │   ├── route.ts
│       │   ├── [id]/route.ts
│       │   ├── [id]/lines/route.ts
│       │   ├── [id]/submit/route.ts
│       │   ├── [id]/approve/route.ts
│       │   ├── [id]/reject/route.ts
│       │   └── [id]/pay/route.ts
│       │
│       ├── 📁 assets/
│       │   ├── route.ts
│       │   ├── [id]/route.ts
│       │   ├── [id]/assign/route.ts
│       │   ├── [id]/return/route.ts
│       │   ├── [id]/qr/route.ts
│       │   └── qr-labels/route.ts
│       │
│       ├── 📁 performance/
│       │   ├── route.ts
│       │   ├── [id]/route.ts
│       │   ├── [id]/publish/route.ts
│       │   ├── [id]/duplicate/route.ts
│       │   ├── [id]/responses/route.ts
│       │   └── [id]/meeting-notes/route.ts
│       │
│       ├── 📁 notifications/
│       │   ├── route.ts                       # GET notifications
│       │   ├── read-all/route.ts
│       │   ├── preferences/route.ts
│       │   └── stream/route.ts                # SSE endpoint
│       │
│       ├── 📁 admin/                          # Super Admin APIs
│       │   ├── tenants/route.ts
│       │   ├── stats/route.ts
│       │   ├── logs/route.ts
│       │   ├── email-templates/route.ts
│       │   └── settings/route.ts
│       │
│       ├── 📁 settings/
│       │   ├── branding/route.ts
│       │   └── smtp/route.ts
│       │
│       └── 📁 webhooks/
│           └── viva/route.ts                  # Viva Wallet webhooks
│
├── 📁 components/                             # Reusable Components
│   │
│   ├── 📁 ui/                                 # shadcn/ui (auto-generated)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── table.tsx
│   │   ├── badge.tsx
│   │   ├── card.tsx
│   │   ├── calendar.tsx
│   │   ├── date-picker.tsx
│   │   ├── select.tsx
│   │   ├── tabs.tsx
│   │   ├── toast.tsx
│   │   └── ...
│   │
│   ├── 📁 layout/
│   │   ├── sidebar.tsx                        # App sidebar (role-based nav)
│   │   ├── header.tsx                         # Top header + notifications bell
│   │   ├── mobile-nav.tsx                     # Bottom mobile navigation
│   │   └── breadcrumbs.tsx
│   │
│   ├── 📁 notifications/
│   │   ├── notification-bell.tsx              # Bell icon + badge
│   │   ├── notification-dropdown.tsx          # Dropdown list
│   │   └── notification-item.tsx              # Single notification
│   │
│   ├── 📁 forms/
│   │   ├── leave-request-form.tsx
│   │   ├── expense-line-form.tsx
│   │   ├── employee-form.tsx
│   │   └── assessment-builder-form.tsx
│   │
│   ├── 📁 charts/
│   │   ├── leaves-by-month-chart.tsx
│   │   ├── expenses-by-category-chart.tsx
│   │   ├── department-comparison-chart.tsx
│   │   └── score-comparison-chart.tsx
│   │
│   ├── 📁 calendar/
│   │   ├── team-calendar.tsx                  # FullCalendar wrapper
│   │   └── leave-calendar.tsx
│   │
│   ├── 📁 org-chart/
│   │   └── org-chart-tree.tsx                 # Interactive d3 tree
│   │
│   ├── 📁 pdf/
│   │   ├── leave-approval-pdf.tsx
│   │   ├── expense-report-pdf.tsx
│   │   └── asset-handover-pdf.tsx
│   │
│   └── 📁 common/
│       ├── status-badge.tsx                   # Colored status badges
│       ├── file-upload.tsx                    # Drag & drop uploader
│       ├── data-table.tsx                     # Sortable/filterable table
│       ├── page-header.tsx
│       ├── empty-state.tsx
│       ├── loading-skeleton.tsx
│       └── confirm-dialog.tsx
│
├── 📁 lib/                                    # Core Libraries & Utilities
│   │
│   ├── 📁 prisma/
│   │   ├── master.ts                          # Master DB Prisma client
│   │   ├── tenant.ts                          # Tenant DB Prisma client factory
│   │   └── middleware.ts                      # Tenant detection middleware
│   │
│   ├── 📁 auth/
│   │   ├── config.ts                          # NextAuth.js config
│   │   ├── rbac.ts                            # Role-based access control
│   │   └── helpers.ts                         # getSession, requireRole κ.λπ.
│   │
│   ├── 📁 email/
│   │   ├── client.ts                          # Nodemailer setup
│   │   ├── sender.ts                          # Send email function
│   │   ├── queue.ts                           # Email queue
│   │   └── 📁 templates/
│   │       ├── welcome.tsx
│   │       ├── leave-approved.tsx
│   │       ├── leave-rejected.tsx
│   │       ├── expense-approved.tsx
│   │       ├── trial-expiry.tsx
│   │       └── ...
│   │
│   ├── 📁 storage/
│   │   ├── client.ts                          # S3 client (Linode)
│   │   ├── upload.ts                          # Upload helper
│   │   ├── download.ts                        # Signed URL generator
│   │   └── delete.ts
│   │
│   ├── 📁 pdf/
│   │   ├── leave-pdf.ts                       # Generate leave approval PDF
│   │   ├── expense-pdf.ts                     # Generate expense report PDF
│   │   └── asset-pdf.ts                       # Generate asset handover PDF
│   │
│   ├── 📁 excel/
│   │   ├── export.ts                          # XLS export (4 καρτέλες)
│   │   └── import.ts                          # XLS import + validation
│   │
│   ├── 📁 encryption/
│   │   ├── encrypt.ts                         # AES-256 encrypt
│   │   └── decrypt.ts                         # AES-256 decrypt
│   │
│   ├── 📁 qr/
│   │   ├── generate.ts                        # QR code generation
│   │   └── labels-pdf.ts                      # Bulk QR labels PDF
│   │
│   ├── 📁 cron/
│   │   ├── index.ts                           # Cron jobs registration
│   │   ├── trial-expiry.ts                    # Trial check + emails
│   │   ├── leave-reminders.ts                 # Leave expiry reminders
│   │   ├── contract-reminders.ts              # Contract expiry reminders
│   │   ├── holiday-loader.ts                  # Annual holiday load
│   │   └── leave-allocator.ts                 # Annual leave allocation
│   │
│   └── 📁 utils/
│       ├── dates.ts                           # Date helpers
│       ├── working-days.ts                    # Working days calculator
│       ├── holidays.ts                        # Greek holidays calculator
│       ├── seniority.ts                       # Seniority & leave entitlement
│       ├── scoring.ts                         # Assessment score calculator
│       ├── formatting.ts                      # Currency, dates formatting
│       └── validation.ts                      # Zod schemas
│
├── 📁 prisma/
│   ├── 📁 master/
│   │   ├── schema.prisma                      # Master DB schema
│   │   └── 📁 migrations/
│   └── 📁 tenant/
│       ├── schema.prisma                      # Tenant DB schema
│       └── 📁 migrations/
│
├── 📁 scripts/
│   ├── setup.ts                               # First-time install script
│   ├── seed-master.ts                         # Seed master DB
│   ├── seed-tenant.ts                         # Seed new tenant DB
│   ├── migrate-all-tenants.ts                 # Run migrations on all tenant DBs
│   └── create-tenant.ts                       # Manual tenant creation CLI
│
├── 📁 public/
│   ├── favicon.ico
│   ├── logo.svg                               # Default HR Hub logo
│   └── 📁 images/
│
├── 📁 messages/                               # i18n translations
│   ├── el.json                                # Greek
│   └── en.json                                # English
│
├── 📁 types/                                  # TypeScript type definitions
│   ├── auth.d.ts                              # NextAuth type extensions
│   ├── tenant.d.ts
│   ├── employee.d.ts
│   ├── leave.d.ts
│   ├── expense.d.ts
│   ├── asset.d.ts
│   └── performance.d.ts
│
├── 📁 hooks/                                  # Custom React Hooks
│   ├── use-tenant.ts                          # Current tenant context
│   ├── use-notifications.ts                   # SSE notifications
│   ├── use-permissions.ts                     # RBAC helpers
│   └── use-branding.ts                        # Current tenant branding
│
├── 📁 middleware.ts                            # Next.js middleware (tenant detection + auth)
│
├── 📁 .github/
│   └── 📁 workflows/
│       ├── production.yml                     # Deploy to production (push to main)
│       └── staging.yml                        # Deploy to staging (push to develop)
│
├── .env                                       # Local environment (not committed)
├── .env.example                               # Environment template
├── .gitignore
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
├── README.md
├── DEVELOPMENT_PLAN.md
└── PROJECT_STRUCTURE.md
```

---

## 🔑 Key Architectural Decisions

### 1. Multi-tenant: Database per Tenant
```
hrhub_master          → Tenants, plans, billing, super admins
hrhub_acme            → Acme Corp data
hrhub_globex          → Globex Corp data
hrhub_initech         → Initech data
```

### 2. Tenant Detection Middleware
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host')
  const subdomain = hostname?.split('.')[0]
  
  // admin.hrhub.gr → Super Admin
  if (subdomain === 'admin') {
    return handleSuperAdmin(request)
  }
  
  // company.hrhub.gr → Tenant App
  request.headers.set('x-tenant', subdomain)
  return NextResponse.next()
}
```

### 3. Dynamic Prisma Connection
```typescript
// lib/prisma/tenant.ts
const tenantClients = new Map<string, PrismaClient>()

export function getTenantPrisma(dbName: string): PrismaClient {
  if (!tenantClients.has(dbName)) {
    const client = new PrismaClient({
      datasources: {
        db: { url: `mysql://.../${dbName}` }
      }
    })
    tenantClients.set(dbName, client)
  }
  return tenantClients.get(dbName)!
}
```

### 4. CSS Variables για White-label
```typescript
// middleware.ts — inject tenant colors
const branding = await getTenantBranding(subdomain)
response.headers.set(
  'x-tenant-primary-color',
  branding.primary_color || '#2E5FA3'
)

// layout.tsx — apply to :root
<style>{`
  :root {
    --primary: ${primaryColor};
    --primary-foreground: #ffffff;
  }
`}</style>
```

### 5. RBAC Middleware
```typescript
// lib/auth/rbac.ts
export const PERMISSIONS = {
  'leaves:read':    ['employee', 'manager', 'hr', 'admin'],
  'leaves:approve': ['manager', 'hr', 'admin'],
  'employees:write':['hr', 'admin'],
  'settings:write': ['admin'],
  // ...
}

export function requirePermission(permission: string) {
  return async (req: Request) => {
    const session = await getSession()
    if (!hasPermission(session.user.role, permission)) {
      return new Response('Forbidden', { status: 403 })
    }
  }
}
```

---

## 📊 Database Architecture

### Master DB Tables
```
tenants              plans               subscriptions
super_admins         email_templates     platform_logs
```

### Tenant DB Tables
```
Core:
  users              departments         approval_flows
  org_positions      notifications       notification_preferences
  audit_logs         tenant_branding     smtp_settings
  system_settings

HR Core (M2):
  employees          employee_personal   employee_documents
  employee_history   change_requests
  announcements      announcement_reads

Leaves (M1):
  leave_types        leave_allocations   leave_requests
  leave_approvals    holidays

Performance (M3):
  assessment_templates    assessment_questions    assessment_options
  assessment_responses    assessment_answers      assessment_meeting_notes
  assessment_recipients

Expenses (M5):
  expense_reports    expense_lines       expense_categories
  expense_approvals  expense_payments    expense_settings
  expense_permissions

Assets (M6):
  asset_types        assets              asset_assignments
  asset_returns      asset_history       asset_maintenance
  offboarding_checklists
```

---

## 🚦 API Response Format

```typescript
// Success
{
  success: true,
  data: { ... },
  meta: { total: 100, page: 1, limit: 20 }  // για paginated responses
}

// Error
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Το email είναι υποχρεωτικό',
    fields: { email: 'Required' }  // για form validation errors
  }
}
```

---

## 🔄 Branch Strategy

```
main           → Production (protected, deploy on push)
develop        → Staging (deploy on push)
feature/*      → New features (PR to develop)
fix/*          → Bug fixes (PR to develop)
hotfix/*       → Critical fixes (PR to main + develop)
```

---

## 📦 Module Dependencies

```
M2 (HR Core)  ←── M1 (Leaves)        requires: users, departments
M2 (HR Core)  ←── M3 (Performance)   requires: users, org_chart
M2 (HR Core)  ←── M5 (Expenses)      requires: users, departments
M2 (HR Core)  ←── M6 (Assets)        requires: users, offboarding
```

**M2 HR Core είναι υποχρεωτικό** — όλα τα άλλα modules εξαρτώνται από αυτό.

---

*HR Hub Project Structure v1.0 — Μάρτιος 2026*
