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

export function LoginForm() {
  const [loginOrEmail, setLoginOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuthContext()
  const router = useRouter()

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
      setError(parseApiError(err, 'Невірний логін або пароль'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="loginOrEmail">Email або логін</Label>
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
          <Label htmlFor="password">Пароль</Label>
          <Link href="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500">
            Забули пароль?
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
        {isLoading ? 'Завантаження...' : 'Увійти'}
      </Button>
    </form>
  )
}