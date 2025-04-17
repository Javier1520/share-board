import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const isAuthenticated = request.cookies.has('access_token')
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                    request.nextUrl.pathname.startsWith('/register')

  // Redirect to login if accessing protected route without auth
  if (!isAuthenticated && !isAuthPage && request.nextUrl.pathname !== '/') {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect to rooms if accessing auth pages while authenticated
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL('/rooms', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
