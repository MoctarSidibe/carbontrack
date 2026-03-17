import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyPassword, createToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 })
    }

    const result = await query(
      'SELECT id, email, password_hash, company_id, role, first_name, last_name FROM users WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 })
    }

    const user = result.rows[0]
    const valid = await verifyPassword(password, user.password_hash)

    if (!valid) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 })
    }

    const token = await createToken({
      userId: user.id,
      email: user.email,
      companyId: user.company_id,
      role: user.role,
    })

    const response = NextResponse.json({
      success: true,
      role: user.role,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        companyId: user.company_id,
        role: user.role,
      },
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Erreur de connexion' }, { status: 500 })
  }
}
