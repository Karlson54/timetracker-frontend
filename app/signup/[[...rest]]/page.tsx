'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'

export default function SignupPage() {
  const { t } = useTranslation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8 bg-card rounded-lg shadow border border-border text-center space-y-4">
        <h2 className="text-2xl font-bold text-foreground">{t('signup.title')}</h2>
        <p className="text-muted-foreground">{t('signup.description')}</p>
        <Link href="/login" className="text-primary hover:text-primary/80 text-sm">
          {t('signup.backToLogin')}
        </Link>
      </div>
    </div>
  )
}