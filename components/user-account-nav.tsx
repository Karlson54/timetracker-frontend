'use client'

import { useAuthContext } from '@/lib/AuthContext'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function UserAccountNav() {
  const { user, logout } = useAuthContext()

  if (!user) return null

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-700">{user.name}</span>
      <Button variant="ghost" size="icon" onClick={logout}>
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  )
}