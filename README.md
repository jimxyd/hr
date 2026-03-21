# HR Hub 🏢

> Ολοκληρωμένη SaaS Πλατφόρμα Διαχείρισης Ανθρώπινου Δυναμικού

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue)](https://mysql.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-5.0-darkblue)](https://prisma.io)

---

## 📋 Περιγραφή

Το **HR Hub** είναι ένα multi-tenant SaaS platform που επιτρέπει σε εταιρείες να διαχειρίζονται ολόκληρο τον κύκλο ζωής των εργαζομένων τους. Κάθε εταιρεία αποκτά το δικό της απομονωμένο περιβάλλον στο `company.hrhub.gr` με πλήρες white-label branding.

### ✨ Modules

| Module | Περιγραφή |
|--------|-----------|
| 🏖️ **Leave Management** | Άδειες, εγκρίσεις, αργίες, PDF βεβαιώσεις |
| 📁 **HR Core** | Ψηφιακός φάκελος, onboarding, Org Chart, Announcements |
| 🎯 **Performance Reviews** | Custom assessments, scoring, 1:1 meetings |
| 💰 **Expenses** | Expense reports, approval flow, payment tracking |
| 📦 **Assets** | Εξοπλισμός, QR ετικέτες, ανάθεση, επιστροφή |

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18** + TypeScript
- **Tailwind CSS** + **shadcn/ui**
- **TanStack Query** + **Zustand**
- **FullCalendar** + **Recharts** + **TipTap**

### Backend
- **Next.js API Routes**
- **Prisma** ORM + **MySQL 8**
- **NextAuth.js v5**
- **Nodemailer** + **node-cron**
- **Sharp** + **ExcelJS** + **@react-pdf/renderer**

### Infrastructure
- **Linode VPS** + **Nginx** + **PM2**
- **Let's Encrypt** (Wildcard SSL)
- **Linode Object Storage** (S3-compatible)
- **GitHub Actions** (CI/CD)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20 LTS
- MySQL 8.0
- Git

### 1. Clone Repository
```bash
git clone git@github.com:yourusername/hrhub.git
cd hrhub
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env
# Συμπλήρωσε τα credentials στο .env
```

### 4. Auto Setup (πρώτη φορά)
```bash
npm run setup
```

Το script κάνει αυτόματα:
- ✅ Δημιουργία Master Database
- ✅ Prisma migrations
- ✅ Default seed data
- ✅ Super Admin account
- ✅ Object Storage buckets

### 5. Development Server
```bash
npm run dev
```

Άνοιξε [http://localhost:3000](http://localhost:3000)

Super Admin panel: [http://admin.localhost:3000](http://admin.localhost:3000)

---

## 📁 Project Structure

```
hrhub/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth pages (login, register, reset)
│   ├── (tenant)/                 # Tenant app pages
│   │   ├── dashboard/
│   │   ├── employees/
│   │   ├── leaves/
│   │   ├── expenses/
│   │   ├── assets/
│   │   ├── performance/
│   │   └── settings/
│   ├── (super-admin)/            # Super Admin panel
│   │   ├── tenants/
│   │   ├── billing/
│   │   ├── templates/
│   │   └── settings/
│   └── api/                      # API Routes
│       ├── auth/
│       ├── tenants/
│       ├── employees/
│       ├── leaves/
│       ├── expenses/
│       ├── assets/
│       ├── performance/
│       ├── notifications/
│       ├── admin/
│       └── webhooks/
├── components/                   # Shared components
│   ├── ui/                       # shadcn/ui components
│   ├── forms/
│   ├── charts/
│   ├── calendar/
│   └── layout/
├── lib/                          # Utilities & helpers
│   ├── prisma/                   # Prisma clients (master + tenant)
│   ├── auth/                     # NextAuth config
│   ├── email/                    # Nodemailer + templates
│   ├── storage/                  # S3 client
│   ├── pdf/                      # PDF generation
│   ├── excel/                    # Excel import/export
│   ├── encryption/               # AES-256 helpers
│   └── utils/                    # Date, validation κ.λπ.
├── prisma/
│   ├── master/                   # Master DB schema
│   │   └── schema.prisma
│   └── tenant/                   # Tenant DB schema
│       └── schema.prisma
├── scripts/
│   ├── setup.ts                  # Install script
│   └── seed.ts                   # Seed data
├── public/
├── messages/                     # i18n translations
│   ├── el.json
│   └── en.json
├── .env.example
├── .gitignore
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

---

## 🌐 Multi-tenant Architecture

```
hrhub.gr              → Marketing / Landing page
admin.hrhub.gr        → Super Admin Panel
company.hrhub.gr      → Tenant App (branded)
```

**Tenant Detection Flow:**
1. Request → Nginx → Next.js με header `X-Tenant: company`
2. Middleware διαβάζει subdomain
3. Query Master DB → tenant info + db_name
4. Dynamic Prisma connection σε tenant DB
5. Render branded app

---

## 🔐 Environment Variables

Δες το αρχείο `.env.example` για πλήρη λίστα.

**Κρίσιμα:**
```env
DATABASE_URL=mysql://user:pass@localhost:3306/hrhub_master
NEXTAUTH_SECRET=your-secret-here
ENCRYPTION_KEY=your-32-char-key-here
DOMAIN=hrhub.gr
```

---

## 🚢 Deployment

### Production Deploy (GitHub Actions)
```bash
git push origin main
# → Αυτόματο deploy μέσω GitHub Actions
```

### Manual Deploy
```bash
npm run build
pm2 restart hrhub
```

### Database Migrations
```bash
# Master DB
npx prisma migrate deploy --schema=prisma/master/schema.prisma

# Tenant DB (για όλους τους tenants)
npm run migrate:all-tenants
```

---

## 📊 Plans & Pricing

| Plan | Modules | Τιμή |
|------|---------|------|
| **Basic** | Leave + HR Core + Announcements | TBD ανά user/μήνα |
| **+ Performance** | Add-on: Performance Reviews | TBD ανά user/μήνα |
| **+ Expenses** | Add-on: Expenses | TBD ανά user/μήνα |
| **+ Assets** | Add-on: Asset Management | TBD ανά user/μήνα |

Trial: **30 ημέρες δωρεάν** — όλα τα modules

---

## 📝 License

Private — All rights reserved

---

*HR Hub v1.0 — Μάρτιος 2026*
