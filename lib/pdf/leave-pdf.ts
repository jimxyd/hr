import { renderToBuffer } from "@react-pdf/renderer"
import { createElement } from "react"

// Simple leave approval PDF
// Returns a Buffer containing the PDF
export async function generateLeaveApprovalPDF(data: {
  employeeName: string
  leaveType: string
  startDate: Date
  endDate: Date
  workingDays: number
  approvedBy: string
  approvedAt: Date
  companyName: string
  logoUrl?: string
}): Promise<Buffer> {
  // Dynamic import to avoid SSR issues
  const { Document, Page, Text, View, StyleSheet, Font } = await import("@react-pdf/renderer")

  const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: "Helvetica", backgroundColor: "#FFFFFF" },
    header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 40, paddingBottom: 20, borderBottom: "2 solid #2E5FA3" },
    company: { fontSize: 20, fontWeight: "bold", color: "#2E5FA3" },
    title: { fontSize: 24, fontWeight: "bold", color: "#1a1a2e", marginBottom: 8 },
    subtitle: { fontSize: 12, color: "#666", marginBottom: 32 },
    badge: { backgroundColor: "#e6f4ed", padding: "8 16", borderRadius: 20, marginBottom: 24, alignSelf: "flex-start" },
    badgeText: { color: "#1a7a4a", fontSize: 12, fontWeight: "bold" },
    table: { backgroundColor: "#f5f7fa", borderRadius: 8, padding: 20, marginBottom: 24 },
    row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottom: "1 solid #e2e8f0" },
    rowLast: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
    label: { fontSize: 12, color: "#666" },
    value: { fontSize: 12, fontWeight: "bold", color: "#1a1a2e" },
    footer: { marginTop: 40, paddingTop: 20, borderTop: "1 solid #e2e8f0" },
    footerText: { fontSize: 10, color: "#999", textAlign: "center" },
  })

  const doc = createElement(Document, null,
    createElement(Page, { size: "A4", style: styles.page },
      // Header
      createElement(View, { style: styles.header },
        createElement(Text, { style: styles.company }, data.companyName),
        createElement(Text, { style: { fontSize: 10, color: "#999" } }, 
          `Εκδόθηκε: ${new Date().toLocaleDateString("el-GR")}`)
      ),
      // Badge
      createElement(View, { style: styles.badge },
        createElement(Text, { style: styles.badgeText }, "✓ ΕΓΚΕΚΡΙΜΕΝΗ ΑΔΕΙΑ")
      ),
      // Title
      createElement(Text, { style: styles.title }, "Βεβαίωση Αδείας"),
      createElement(Text, { style: styles.subtitle }, 
        `Βεβαιώνεται ότι ο/η ${data.employeeName} έλαβε την παρακάτω άδεια.`),
      // Table
      createElement(View, { style: styles.table },
        createElement(View, { style: styles.row },
          createElement(Text, { style: styles.label }, "Εργαζόμενος"),
          createElement(Text, { style: styles.value }, data.employeeName)
        ),
        createElement(View, { style: styles.row },
          createElement(Text, { style: styles.label }, "Τύπος Άδειας"),
          createElement(Text, { style: styles.value }, data.leaveType)
        ),
        createElement(View, { style: styles.row },
          createElement(Text, { style: styles.label }, "Από"),
          createElement(Text, { style: styles.value }, data.startDate.toLocaleDateString("el-GR"))
        ),
        createElement(View, { style: styles.row },
          createElement(Text, { style: styles.label }, "Έως"),
          createElement(Text, { style: styles.value }, data.endDate.toLocaleDateString("el-GR"))
        ),
        createElement(View, { style: styles.row },
          createElement(Text, { style: styles.label }, "Εργάσιμες Ημέρες"),
          createElement(Text, { style: { ...styles.value, color: "#2E5FA3", fontSize: 16 } }, String(data.workingDays))
        ),
        createElement(View, { style: styles.rowLast },
          createElement(Text, { style: styles.label }, "Εγκρίθηκε από"),
          createElement(Text, { style: styles.value }, `${data.approvedBy} — ${data.approvedAt.toLocaleDateString("el-GR")}`)
        ),
      ),
      // Footer
      createElement(View, { style: styles.footer },
        createElement(Text, { style: styles.footerText }, 
          "Το έγγραφο αυτό δημιουργήθηκε αυτόματα από το ErgoHub και είναι έγκυρο χωρίς σφραγίδα.")
      )
    )
  )

  const buffer = await renderToBuffer(doc)
  return Buffer.from(buffer)
}
