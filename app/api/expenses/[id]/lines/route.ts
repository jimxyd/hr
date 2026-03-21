import { NextRequest, NextResponse } from "next/server"
import { withTenantAuth } from "@/lib/utils/api-helpers"
import { successResponse, errorResponse } from "@/types/api"
import { uploadFile, generateKey } from "@/lib/storage"
import { z } from "zod"
import { Decimal } from "@prisma/client/runtime/library"

const lineSchema = z.object({
  expenseDate: z.string(),
  vendorName: z.string().min(1),
  categoryId: z.string(),
  amount: z.number().positive(),
  currency: z.string().default("EUR"),
  description: z.string().optional(),
  project: z.string().optional(),
})

export const POST = withTenantAuth(async (req, { params, session, db }) => {
  const report = await db.expenseReport.findUnique({ where: { id: params.id } })
  if (!report) return NextResponse.json(errorResponse("NOT_FOUND", "Report δεν βρέθηκε"), { status: 404 })
  if (!["DRAFT", "REJECTED"].includes(report.status)) {
    return NextResponse.json(errorResponse("INVALID_STATUS", "Δεν επιτρέπεται η προσθήκη γραμμής"), { status: 400 })
  }

  const contentType = req.headers.get("content-type") || ""
  let lineData: any
  let receiptUrl: string | undefined

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData()
    const json = formData.get("data") as string
    lineData = JSON.parse(json)

    const receipt = formData.get("receipt") as File | null
    if (receipt) {
      const buffer = Buffer.from(await receipt.arrayBuffer())
      const key = generateKey(`expenses/${params.id}`, receipt.name)
      receiptUrl = await uploadFile(key, buffer, receipt.type)
    }
  } else {
    lineData = await req.json()
  }

  const data = lineSchema.safeParse(lineData)
  if (!data.success) {
    return NextResponse.json(errorResponse("VALIDATION_ERROR", "Σφάλμα επικύρωσης"), { status: 400 })
  }

  // Check category limits
  const category = await db.expenseCategory.findUnique({ where: { id: data.data.categoryId } })
  if (category?.maxAmountPerLine && data.data.amount > Number(category.maxAmountPerLine)) {
    return NextResponse.json(
      errorResponse("LIMIT_EXCEEDED", `Υπέρβαση ορίου κατηγορίας: max €${category.maxAmountPerLine}`),
      { status: 400 }
    )
  }

  if (category?.receiptRequired && !receiptUrl) {
    return NextResponse.json(
      errorResponse("RECEIPT_REQUIRED", `Απαιτείται απόδειξη για: ${category.name}`),
      { status: 400 }
    )
  }

  const line = await db.expenseLine.create({
    data: {
      reportId: params.id,
      expenseDate: new Date(data.data.expenseDate),
      vendorName: data.data.vendorName,
      categoryId: data.data.categoryId,
      amount: data.data.amount,
      currency: data.data.currency,
      description: data.data.description,
      project: data.data.project,
      receiptUrl,
    }
  })

  // Recalculate total
  const lines = await db.expenseLine.findMany({ where: { reportId: params.id } })
  const total = lines.reduce((sum, l) => sum + Number(l.amount), 0)
  await db.expenseReport.update({ where: { id: params.id }, data: { totalAmount: total } })

  return NextResponse.json(successResponse(line), { status: 201 })
})

export const GET = withTenantAuth(async (req, { params, db }) => {
  const lines = await db.expenseLine.findMany({
    where: { reportId: params.id },
    include: { category: true },
    orderBy: { expenseDate: "asc" },
  })
  return NextResponse.json(successResponse(lines))
})
