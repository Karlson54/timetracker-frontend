'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'
import { useAuthContext } from '@/lib/AuthContext'
import authService from '@/lib/api/services/authService'
import { parseApiError } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

export function LoginForm() {
  const [loginOrEmail, setLoginOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuthContext()
  const router = useRouter()
  const { t } = useTranslation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await authService.login({ loginOrEmail, password })
      login(response)
      const roles = response.roles
      if (roles.includes('Admin')) {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(parseApiError(err, t('common.errors.saveFailed')))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="loginOrEmail">{t('login.emailOrLogin')}</Label>
        <Input
          id="loginOrEmail"
          type="text"
          value={loginOrEmail}
          onChange={(e) => { setLoginOrEmail(e.target.value); setError('') }}
          placeholder="your.email@example.com"
          required
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{t('login.password')}</Label>
          <Link href="/forgot-password" className="text-sm font-medium text-primary hover:text-primary/80">
            {t('login.forgotPassword')}
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError('') }}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? t('login.submitting') : t('login.submit')}
      </Button>
    </form>
  )
}