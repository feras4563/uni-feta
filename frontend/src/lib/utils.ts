import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toLatinDigits(value: string | number | null | undefined) {
  const input = String(value ?? "")
  return input
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

export function formatDecimal(value: number, fractionDigits = 3) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Number(value) || 0)
}

export function formatCurrency(value: number, currencyLabel = "دينار") {
  return `${formatNumber(value)} ${currencyLabel}`
}

export function formatPercent(value: number) {
  return `${formatNumber(value)}%`
}

export function formatDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  return toLatinDigits(new Intl.DateTimeFormat("en-GB").format(date))
}

export function formatLongDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  return toLatinDigits(
    new Intl.DateTimeFormat("ar", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      numberingSystem: "latn",
    }).format(date)
  )
}

export function formatDateTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  return toLatinDigits(
    new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  )
}
