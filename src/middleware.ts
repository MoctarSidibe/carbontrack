import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'carbontrack-secret-key-change-in-production'
)

function roleHome(role: unknown) {
  if (role === 'admin') return '/admin'
  if (role === 'expert') return '/expert'
  return '/dashboard'
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Admin routes (except /admin/login) ──────────────────────────────────
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      if (payload.role !== 'admin') {
        return NextResponse.redirect(new URL(roleHome(payload.role), request.url))
      }
    } catch {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // ── If already logged-in admin visits /admin/login, skip to admin ────────
  if (pathname.startsWith('/admin/login')) {
    const token = request.cookies.get('token')?.value
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET)
        if (payload.role === 'admin') {
          return NextResponse.redirect(new URL('/admin', request.url))
        }
      } catch {
        // bad token — let them see the login page
      }
    }
  }

  // ── Expert routes (except /expert/login) ────────────────────────────────
  if (pathname.startsWith('/expert') && !pathname.startsWith('/expert/login')) {
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.redirect(new URL('/expert/login', request.url))
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      if (payload.role !== 'expert') {
        return NextResponse.redirect(new URL(roleHome(payload.role), request.url))
      }
    } catch {
      return NextResponse.redirect(new URL('/expert/login', request.url))
    }
  }

  // ── If already logged-in expert visits /expert/login, skip to expert ────
  if (pathname.startsWith('/expert/login')) {
    const token = request.cookies.get('token')?.value
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET)
        if (payload.role === 'expert') {
          return NextResponse.redirect(new URL('/expert', request.url))
        }
      } catch {
        // bad token — let them see the login page
      }
    }
  }

  // ── Dashboard / subscription: redirect non-company users to their portal ─
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/') || pathname === '/subscription') {
    const token = request.cookies.get('token')?.value
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET)
        if (payload.role === 'expert') {
          return NextResponse.redirect(new URL('/expert', request.url))
        }
        if (payload.role === 'admin') {
          return NextResponse.redirect(new URL('/admin', request.url))
        }
      } catch {
        // bad/expired token — let the page's own auth handle it
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/expert/:path*', '/dashboard', '/dashboard/:path*', '/subscription'],
}
