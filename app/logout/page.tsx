'use client'

import { useEffect } from 'react'
import { useAuthContext } from '@/lib/AuthContext'

export default function LogoutPage() {
  const { logout } = useAuthContext()

  useEffect(() => {
    logout()
  }, [logout])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">Вихід із системи...</h1>
      <p>Виконується вихід та перенаправлення на сторінку входу.</p>
    </div>
  )
}