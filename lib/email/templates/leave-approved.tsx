// HTML email template for leave approved
// Used as fallback if no DB template exists

export function leaveApprovedTemplate(vars: {
  name: string
  leaveType: string
  startDate: string
  endDate: string
  days: number
  companyName: string
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Έγκριση Άδειας</title>
</head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:#2E5FA3;padding:32px 40px;">
      <h1 style="color:white;margin:0;font-size:24px;">${vars.companyName}</h1>
    </div>
    <!-- Body -->
    <div style="padding:40px;">
      <div style="display:inline-block;padding:8px 16px;background:#e6f4ed;color:#1a7a4a;border-radius:20px;font-size:14px;font-weight:600;margin-bottom:24px;">
        ✅ Άδεια Εγκρίθηκε
      </div>
      <h2 style="color:#1a1a2e;margin:0 0 16px;">Γεια σας, ${vars.name}!</h2>
      <p style="color:#666;line-height:1.6;">Η αίτησή σας για άδεια εγκρίθηκε. Παρακάτω θα βρείτε τις λεπτομέρειες:</p>
      
      <div style="background:#f5f7fa;border-radius:8px;padding:24px;margin:24px 0;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#666;font-size:14px;">Τύπος Άδειας</td>
            <td style="padding:8px 0;color:#1a1a2e;font-weight:600;font-size:14px;text-align:right;">${vars.leaveType}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#666;font-size:14px;">Από</td>
            <td style="padding:8px 0;color:#1a1a2e;font-weight:600;font-size:14px;text-align:right;">${vars.startDate}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#666;font-size:14px;">Έως</td>
            <td style="padding:8px 0;color:#1a1a2e;font-weight:600;font-size:14px;text-align:right;">${vars.endDate}</td>
          </tr>
          <tr style="border-top:1px solid #e2e8f0;">
            <td style="padding:12px 0 8px;color:#1a1a2e;font-weight:700;">Σύνολο Εργάσιμων Ημερών</td>
            <td style="padding:12px 0 8px;color:#2E5FA3;font-weight:700;font-size:20px;text-align:right;">${vars.days}</td>
          </tr>
        </table>
      </div>

      <p style="color:#666;font-size:14px;">Η βεβαίωση άδειας επισυνάπτεται σε αυτό το email.</p>
    </div>
    <!-- Footer -->
    <div style="padding:24px 40px;background:#f5f7fa;border-top:1px solid #e2e8f0;">
      <p style="margin:0;color:#999;font-size:12px;text-align:center;">
        Powered by ErgoHub · <a href="#" style="color:#2E5FA3;">Απόρριψη ειδοποιήσεων</a>
      </p>
    </div>
  </div>
</body>
</html>
  `
}
