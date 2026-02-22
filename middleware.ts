import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicRoutes = ['/login', '/signup', '/forgot-password']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = publicRoutes.some(route => pathname.startsWith(route))

  if (isPublic) {
    return NextResponse.next()
  }

  // Проверка токена происходит на клиенте через AuthContext
  // Middleware только пропускает запросы
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}