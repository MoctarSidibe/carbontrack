import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { assessmentId: string } }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { assessmentId } = params

    // Fetch assessment with site and company info
    const assessmentResult = await query(
      `SELECT a.*, s.name as site_name, s.type as site_type, s.address as site_address,
              c.name as company_name, c.rccm, c.sector
       FROM assessments a 
       JOIN sites s ON a.site_id = s.id 
       JOIN companies c ON s.company_id = c.id
       WHERE a.id = $1 AND c.id = $2`,
      [assessmentId, session.companyId]
    )

    if (assessmentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Bilan non trouvé' }, { status: 404 })
    }

    const assessment = assessmentResult.rows[0]

    // Fetch all emission entries
    const entriesResult = await query(
      'SELECT * FROM emission_entries WHERE assessment_id = $1 ORDER BY scope, category, subcategory',
      [assessmentId]
    )

    // Build GHG Protocol report
    const ghgProtocol = {
      scope1: entriesResult.rows.filter((e: { scope: number }) => e.scope === 1),
      scope2: entriesResult.rows.filter((e: { scope: number }) => e.scope === 2),
      scope3: entriesResult.rows.filter((e: { scope: number }) => e.scope === 3),
    }

    // Group by GHG category
    const byGhgCategory: Record<string, { entries: unknown[]; total: number }> = {}
    for (const entry of entriesResult.rows) {
      const cat = entry.ghg_category || 'Autre'
      if (!byGhgCategory[cat]) byGhgCategory[cat] = { entries: [], total: 0 }
      byGhgCategory[cat].entries.push(entry)
      byGhgCategory[cat].total += parseFloat(entry.total_co2eq) || 0
    }

    // Group by category for overview
    const byCategory: Record<string, number> = {}
    for (const entry of entriesResult.rows) {
      const cat = entry.category
      byCategory[cat] = (byCategory[cat] || 0) + (parseFloat(entry.total_co2eq) || 0)
    }

    // Group by subcategory
    const bySubcategory: Record<string, { total: number; scope: number; category: string; count: number }> = {}
    for (const entry of entriesResult.rows) {
      const key = entry.subcategory || entry.category
      if (!bySubcategory[key]) bySubcategory[key] = { total: 0, scope: 0, category: entry.category, count: 0 }
      bySubcategory[key].total += parseFloat(entry.total_co2eq) || 0
      bySubcategory[key].scope = entry.scope
      bySubcategory[key].count++
    }

    // Upstream vs Combustion by category
    const upstreamVsCombustion: Record<string, { upstream: number; combustion: number; total: number }> = {}
    for (const entry of entriesResult.rows) {
      const cat = entry.category
      if (!upstreamVsCombustion[cat]) upstreamVsCombustion[cat] = { upstream: 0, combustion: 0, total: 0 }
      const qty = parseFloat(entry.quantity) || 0
      const fv = parseFloat(entry.factor_value) || 0
      const totalEntry = parseFloat(entry.total_co2eq) || 0
      // Approximate upstream ratio from factor if available
      // factor_value is the total factor, we estimate upstream as (total - combustion portion)
      // Since we store total_co2eq but not split, approximate 50/50 for factors without explicit split
      upstreamVsCombustion[cat].total += totalEntry
    }

    // Top emitters (individual emission sources ranked by total)
    const topEmitters = entriesResult.rows
      .map((e: { factor_name: string; total_co2eq: string; scope: number; category: string; quantity: string; unit: string }) => ({
        name: e.factor_name,
        total: parseFloat(e.total_co2eq) || 0,
        scope: e.scope,
        category: e.category,
        quantity: parseFloat(e.quantity) || 0,
        unit: e.unit,
      }))
      .filter((e: { total: number }) => e.total > 0)
      .sort((a: { total: number }, b: { total: number }) => b.total - a.total)
      .slice(0, 15)

    // Group by ISO category with scope info
    const byIsoCategory: Record<string, { total: number; scope: number; count: number }> = {}
    for (const entry of entriesResult.rows) {
      const key = entry.iso_category || 'Autre'
      if (!byIsoCategory[key]) byIsoCategory[key] = { total: 0, scope: 0, count: 0 }
      byIsoCategory[key].total += parseFloat(entry.total_co2eq) || 0
      byIsoCategory[key].scope = entry.scope
      byIsoCategory[key].count++
    }

    // Monthly breakdown (aggregated across all years)
    const monthLabels = ['', 'Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec']
    const byMonth: { month: number; label: string; total: number; scope1: number; scope2: number; scope3: number }[] = []
    for (let m = 1; m <= 12; m++) {
      const monthEntries = entriesResult.rows.filter((e: { month: number }) => (parseInt(String(e.month)) || 0) === m)
      byMonth.push({
        month: m,
        label: monthLabels[m],
        total: monthEntries.reduce((s: number, e: { total_co2eq: string }) => s + (parseFloat(e.total_co2eq) || 0), 0),
        scope1: monthEntries.filter((e: { scope: number }) => e.scope === 1).reduce((s: number, e: { total_co2eq: string }) => s + (parseFloat(e.total_co2eq) || 0), 0),
        scope2: monthEntries.filter((e: { scope: number }) => e.scope === 2).reduce((s: number, e: { total_co2eq: string }) => s + (parseFloat(e.total_co2eq) || 0), 0),
        scope3: monthEntries.filter((e: { scope: number }) => e.scope === 3).reduce((s: number, e: { total_co2eq: string }) => s + (parseFloat(e.total_co2eq) || 0), 0),
      })
    }

    // Yearly breakdown
    const yearsSet = new Set<number>()
    for (const e of entriesResult.rows) {
      const y = parseInt(String(e.year)) || 0
      if (y > 0) yearsSet.add(y)
    }
    const byYear: { year: number; total: number; scope1: number; scope2: number; scope3: number }[] = []
    for (const y of Array.from(yearsSet).sort()) {
      const yearEntries = entriesResult.rows.filter((e: { year: number }) => (parseInt(String(e.year)) || 0) === y)
      byYear.push({
        year: y,
        total: yearEntries.reduce((s: number, e: { total_co2eq: string }) => s + (parseFloat(e.total_co2eq) || 0), 0),
        scope1: yearEntries.filter((e: { scope: number }) => e.scope === 1).reduce((s: number, e: { total_co2eq: string }) => s + (parseFloat(e.total_co2eq) || 0), 0),
        scope2: yearEntries.filter((e: { scope: number }) => e.scope === 2).reduce((s: number, e: { total_co2eq: string }) => s + (parseFloat(e.total_co2eq) || 0), 0),
        scope3: yearEntries.filter((e: { scope: number }) => e.scope === 3).reduce((s: number, e: { total_co2eq: string }) => s + (parseFloat(e.total_co2eq) || 0), 0),
      })
    }

    return NextResponse.json({
      assessment,
      entries: entriesResult.rows,
      ghgProtocol,
      byGhgCategory,
      byCategory,
      bySubcategory,
      upstreamVsCombustion,
      topEmitters,
      byIsoCategory,
      byMonth,
      byYear,
      summary: {
        total: parseFloat(assessment.total_co2eq) || 0,
        scope1: parseFloat(assessment.scope1_co2eq) || 0,
        scope2: parseFloat(assessment.scope2_co2eq) || 0,
        scope3: parseFloat(assessment.scope3_co2eq) || 0,
      },
    })
  } catch (error) {
    console.error('Report fetch error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
