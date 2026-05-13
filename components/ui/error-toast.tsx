'use client'

import { useEffect } from 'react'
import { AlertCircle, X } from 'lucide-react'

interface ErrorToastProps {
  message: string | null
  onClose: () => void
  duration?: number
}

export function ErrorToast({ message, onClose, duration = 10000 }: ErrorToastProps) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [message, duration, onClose])

  if (!message) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 shadow-lg">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
      <p className="text-sm text-destructive whitespace-pre-line">{message}</p>
      <button onClick={onClose} className="ml-auto shrink-0 text-destructive/70 hover:text-destructive">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}