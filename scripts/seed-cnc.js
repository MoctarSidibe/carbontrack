/**
 * Seed script: Create CNC (Conseil National du Climat) users
 *
 * Usage: node scripts/seed-cnc.js
 *
 * This script creates:
 *  1. A "Conseil National du Climat" company (if not exists)
 *  2. A default CNC user (if not exists)
 *
 * Connection: uses DATABASE_URL env var, or individual PG* vars.
 */

const { Pool } = require('pg')
const bcrypt = require('bcryptjs')

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  try {
    // Ensure CNC company exists
    const companyResult = await pool.query(
      `INSERT INTO companies (name, rccm, sector)
       VALUES ('Conseil National du Climat', 'CNC-GABON-001', 'Administration publique')
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`
    )
    const companyId = companyResult.rows[0].id
    console.log(`✅ CNC company: id=${companyId}`)

    // Create default CNC user
    const passwordHash = await bcrypt.hash('Cnc@2026!', 12)
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, company_id, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET
         first_name = EXCLUDED.first_name,
         last_name  = EXCLUDED.last_name,
         role       = EXCLUDED.role
       RETURNING id, email, role`,
      [
        'cnc@carbontrack.gouv.ga',
        passwordHash,
        'Commission',
        'CNC',
        '+24100000000',
        companyId,
        'cnc',
      ]
    )

    const u = userResult.rows[0]
    console.log(`✅ CNC user created: id=${u.id}, email=${u.email}, role=${u.role}`)
    console.log('   Email: cnc@carbontrack.gouv.ga')
    console.log('   Password: Cnc@2026!')
    console.log('   Login at: /cnc/login')
  } finally {
    await pool.end()
  }
}

main().catch(err => {
  console.error('Seed CNC failed:', err)
  process.exit(1)
})
