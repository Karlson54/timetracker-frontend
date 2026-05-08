import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function msToHours(ms: number): number {
  return Math.round((ms / 3600000) * 10) / 10
}

export function parseApiError(err: any, fallback = 'Виникла помилка'): string {
  const data = err?.response?.data

  if (!data) return err?.message || fallback

  if (data.errors && typeof data.errors === 'object') {
    const messages = Object.values(data.errors)
      .flat()
      .filter((m): m is string => typeof m === 'string')
    if (messages.length > 0) return messages.join('\n')
  }

  if (data.Message) return data.Message
  if (data.message) return data.message
  if (data.title) return data.title
  if (typeof data === 'string') return data

  return err?.message || fallback
}

export function formatEmployeeName(fullName: string) {
  if (!fullName) return { firstName: '', lastName: '' }

  const nameParts = fullName.trim().split(' ')

  if (nameParts.length === 1) {
    return { firstName: nameParts[0], lastName: '' }
  }

  return {
    firstName: nameParts[0],
    lastName: nameParts.slice(1).join(' '),
  }
}