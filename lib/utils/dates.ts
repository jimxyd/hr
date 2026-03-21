import { format, parseISO, isValid, differenceInYears } from "date-fns"
import { el } from "date-fns/locale"

export const formatDate = (date: Date | string, fmt = "dd/MM/yyyy"): string => {
  const d = typeof date === "string" ? parseISO(date) : date
  return isValid(d) ? format(d, fmt, { locale: el }) : "-"
}

export const formatDateTime = (date: Date | string): string =>
  formatDate(date, "dd/MM/yyyy HH:mm")

export const calculateSeniority = (hireDate: Date | string): number => {
  const d = typeof hireDate === "string" ? parseISO(hireDate) : hireDate
  return differenceInYears(new Date(), d)
}

export const getLeaveDaysEntitlement = (seniorityYears: number): number =>
  Math.min(20 + seniorityYears, 25)
