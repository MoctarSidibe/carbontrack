import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'carbontrack-secret-key-change-in-production'
)

const COOKIE = {
  admin:  'adm_token',
  expert: 'exp_token',
  user:   'token',
}

function roleHome(role: unknown) {
  if (role === 'admin') return '/admin'
  if (role === 'expert') return '/expert'
  return '/dashboard'
}

async function verifyRole(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return (payload.role as string) ?? null
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Admin routes (except /admin/login) ──────────────────────────────────
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get(COOKIE.admin)?.value
    if (!token) return NextResponse.redirect(new URL('/admin/login', request.url))
    const role = await verifyRole(token)
    if (role !== 'admin') return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // ── Already-logged-in admin visits /admin/login → skip to /admin ─────────
  if (pathname.startsWith('/admin/login')) {
    const token = request.cookies.get(COOKIE.admin)?.value
    if (token && (await verifyRole(token)) === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  // ── Expert routes (except /expert/login) ────────────────────────────────
  if (pathname.startsWith('/expert') && !pathname.startsWith('/expert/login')) {
    const token = request.cookies.get(COOKIE.expert)?.value
    if (!token) return NextResponse.redirect(new URL('/expert/login', request.url))
    const role = await verifyRole(token)
    if (role !== 'expert') return NextResponse.redirect(new URL('/expert/login', request.url))
  }

  // ── Already-logged-in expert visits /expert/login → skip to /expert ──────
  if (pathname.startsWith('/expert/login')) {
    const token = request.cookies.get(COOKIE.expert)?.value
    if (token && (await verifyRole(token)) === 'expert') {
      return NextResponse.redirect(new URL('/expert', request.url))
    }
  }

  // ── Dashboard: redirect admins/experts to their portal ───────────────────
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/') || pathname === '/subscription') {
    const token = request.cookies.get(COOKIE.user)?.value
    if (token) {
      const role = await verifyRole(token)
      if (role === 'expert') return NextResponse.redirect(new URL('/expert', request.url))
      if (role === 'admin')  return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/expert/:path*', '/dashboard', '/dashboard/:path*', '/subscription'],
}
