'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuthContext } from '@/lib/AuthContext'
import authService from '@/lib/api/services/authService'

export function LoginForm() {
  const [loginOrEmail, setLoginOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, isAdmin } = useAuthContext()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await authService.login({ loginOrEmail, password })
      login(response)

      // Редирект по роли
      const roles = response.roles
      if (roles.includes('Admin')) {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      const message = err.response?.data?.message
      setError(message || 'Невірний логін або пароль')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="loginOrEmail">Email або логін</Label>
        <Input
          id="loginOrEmail"
          type="text"
          value={loginOrEmail}
          onChange={(e) => setLoginOrEmail(e.target.value)}
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
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Завантаження...' : 'Увійти'}
      </Button>
    </form>
  )
}