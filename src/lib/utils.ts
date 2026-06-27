import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a number as currency with C$MM suffix */
export function fmtMM(value: number, decimals = 1): string {
  return `C$${value.toFixed(decimals)}MM`
}

/** Format a number as a percentage */
export function fmtPct(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/** Format a plain number with commas */
export function fmtNum(value: number, decimals = 0): string {
  return value.toLocaleString('en-CA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/** Format a date string to locale date */
export function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Parse a string to number, returning fallback if invalid */
export function parseNum(str: string, fallback = 0): number {
  const n = parseFloat(str)
  return isNaN(n) ? fallback : n
}

/** Sum an array of numbers */
export function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0)
}

/** Generate a simple ID */
export function genId(): string {
  return Math.random().toString(36).slice(2, 9)
}
