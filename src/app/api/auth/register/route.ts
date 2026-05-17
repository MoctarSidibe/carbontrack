import { NextRequest, NextResponse } from 'next/server'
import { query, withTransaction } from '@/lib/db'
import { hashPassword, createToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, companyName, phone, rccm, sector } = await request.json()

    if (!email || !password || !firstName || !lastName || !companyName || !phone) {
      return NextResponse.json({ error: 'Tous les champs obligatoires doivent être remplis' }, { status: 400 })
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Un compte avec cet email existe déjà' }, { status: 409 })
    }

    const hashedPassword = await hashPassword(password)

    // Company + user created atomically — if user insert fails, company is rolled back
    const { userId, companyId } = await withTransaction(async (client) => {
      const companyResult = await client.query(
        'INSERT INTO companies (name, rccm, sector) VALUES ($1, $2, $3) RETURNING id',
        [companyName, rccm || null, sector || null]
      )
      const companyId = companyResult.rows[0].id

      const userResult = await client.query(
        'INSERT INTO users (email, password_hash, first_name, last_name, phone, company_id, role) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        [email, hashedPassword, firstName, lastName, phone, companyId, 'user']
      )
      return { userId: userResult.rows[0].id, companyId }
    })

    const token = await createToken({ userId, email, companyId, role: 'user' })

    const response = NextResponse.json({ success: true, userId, companyId })
    response.cookies.set('token', token, {
      httpOnly: true,
      // Opt-in via env so HTTP-only deploys don't get cookies dropped by browser
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('Registration error:', errMsg)
    return NextResponse.json({ error: "Erreur lors de l'inscription. Veuillez réessayer." }, { status: 500 })
  }
}
