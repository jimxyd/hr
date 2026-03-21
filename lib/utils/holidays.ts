// Greek Orthodox Easter (Meeus/Jones/Butcher algorithm)
export function getGreekEaster(year: number): Date {
  const a = year % 4, b = year % 7, c = year % 19
  const d = (19 * c + 15) % 30
  const e = (2 * a + 4 * b - d + 34) % 7
  const month = Math.floor((d + e + 114) / 31)
  const day = ((d + e + 114) % 31) + 1
  const julian = new Date(year, month - 1, day)
  // Julian to Gregorian: +13 days
  return new Date(julian.getTime() + 13 * 86400000)
}

export function getGreekHolidays(year: number) {
  const easter = getGreekEaster(year)
  const add = (d: Date, days: number) => new Date(d.getTime() + days * 86400000)
  return [
    { name: "Πρωτοχρονιά", date: new Date(year, 0, 1), isRecurring: true },
    { name: "Θεοφάνεια", date: new Date(year, 0, 6), isRecurring: true },
    { name: "Εθνική Επέτειος 25ης Μαρτίου", date: new Date(year, 2, 25), isRecurring: true },
    { name: "Εργατική Πρωτομαγιά", date: new Date(year, 4, 1), isRecurring: true },
    { name: "Κοίμηση Θεοτόκου", date: new Date(year, 7, 15), isRecurring: true },
    { name: "Εθνική Επέτειος 28ης Οκτωβρίου", date: new Date(year, 9, 28), isRecurring: true },
    { name: "Χριστούγεννα", date: new Date(year, 11, 25), isRecurring: true },
    { name: "Σύναξη Θεοτόκου", date: new Date(year, 11, 26), isRecurring: true },
    { name: "Καθαρά Δευτέρα", date: add(easter, -48), isRecurring: false },
    { name: "Μεγάλη Παρασκευή", date: add(easter, -2), isRecurring: false },
    { name: "Δευτέρα Πάσχα", date: add(easter, 1), isRecurring: false },
    { name: "Αγίου Πνεύματος", date: add(easter, 50), isRecurring: false },
  ]
}

export function calculateWorkingDays(
  start: Date, end: Date, holidays: Date[], daysPerWeek = 5
): number {
  let count = 0
  const cur = new Date(start)
  while (cur <= end) {
    const day = cur.getDay()
    const isWeekend = daysPerWeek === 5 ? day === 0 || day === 6 : day === 0
    const isHoliday = holidays.some(h => h.toDateString() === cur.toDateString())
    if (!isWeekend && !isHoliday) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}
