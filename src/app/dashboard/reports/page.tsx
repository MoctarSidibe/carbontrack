'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { BarChart3, FileText, Shield, Globe, TrendingDown, Calendar, Download, QrCode, X } from 'lucide-react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area
} from 'recharts'

interface Assessment {
  id: number; name: string; year: number; site_name: string;
  total_co2eq: number; scope1_co2eq: number; scope2_co2eq: number; scope3_co2eq: number;
}

interface EmissionEntry {
  id: number; category: string; subcategory: string; factor_name: string;
  quantity: number; unit: string; factor_value: number; total_co2eq: number;
  scope: number; ghg_category: string; iso_category: string;
  description: string; source_characterization: string;
}

interface MonthData {
  month: number; label: string; total: number; scope1: number; scope2: number; scope3: number
}

interface YearData {
  year: number; total: number; scope1: number; scope2: number; scope3: number
}

interface TopEmitter {
  name: string; total: number; scope: number; category: string; quantity: number; unit: string
}

interface ReportData {
  assessment: Assessment & { site_name: string; company_name: string; rccm: string; sector: string; site_type: string; site_address: string; logo_url?: string }
  entries: EmissionEntry[]
  summary: { total: number; scope1: number; scope2: number; scope3: number }
  byCategory: Record<string, number>
  byGhgCategory: Record<string, { total: number; entries: EmissionEntry[] }>
  bySubcategory?: Record<string, { total: number; scope: number; category: string; count: number }>
  upstreamVsCombustion?: Record<string, { upstream: number; combustion: number; total: number }>
  topEmitters?: TopEmitter[]
  byIsoCategory?: Record<string, { total: number; scope: number; count: number }>
  byMonth?: MonthData[]
  byYear?: YearData[]
}

const SCOPE_COLORS = ['#ef4444', '#f97316', '#3b82f6']
const CATEGORY_COLORS = ['#22c55e', '#3b82f6', '#f97316', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#eab308']

const CATEGORY_FR: Record<string, string> = {
  energy: 'Energie', non_energy: 'Hors energie', inputs: 'Intrants',
  freight: 'Fret', transport: 'Transport', waste: 'Dechets', capital: 'Immobilisations',
}

function formatCO2(v: number): string {
  if (Math.abs(v) >= 1000000) return `${(v / 1000000).toFixed(2)} ktCO2eq`
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(2)} tCO2eq`
  return `${v.toFixed(1)} kgCO2eq`
}

function smartAxisFormat(v: number): string {
  if (Math.abs(v) >= 1000000) return `${(v / 1000000).toFixed(1)}kt`
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(1)}t`
  if (Math.abs(v) >= 1) return `${v.toFixed(0)}kg`
  if (Math.abs(v) >= 0.01) return `${(v * 1000).toFixed(0)}g`
  return `${v}`
}

// PDF-safe number formatter (avoids non-breaking spaces from toLocaleString)
function fmtNum(v: number, decimals = 2): string {
  const parts = Number(v).toFixed(decimals).split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return decimals > 0 ? parts.join(',') : parts[0]
}

export default function ReportsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeReportTab, setActiveReportTab] = useState<'overview' | 'monthly' | 'ghg' | 'iso' | 'detail'>('overview')
  const [pdfModal, setPdfModal] = useState(false)
  const [pdfGenerating, setPdfGenerating] = useState(false)

  useEffect(() => {
    fetch('/api/assessments').then(r => r.json()).then((data: Assessment[]) => {
      if (Array.isArray(data)) {
        setAssessments(data)
        if (data.length > 0) setSelectedId(String(data[0].id))
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setLoading(true)
    fetch(`/api/reports/${selectedId}`)
      .then(r => r.json())
      .then(setReport)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedId])

  const scopeData = useMemo(() => report ? [
    { name: 'Scope 1 - Direct', value: report.summary.scope1, fill: SCOPE_COLORS[0] },
    { name: 'Scope 2 - Energie', value: report.summary.scope2, fill: SCOPE_COLORS[1] },
    { name: 'Scope 3 - Indirect', value: report.summary.scope3, fill: SCOPE_COLORS[2] },
  ].filter(d => d.value > 0) : [], [report])

  const categoryData = useMemo(() => report ? Object.entries(report.byCategory)
    .map(([key, value]) => ({ name: CATEGORY_FR[key] || key, value: Math.round(value) }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value) : [], [report])

  const ghgData = useMemo(() => report ? Object.entries(report.byGhgCategory)
    .map(([key, val]) => ({ name: key, value: Math.round(val.total), entries: val.entries || [] }))
    .filter(d => d.value > 0)
    .sort((a, b) => {
      const aScope = a.name.startsWith('1-') ? 1 : a.name.startsWith('2-') ? 2 : 3
      const bScope = b.name.startsWith('1-') ? 1 : b.name.startsWith('2-') ? 2 : 3
      return aScope - bScope || a.name.localeCompare(b.name)
    }) : [], [report])

  const isoData = useMemo(() => {
    if (!report?.entries) return []
    const map: Record<string, { total: number; scope: number; count: number }> = {}
    for (const e of report.entries) {
      const key = e.iso_category || 'Autre'
      if (!map[key]) map[key] = { total: 0, scope: 0, count: 0 }
      map[key].total += parseFloat(String(e.total_co2eq)) || 0
      map[key].scope = e.scope
      map[key].count++
    }
    return Object.entries(map)
      .map(([key, val]) => ({ name: key, ...val }))
      .filter(d => d.total > 0)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [report])

  const topEmittersData = useMemo(() => {
    if (!report?.topEmitters) return []
    return report.topEmitters.map(e => ({
      name: e.name.length > 35 ? e.name.slice(0, 32) + '...' : e.name,
      fullName: e.name,
      value: Math.round(e.total),
      scope: e.scope,
      category: CATEGORY_FR[e.category] || e.category,
    }))
  }, [report])

  const cumulativeData = useMemo(() => {
    if (!report?.byMonth) return []
    let cum = 0
    return report.byMonth.map(m => {
      cum += m.total
      return { ...m, cumulative: Math.round(cum) }
    })
  }, [report])

  // Scope-by-category cross-tab — shows each category broken down by scope
  const scopeByCategoryData = useMemo(() => {
    if (!report?.entries) return []
    const map: Record<string, { scope1: number; scope2: number; scope3: number }> = {}
    for (const e of report.entries) {
      const cat = e.category || 'autre'
      if (!map[cat]) map[cat] = { scope1: 0, scope2: 0, scope3: 0 }
      const v = parseFloat(String(e.total_co2eq)) || 0
      if (e.scope === 1) map[cat].scope1 += v
      else if (e.scope === 2) map[cat].scope2 += v
      else map[cat].scope3 += v
    }
    return Object.entries(map)
      .map(([cat, d]) => ({
        name: CATEGORY_FR[cat] || cat,
        scope1: Math.round(d.scope1),
        scope2: Math.round(d.scope2),
        scope3: Math.round(d.scope3),
        total: d.scope1 + d.scope2 + d.scope3,
      }))
      .filter(d => d.total > 0)
      .sort((a, b) => b.total - a.total)
  }, [report])

  const subcategoryData = useMemo(() => {
    if (!report?.bySubcategory) return []
    return Object.entries(report.bySubcategory)
      .map(([key, val]) => ({
        name: key.length > 30 ? key.slice(0, 27) + '...' : key,
        fullName: key,
        value: Math.round(val.total),
        scope: val.scope,
        category: CATEGORY_FR[val.category] || val.category,
      }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 12)
  }, [report])

  // ===== CANVAS CHART HELPERS =====
  const drawPieChart = useCallback((items: { label: string; value: number; color: string }[], w: number, h: number): string => {
    const canvas = document.createElement('canvas')
    canvas.width = w * 2; canvas.height = h * 2
    const ctx = canvas.getContext('2d')!
    ctx.scale(2, 2)
    // Donut on left half
    const pieR = Math.min(w * 0.25, h * 0.4) - 4
    const pieCx = w * 0.28, pieCy = h * 0.45
    const total = items.reduce((s, i) => s + i.value, 0)
    if (total === 0) return canvas.toDataURL()
    // Draw slices
    let startAngle = -Math.PI / 2
    items.forEach(item => {
      const slice = (item.value / total) * Math.PI * 2
      ctx.beginPath(); ctx.moveTo(pieCx, pieCy)
      ctx.arc(pieCx, pieCy, pieR, startAngle, startAngle + slice)
      ctx.closePath(); ctx.fillStyle = item.color; ctx.fill()
      startAngle += slice
    })
    // Donut hole
    ctx.beginPath(); ctx.arc(pieCx, pieCy, pieR * 0.5, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'; ctx.fill()
    // Center total text
    ctx.fillStyle = '#111827'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'
    const totalStr = total >= 1000 ? `${(total / 1000).toFixed(1)}t` : `${Math.round(total)}kg`
    ctx.fillText(totalStr, pieCx, pieCy - 1)
    ctx.fillStyle = '#6b7280'; ctx.font = '9px sans-serif'
    ctx.fillText('CO2eq', pieCx, pieCy + 11)
    // Legend on right half
    const legX = w * 0.56
    const legStartY = h * 0.2
    ctx.textAlign = 'left'
    items.forEach((item, idx) => {
      const ly = legStartY + idx * 28
      const pct = ((item.value / total) * 100).toFixed(1)
      const valStr = item.value >= 1000 ? `${(item.value / 1000).toFixed(2)} t` : `${Math.round(item.value)} kg`
      // Color dot
      ctx.fillStyle = item.color
      ctx.beginPath(); ctx.arc(legX, ly + 2, 5, 0, Math.PI * 2); ctx.fill()
      // Label
      ctx.fillStyle = '#374151'; ctx.font = 'bold 11px sans-serif'
      ctx.fillText(item.label, legX + 12, ly + 5)
      // Value + percentage
      ctx.fillStyle = '#6b7280'; ctx.font = '10px sans-serif'
      ctx.fillText(`${valStr}  (${pct}%)`, legX + 12, ly + 20)
    })
    return canvas.toDataURL('image/png')
  }, [])

  const drawBarChart = useCallback((items: { label: string; value: number; color: string }[], w: number, h: number): string => {
    const dpr = 2
    const canvas = document.createElement('canvas')
    canvas.width = w * dpr; canvas.height = h * dpr
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)
    const maxVal = Math.max(...items.map(i => i.value), 1)
    const labelW = w * 0.32
    const valueW = w * 0.18
    const barMaxW = w - labelW - valueW - 10
    const gap = 5
    const itemH = Math.min(24, Math.max(12, (h - 10) / items.length - gap))
    const totalH = items.length * (itemH + gap) - gap
    const startY = Math.max(4, (h - totalH) / 2)
    items.forEach((item, i) => {
      const by = startY + i * (itemH + gap)
      const bw = Math.max(4, (item.value / maxVal) * barMaxW)
      // Label
      ctx.fillStyle = '#374151'; ctx.font = 'bold 11px Inter,sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'
      const lbl = item.label.length > 14 ? item.label.slice(0, 12) + '..' : item.label
      ctx.fillText(lbl, labelW - 8, by + itemH / 2)
      // Bar
      ctx.fillStyle = item.color; ctx.beginPath()
      ctx.roundRect(labelW, by, bw, itemH, [0, 4, 4, 0]); ctx.fill()
      // Value
      ctx.fillStyle = '#4b5563'; ctx.font = '10px Inter,sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
      const valStr = item.value >= 1000000 ? `${(item.value / 1000000).toFixed(1)}kt` : item.value >= 1000 ? `${(item.value / 1000).toFixed(1)}t` : `${Math.round(item.value)}kg`
      ctx.fillText(valStr, labelW + bw + 5, by + itemH / 2)
    })
    return canvas.toDataURL('image/png')
  }, [])

  const drawMonthlyChart = useCallback((months: MonthData[], w: number, h: number): string => {
    const canvas = document.createElement('canvas')
    canvas.width = w * 2; canvas.height = h * 2
    const ctx = canvas.getContext('2d')!
    ctx.scale(2, 2)
    const pad = { left: 45, right: 15, top: 15, bottom: 35 }
    const chartW = w - pad.left - pad.right, chartH = h - pad.top - pad.bottom
    const maxVal = Math.max(...months.map(m => m.total), 1)
    const barW = chartW / months.length - 4
    // Grid lines
    ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 0.5
    for (let i = 0; i <= 4; i++) {
      const gy = pad.top + (chartH / 4) * i
      ctx.beginPath(); ctx.moveTo(pad.left, gy); ctx.lineTo(w - pad.right, gy); ctx.stroke()
      ctx.fillStyle = '#9ca3af'; ctx.font = '8px sans-serif'; ctx.textAlign = 'right'
      const gv = maxVal - (maxVal / 4) * i
      ctx.fillText(gv >= 1000 ? `${(gv / 1000).toFixed(0)}t` : `${Math.round(gv)}`, pad.left - 4, gy + 3)
    }
    // Bars
    months.forEach((m, i) => {
      const bx = pad.left + i * (barW + 4) + 2
      const scopes = [
        { val: m.scope1, color: '#ef4444' },
        { val: m.scope2, color: '#f97316' },
        { val: m.scope3, color: '#3b82f6' },
      ]
      let stackY = pad.top + chartH
      scopes.forEach(s => {
        if (s.val <= 0) return
        const sh = (s.val / maxVal) * chartH
        stackY -= sh
        ctx.fillStyle = s.color
        ctx.fillRect(bx, stackY, barW, sh)
      })
      // Month label
      ctx.fillStyle = '#6b7280'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText(m.label.slice(0, 3), bx + barW / 2, h - pad.bottom + 12)
    })
    // Legend
    const legendItems = [{ label: 'Scope 1', color: '#ef4444' }, { label: 'Scope 2', color: '#f97316' }, { label: 'Scope 3', color: '#3b82f6' }]
    let lx = pad.left
    legendItems.forEach(l => {
      ctx.fillStyle = l.color; ctx.fillRect(lx, h - 10, 8, 8)
      ctx.fillStyle = '#374151'; ctx.font = '9px sans-serif'; ctx.textAlign = 'left'
      ctx.fillText(l.label, lx + 11, h - 3)
      lx += 60
    })
    return canvas.toDataURL('image/png')
  }, [])

  // Cumulative monthly trend (line + area fill) — shows progression across the year
  const drawCumulativeChart = useCallback((months: MonthData[], w: number, h: number): string => {
    const canvas = document.createElement('canvas')
    canvas.width = w * 2; canvas.height = h * 2
    const ctx = canvas.getContext('2d')!
    ctx.scale(2, 2)
    const pad = { left: 45, right: 18, top: 12, bottom: 30 }
    const chartW = w - pad.left - pad.right
    const chartH = h - pad.top - pad.bottom

    let cum = 0
    const cumValues = months.map(m => { cum += m.total; return cum })
    const maxCum = Math.max(...cumValues, 1)

    // Grid + Y axis labels
    ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 0.5
    for (let i = 0; i <= 4; i++) {
      const gy = pad.top + (chartH / 4) * i
      ctx.beginPath(); ctx.moveTo(pad.left, gy); ctx.lineTo(w - pad.right, gy); ctx.stroke()
      ctx.fillStyle = '#9ca3af'; ctx.font = '8px sans-serif'; ctx.textAlign = 'right'
      const gv = maxCum - (maxCum / 4) * i
      ctx.fillText(gv >= 1000 ? `${(gv / 1000).toFixed(0)}t` : `${Math.round(gv)}`, pad.left - 4, gy + 3)
    }

    const stepX = chartW / Math.max(1, months.length - 1)
    const pts = cumValues.map((v, i) => ({
      x: pad.left + i * stepX,
      y: pad.top + chartH - (v / maxCum) * chartH,
    }))

    // Area fill
    ctx.fillStyle = 'rgba(16, 185, 129, 0.18)'
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pad.top + chartH)
    pts.forEach(p => ctx.lineTo(p.x, p.y))
    ctx.lineTo(pts[pts.length - 1].x, pad.top + chartH)
    ctx.closePath(); ctx.fill()

    // Line
    ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2.2
    ctx.beginPath()
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))
    ctx.stroke()

    // Points
    pts.forEach(p => {
      ctx.fillStyle = '#10b981'
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2); ctx.fill()
    })

    // X labels
    ctx.fillStyle = '#6b7280'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center'
    months.forEach((m, i) => {
      ctx.fillText(m.label.slice(0, 3), pad.left + i * stepX, h - pad.bottom + 12)
    })

    // Final value annotation
    const last = pts[pts.length - 1]
    const finalVal = cumValues[cumValues.length - 1]
    ctx.fillStyle = '#065f46'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'right'
    ctx.fillText(
      finalVal >= 1000 ? `${(finalVal / 1000).toFixed(1)}t` : `${Math.round(finalVal)}kg`,
      last.x - 4, last.y - 6,
    )
    return canvas.toDataURL('image/png')
  }, [])

  // Horizontal bars with long labels — used for top emitters, GHG, ISO
  const drawHorizontalBars = useCallback(
    (items: { label: string; value: number; color: string }[], w: number, h: number, labelMaxLen = 30): string => {
      const dpr = 2
      const canvas = document.createElement('canvas')
      canvas.width = w * dpr; canvas.height = h * dpr
      const ctx = canvas.getContext('2d')!
      ctx.scale(dpr, dpr)
      const maxVal = Math.max(...items.map(i => i.value), 1)
      const labelW = Math.min(220, w * 0.42)
      const valueW = w * 0.16
      const barMaxW = w - labelW - valueW - 10
      const gap = 4
      const itemH = Math.min(20, Math.max(11, (h - 8) / items.length - gap))
      const totalH = items.length * (itemH + gap) - gap
      const startY = Math.max(4, (h - totalH) / 2)
      items.forEach((item, i) => {
        const by = startY + i * (itemH + gap)
        const bw = Math.max(3, (item.value / maxVal) * barMaxW)
        // Label
        ctx.fillStyle = '#374151'; ctx.font = '10px Inter,sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'
        const lbl = item.label.length > labelMaxLen ? item.label.slice(0, labelMaxLen - 2) + '..' : item.label
        ctx.fillText(lbl, labelW - 6, by + itemH / 2)
        // Bar bg
        ctx.fillStyle = '#f3f4f6'; ctx.fillRect(labelW, by, barMaxW, itemH)
        // Bar
        ctx.fillStyle = item.color; ctx.beginPath()
        ctx.roundRect(labelW, by, bw, itemH, [0, 3, 3, 0]); ctx.fill()
        // Value
        ctx.fillStyle = '#4b5563'; ctx.font = '9px Inter,sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
        const valStr = item.value >= 1000000 ? `${(item.value / 1000000).toFixed(2)}kt`
          : item.value >= 1000 ? `${(item.value / 1000).toFixed(1)}t`
          : `${Math.round(item.value)}kg`
        ctx.fillText(valStr, labelW + bw + 5, by + itemH / 2)
      })
      return canvas.toDataURL('image/png')
    },
    [],
  )

  // ===== PDF GENERATION =====
  const generatePDF = useCallback(async (mode: 'yearly' | 'monthly') => {
    if (!report) return
    setPdfGenerating(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')
      const { default: QRCode } = await import('qrcode')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pw = doc.internal.pageSize.getWidth()
      const ph = doc.internal.pageSize.getHeight()
      const margin = 16
      const cw = pw - 2 * margin
      let y = 0

      // Colors
      const brand: [number, number, number] = [16, 185, 129]
      const brandDark: [number, number, number] = [5, 150, 105]
      const dark: [number, number, number] = [31, 41, 55]
      const mid: [number, number, number] = [107, 114, 128]
      const light: [number, number, number] = [156, 163, 175]
      const bg: [number, number, number] = [249, 250, 251]
      const white: [number, number, number] = [255, 255, 255]

      const tbl = {
        theme: 'striped' as const,
        headStyles: { fillColor: brand, textColor: white, fontSize: 8, fontStyle: 'bold' as const, cellPadding: 2.5 },
        footStyles: { fillColor: [240, 253, 244] as [number, number, number], textColor: dark, fontSize: 8, fontStyle: 'bold' as const, cellPadding: 2.5 },
        bodyStyles: { fontSize: 7.5, textColor: dark, cellPadding: 2 },
        alternateRowStyles: { fillColor: [248, 250, 252] as [number, number, number] },
        styles: { lineColor: [229, 231, 235] as [number, number, number], lineWidth: 0.15 },
        margin: { left: margin, right: margin },
      }
      const tblY = () => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY

      let logoData: string | null = null
      let logoProps: { w: number, h: number } | null = null
      if (report.assessment.logo_url) {
        try {
          const res = await fetch(report.assessment.logo_url)
          if (res.ok) {
            const blob = await res.blob()
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader()
              reader.onloadend = () => resolve(reader.result as string)
              reader.readAsDataURL(blob)
            })
            logoData = base64
            logoProps = await new Promise<{ w: number, h: number }>((resolve) => {
              const img = new Image()
              img.onload = () => resolve({ w: img.width || 1, h: img.height || 1 })
              img.onerror = () => resolve({ w: 1, h: 1 })
              img.src = base64
            })
          }
        } catch (e) { console.warn('Logo pre-fetch failed:', e) }
      }

      const pageNum = { v: 1 }
      const addHeader = () => {
        doc.setFillColor(...brand); doc.rect(0, 0, pw, 2.5, 'F')
        let headX = margin;
        if (logoData && logoProps) {
          try {
            const targetH = 14;
            const targetW = (logoProps.w / logoProps.h) * targetH;
            doc.addImage(logoData, margin, 4, targetW, targetH, undefined, 'FAST')
            headX = margin + targetW + 4;
          } catch(e) {}
        }
        doc.setFontSize(7); doc.setTextColor(...mid)
        doc.text(`${report.assessment.company_name} | ${report.assessment.site_name}, ${'country' in report.assessment ? (report.assessment as any).country : 'Global'} | ${report.assessment.year}`, headX, 9)
        doc.text(`RCCM: ${report.assessment.rccm || 'N/A'}`, pw - margin, 9, { align: 'right' })
        doc.setDrawColor(229, 231, 235); doc.line(margin, 16, pw - margin, 16)
      }
      const addFooter = (p: number) => {
        doc.setDrawColor(229, 231, 235); doc.line(margin, ph - 12, pw - margin, ph - 12)
        doc.setFontSize(6.5); doc.setTextColor(...light)
        doc.text('GreenLeaves - Bilan Carbone', margin, ph - 7)
        doc.text(`${new Date().toLocaleDateString('fr-FR')}`, pw / 2, ph - 7, { align: 'center' })
        doc.text(`Page ${p}`, pw - margin, ph - 7, { align: 'right' })
      }
      const section = (title: string) => {
        doc.setFontSize(12); doc.setTextColor(...dark); doc.text(title, margin, y + 4)
        doc.setFillColor(...brand); doc.rect(margin, y + 7, 35, 1, 'F')
        doc.setFillColor(209, 250, 229); doc.rect(margin + 35, y + 7, 15, 1, 'F')
        y += 13
      }
      const newPage = () => { addFooter(pageNum.v); doc.addPage(); pageNum.v++; addHeader(); y = 20 }
      const check = (n: number) => { if (y + n > ph - 18) newPage() }

      // =============================================
      // PAGE 1: FULL COVER (presentation style)
      // =============================================
      const qrUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard/reports?id=${selectedId}`

      // Green gradient background (dark green → medium green → light green)
      for (let gi = 0; gi < 50; gi++) {
        const gt = gi / 50
        const gr = gt < 0.4 ? 22 : Math.round(22 + 52 * ((gt - 0.4) / 0.6))
        const gg = gt < 0.4 ? Math.round(101 + 62 * (gt / 0.4)) : Math.round(163 + 59 * ((gt - 0.4) / 0.6))
        const gb = gt < 0.4 ? Math.round(52 + 22 * (gt / 0.4)) : Math.round(74 + 54 * ((gt - 0.4) / 0.6))
        doc.setFillColor(gr, gg, gb)
        doc.rect(0, (ph / 50) * gi, pw, ph / 50 + 0.5, 'F')
      }

      // Logo icon
      try {
        if (logoData && logoProps) {
          const ratio = logoProps.w / logoProps.h;
          let targetH = 50;
          let targetW = 50;
          if (ratio > 1) { // Wide
            targetH = targetW / ratio;
          } else { // Tall
            targetW = targetH * ratio;
          }
          doc.addImage(logoData, (pw - targetW) / 2, 55, targetW, targetH, undefined, 'FAST')
        } else {
          // Default leaf logo
          const logoC = document.createElement('canvas')
          logoC.width = 240; logoC.height = 240
          const logoCtx = logoC.getContext('2d')!
          const lPad = 20, lSz = 200, lRad = 44
          logoCtx.shadowColor = 'rgba(0,0,0,0.3)'; logoCtx.shadowBlur = 20; logoCtx.shadowOffsetY = 8
          logoCtx.beginPath()
          logoCtx.moveTo(lPad + lRad, lPad)
          logoCtx.lineTo(lPad + lSz - lRad, lPad); logoCtx.quadraticCurveTo(lPad + lSz, lPad, lPad + lSz, lPad + lRad)
          logoCtx.lineTo(lPad + lSz, lPad + lSz - lRad); logoCtx.quadraticCurveTo(lPad + lSz, lPad + lSz, lPad + lSz - lRad, lPad + lSz)
          logoCtx.lineTo(lPad + lRad, lPad + lSz); logoCtx.quadraticCurveTo(lPad, lPad + lSz, lPad, lPad + lSz - lRad)
          logoCtx.lineTo(lPad, lPad + lRad); logoCtx.quadraticCurveTo(lPad, lPad, lPad + lRad, lPad)
          logoCtx.closePath()
          logoCtx.fillStyle = '#16a34a'; logoCtx.fill()
          logoCtx.shadowColor = 'transparent'
          const leafSc = lSz / 24 * 0.5, leafOx = lPad + lSz * 0.25, leafOy = lPad + lSz * 0.2
          logoCtx.save(); logoCtx.translate(leafOx, leafOy); logoCtx.scale(leafSc, leafSc)
          logoCtx.strokeStyle = 'white'; logoCtx.lineWidth = 2.8; logoCtx.lineCap = 'round'; logoCtx.lineJoin = 'round'
          try {
            logoCtx.stroke(new Path2D('M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 17 3.5s1.5 2.5 1.5 6c0 4-2.5 7-7.5 10.5'))
            logoCtx.stroke(new Path2D('M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12'))
          } catch { /* SVG Path2D fallback */ }
          logoCtx.restore()
          doc.addImage(logoC.toDataURL('image/png'), 'PNG', (pw - 30) / 2, 55, 30, 30)
        }
      } catch { /* logo skip */ }

      // Title
      doc.setFontSize(36); doc.setTextColor(255, 255, 255)
      doc.text('GreenLeaves', pw / 2, 102, { align: 'center' })

      // Subtitle
      doc.setFontSize(12); doc.setTextColor(220, 252, 231)
      doc.text(mode === 'yearly' ? 'Bilan Carbone - Rapport Annuel Complet' : 'Bilan Carbone - Rapport Mensuel Detaille', pw / 2, 114, { align: 'center' })

      // Company + site + year
      doc.setFontSize(10); doc.setTextColor(187, 247, 208)
      doc.text(`${report.assessment.company_name} | ${report.assessment.site_name}, ${'country' in report.assessment ? (report.assessment as any).country : 'Global'} | Annee ${report.assessment.year}`, pw / 2, 126, { align: 'center' })

      // ISO/GHG badges (white bordered pill shapes)
      const coverBadges = ['ISO 14064-1:2018', 'ISO 14069:2013', 'GHG Protocol']
      const cbW = 42, cbGap = 5
      const cbStartX = (pw - (coverBadges.length * cbW + (coverBadges.length - 1) * cbGap)) / 2
      doc.setDrawColor(255, 255, 255); doc.setLineWidth(0.3)
      doc.setFontSize(7); doc.setTextColor(255, 255, 255)
      coverBadges.forEach((cb, ci) => {
        const cbx = cbStartX + ci * (cbW + cbGap)
        doc.roundedRect(cbx, 140, cbW, 9, 4, 4, 'S')
        doc.text(cb, cbx + cbW / 2, 146, { align: 'center' })
      })

      // QR Code (centered, below badges)
      try {
        const qrCover = await QRCode.toDataURL(qrUrl, { width: 300, margin: 1, color: { dark: '#ffffff', light: '#00000000' } })
        doc.addImage(qrCover, 'PNG', (pw - 38) / 2, 164, 38, 38)
        doc.setFontSize(7.5); doc.setTextColor(187, 247, 208)
        doc.text('Scanner pour acceder au rapport en ligne', pw / 2, 208, { align: 'center' })
      } catch { /* QR skip */ }

      // Cover footer
      doc.setFontSize(7); doc.setTextColor(187, 247, 208)
      doc.text((report.assessment.company_name || 'GreenLeaves') + ' | Document confidentiel | ' + new Date().toLocaleDateString('fr-FR'), pw / 2, ph - 18, { align: 'center' })

      // =============================================
      // PAGE 2: DATA SUMMARY
      // =============================================
      doc.addPage(); pageNum.v++
      addHeader()
      doc.setFillColor(...brandDark); doc.rect(0, 0, 4, ph, 'F')

      // Section title
      y = 22
      doc.setFontSize(12); doc.setTextColor(...dark); doc.text('Synthese du Bilan Carbone', margin, y + 4)
      doc.setFillColor(...brand); doc.rect(margin, y + 7, 35, 1, 'F')
      doc.setFillColor(209, 250, 229); doc.rect(margin + 35, y + 7, 15, 1, 'F')
      y += 15

      // Company info row

      doc.setFillColor(...bg); doc.roundedRect(margin, y, cw, 28, 2, 2, 'F')
      doc.setDrawColor(229, 231, 235); doc.roundedRect(margin, y, cw, 28, 2, 2, 'S')
      const cols = [
        { lbl: 'ENTREPRISE', val: report.assessment.company_name || 'N/A' },
        { lbl: 'SITE', val: report.assessment.site_name || 'N/A' },
        { lbl: 'RCCM', val: report.assessment.rccm || 'N/A' },
        { lbl: 'SECTEUR', val: report.assessment.sector || 'N/A' },
      ]
      const colW = cw / 4
      cols.forEach((c, i) => {
        const cx = margin + i * colW + 6
        doc.setFontSize(6.5); doc.setTextColor(...mid); doc.text(c.lbl, cx, y + 10)
        doc.setFontSize(9); doc.setTextColor(...dark)
        const v = c.val.length > 22 ? c.val.slice(0, 20) + '..' : c.val
        doc.text(v, cx, y + 18)
        if (i < 3) { doc.setDrawColor(229, 231, 235); doc.line(margin + (i + 1) * colW, y + 4, margin + (i + 1) * colW, y + 24) }
      })
      y += 34

      // Total + scope row
      doc.setFillColor(...brand); doc.roundedRect(margin, y, cw, 20, 2, 2, 'F')
      doc.setFontSize(9); doc.setTextColor(209, 250, 229); doc.text('TOTAL DES EMISSIONS', margin + 6, y + 8)
      doc.setFontSize(16); doc.setTextColor(...white); doc.text(formatCO2(report.summary.total), margin + 6, y + 16)
      doc.setFontSize(8); doc.setTextColor(209, 250, 229)
      doc.text(`Bilan: ${report.assessment.name}  |  Date: ${new Date().toLocaleDateString('fr-FR')}  |  ${report.entries?.length || 0} postes`, pw - margin - 6, y + 13, { align: 'right' })
      y += 26

      // Scope boxes inline
      const scopes = [
        { label: 'Scope 1', desc: 'Direct', value: report.summary.scope1, color: [239, 68, 68] as [number, number, number], bg: [254, 242, 242] as [number, number, number] },
        { label: 'Scope 2', desc: 'Energie', value: report.summary.scope2, color: [249, 115, 22] as [number, number, number], bg: [255, 247, 237] as [number, number, number] },
        { label: 'Scope 3', desc: 'Indirect', value: report.summary.scope3, color: [59, 130, 246] as [number, number, number], bg: [239, 246, 255] as [number, number, number] },
      ]
      const bw = (cw - 6) / 3
      scopes.forEach((s, i) => {
        const bx = margin + i * (bw + 3)
        doc.setFillColor(...s.bg); doc.roundedRect(bx, y, bw, 20, 2, 2, 'F')
        doc.setFillColor(...s.color); doc.rect(bx, y, bw, 2.5, 'F')
        doc.setFontSize(8); doc.setTextColor(...s.color); doc.text(s.label, bx + 4, y + 9)
        doc.setFontSize(6); doc.setTextColor(...mid); doc.text(s.desc, bx + 4 + doc.getTextWidth(s.label) + 3, y + 9)
        doc.setFontSize(10); doc.setTextColor(...dark); doc.text(formatCO2(s.value), bx + 4, y + 16)
        const pct = report.summary.total > 0 ? ((s.value / report.summary.total) * 100).toFixed(1) + '%' : '0%'
        doc.setFontSize(7); doc.setTextColor(...mid); doc.text(pct, bx + bw - 4, y + 16, { align: 'right' })
      })
      y += 26

      // ===== CHARTS: Scope Pie + Category Bar side by side =====
      const chartH = 65
      const halfW = (cw - 4) / 2

      // Pie chart
      const pieItems = scopes.filter(s => s.value > 0).map(s => ({ label: s.label, value: s.value, color: `rgb(${s.color.join(',')})` }))
      if (pieItems.length > 0) {
        const pieImg = drawPieChart(pieItems, 400, 200)
        doc.setFillColor(...bg); doc.roundedRect(margin, y, halfW, chartH, 2, 2, 'F')
        doc.setFontSize(8); doc.setTextColor(...dark); doc.text('Repartition par Scope', margin + 4, y + 8)
        doc.addImage(pieImg, 'PNG', margin + 2, y + 11, halfW - 4, (halfW - 4) / 2)
      }

      // Category bar chart
      const catItems = Object.entries(report.byCategory).filter(([, v]) => v > 0).sort(([, a], [, b]) => b - a).slice(0, 8)
      if (catItems.length > 0) {
        const barItems = catItems.map(([k, v], i) => ({ label: CATEGORY_FR[k] || k, value: v, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }))
        const barImg = drawBarChart(barItems, 400, 240)
        const rx = margin + halfW + 4
        doc.setFillColor(...bg); doc.roundedRect(rx, y, halfW, chartH, 2, 2, 'F')
        doc.setFontSize(8); doc.setTextColor(...dark); doc.text('Emissions par Categorie', rx + 4, y + 8)
        doc.addImage(barImg, 'PNG', rx + 2, y + 11, halfW - 4, chartH - 15)
      }
      y += chartH + 6

      // Monthly chart (if data exists)
      if (report.byMonth && report.byMonth.some(m => m.total > 0)) {
        check(55)
        doc.setFillColor(...bg); doc.roundedRect(margin, y, cw, 50, 2, 2, 'F')
        doc.setFontSize(8); doc.setTextColor(...dark); doc.text('Suivi Mensuel par Scope', margin + 4, y + 8)
        const monthImg = drawMonthlyChart(report.byMonth, 600, 160)
        doc.addImage(monthImg, 'PNG', margin + 2, y + 11, cw - 4, 36)
        y += 55

        // Cumulative trend over the year — canvas aspect matches PDF placement
        check(55)
        doc.setFillColor(...bg); doc.roundedRect(margin, y, cw, 50, 2, 2, 'F')
        doc.setFontSize(8); doc.setTextColor(...dark); doc.text("Cumul des emissions sur l'annee", margin + 4, y + 8)
        const cumW = 600
        const cumPdfW = cw - 4
        const cumPdfH = 36
        const cumCanvasH = Math.round(cumW * (cumPdfH / cumPdfW))
        const cumImg = drawCumulativeChart(report.byMonth, cumW, cumCanvasH)
        doc.addImage(cumImg, 'PNG', margin + 2, y + 11, cumPdfW, cumPdfH)
        y += 55
      }

      addFooter(pageNum.v)

      // =============================================
      // PAGE 2: TABLES - Category + GHG + ISO
      // =============================================
      newPage()

      section('Repartition par Categorie')
      const catEntries = Object.entries(report.byCategory).filter(([, v]) => v > 0).sort(([, a], [, b]) => b - a)
      if (catEntries.length > 0) {
        autoTable(doc, { ...tbl, startY: y,
          head: [['Categorie', 'Emissions (kgCO2eq)', '% du total']],
          body: catEntries.map(([k, v]) => [CATEGORY_FR[k] || k, formatCO2(v), report.summary.total > 0 ? ((v / report.summary.total) * 100).toFixed(1) + '%' : '0%']),
          foot: [['TOTAL', formatCO2(report.summary.total), '100%']],
          columnStyles: { 0: { cellWidth: 85 }, 1: { halign: 'right' as const }, 2: { halign: 'right' as const, cellWidth: 28 } },
        })
        y = tblY() + 10
      }

      check(35)
      section('GHG Protocol - Categories')
      const ghgEntries = Object.entries(report.byGhgCategory).filter(([, v]) => v.total > 0).sort(([a], [b]) => a.localeCompare(b))
      if (ghgEntries.length > 0) {
        // Visual: horizontal bar chart with scope colors
        const ghgBarItems = ghgEntries.map(([k, v]) => ({
          label: k,
          value: v.total,
          color: k.startsWith('1-') ? '#ef4444' : k.startsWith('2-') ? '#f97316' : '#3b82f6',
        }))
        const ghgChartH = Math.max(45, Math.min(90, ghgBarItems.length * 7 + 8))
        check(ghgChartH + 10)
        // Canvas aspect matches PDF placement aspect to avoid vertical squish & overlap
        const ghgCanvasH = Math.round(800 * (ghgChartH / cw))
        const ghgImg = drawHorizontalBars(ghgBarItems, 800, ghgCanvasH, 38)
        doc.addImage(ghgImg, 'PNG', margin, y, cw, ghgChartH)
        y += ghgChartH + 4

        autoTable(doc, { ...tbl, startY: y,
          head: [['Categorie GHG', 'Scope', 'Emissions (kgCO2eq)', '% du total']],
          body: ghgEntries.map(([k, v]) => [k, k.startsWith('1-') ? 'Scope 1' : k.startsWith('2-') ? 'Scope 2' : 'Scope 3', formatCO2(v.total), report.summary.total > 0 ? ((v.total / report.summary.total) * 100).toFixed(1) + '%' : '0%']),
          foot: [['TOTAL', '', formatCO2(report.summary.total), '100%']],
          columnStyles: { 0: { cellWidth: 65 }, 2: { halign: 'right' as const }, 3: { halign: 'right' as const, cellWidth: 25 } },
        })
        y = tblY() + 10
      }

      check(35)
      section('ISO 14064-1 / ISO 14069')
      if (isoData.length > 0) {
        // Visual: horizontal bar chart with scope colors
        const isoBarItems = isoData.map(d => ({
          label: d.name,
          value: d.total,
          color: d.scope === 1 ? '#ef4444' : d.scope === 2 ? '#f97316' : '#3b82f6',
        }))
        const isoChartH = Math.max(45, Math.min(90, isoBarItems.length * 7 + 8))
        check(isoChartH + 10)
        const isoCanvasH = Math.round(800 * (isoChartH / cw))
        const isoImg = drawHorizontalBars(isoBarItems, 800, isoCanvasH, 36)
        doc.addImage(isoImg, 'PNG', margin, y, cw, isoChartH)
        y += isoChartH + 4

        autoTable(doc, { ...tbl, startY: y,
          head: [['Poste ISO 14069', 'Scope', 'Postes', 'Emissions (kgCO2eq)', '%']],
          body: isoData.map(d => [d.name, `Scope ${d.scope}`, String(d.count), formatCO2(d.total), report.summary.total > 0 ? ((d.total / report.summary.total) * 100).toFixed(1) + '%' : '0%']),
          foot: [['TOTAL', '', String(report.entries?.length || 0), formatCO2(report.summary.total), '100%']],
          columnStyles: { 0: { cellWidth: 55 }, 3: { halign: 'right' as const }, 4: { halign: 'right' as const, cellWidth: 20 } },
        })
        y = tblY() + 10
      }

      // ===== Monthly table (if monthly mode) =====
      if (mode === 'monthly' && report.byMonth && report.byMonth.some(m => m.total > 0)) {
        check(35)
        section('Suivi Mensuel des Emissions')
        autoTable(doc, { ...tbl, startY: y,
          head: [['Mois', 'Scope 1', 'Scope 2', 'Scope 3', 'Total', '%']],
          body: report.byMonth.map(m => [m.label, m.scope1 > 0 ? formatCO2(m.scope1) : '-', m.scope2 > 0 ? formatCO2(m.scope2) : '-', m.scope3 > 0 ? formatCO2(m.scope3) : '-', m.total > 0 ? formatCO2(m.total) : '-', report.summary.total > 0 && m.total > 0 ? ((m.total / report.summary.total) * 100).toFixed(1) + '%' : '-']),
          foot: [['TOTAL', formatCO2(report.summary.scope1), formatCO2(report.summary.scope2), formatCO2(report.summary.scope3), formatCO2(report.summary.total), '100%']],
          columnStyles: { 0: { cellWidth: 25 }, 1: { halign: 'right' as const }, 2: { halign: 'right' as const }, 3: { halign: 'right' as const }, 4: { halign: 'right' as const }, 5: { halign: 'right' as const, cellWidth: 16 } },
        })
        y = tblY() + 10
      }

      // ===== Top emitters =====
      if (report.topEmitters && report.topEmitters.length > 0) {
        check(35)
        section('Top Sources d\'Emissions')
        // Visual: horizontal bar chart, scope-colored
        const topItems = report.topEmitters.slice(0, 10).map(e => ({
          label: e.name,
          value: e.total,
          color: e.scope === 1 ? '#ef4444' : e.scope === 2 ? '#f97316' : '#3b82f6',
        }))
        const topChartH = Math.max(55, Math.min(100, topItems.length * 7 + 10))
        check(topChartH + 10)
        const topCanvasH = Math.round(800 * (topChartH / cw))
        const topImg = drawHorizontalBars(topItems, 800, topCanvasH, 40)
        doc.addImage(topImg, 'PNG', margin, y, cw, topChartH)
        y += topChartH + 4

        autoTable(doc, { ...tbl, startY: y,
          head: [['#', 'Source', 'Categorie', 'Scope', 'Quantite', 'Unite', 'Emissions (kgCO2eq)']],
          body: report.topEmitters.slice(0, 10).map((e, i) => [String(i + 1), e.name.length > 35 ? e.name.slice(0, 32) + '...' : e.name, CATEGORY_FR[e.category] || e.category, `Scope ${e.scope}`, fmtNum(Number(e.quantity)), e.unit?.replace('kgCO2eq/', '') || '', formatCO2(e.total)]),
          columnStyles: { 0: { cellWidth: 8, halign: 'center' as const }, 1: { cellWidth: 50 }, 6: { halign: 'right' as const } },
        })
        y = tblY() + 10
      }

      // =============================================
      // FULL CALCULATION DATA (all entries)
      // =============================================
      if (report.entries && report.entries.length > 0) {
        check(35)
        section('Donnees Completes de Calcul')
        doc.setFontSize(7); doc.setTextColor(...mid)
        doc.text(`${report.entries.length} postes d'emission - Detail complet avec quantites, facteurs d'emission et resultats`, margin, y + 2)
        y += 7

        autoTable(doc, { ...tbl, startY: y,
          head: [['Source d\'emission', 'Categorie', 'Sc.', 'GHG', 'Quantite', 'Unite', 'FE', 'Total (kgCO2eq)']],
          body: report.entries.map(e => [
            (e.factor_name || '').length > 30 ? (e.factor_name || '').slice(0, 27) + '...' : (e.factor_name || ''),
            (CATEGORY_FR[e.category] || e.category || '').length > 14 ? (CATEGORY_FR[e.category] || e.category || '').slice(0, 12) + '..' : (CATEGORY_FR[e.category] || e.category || ''),
            String(e.scope),
            (e.ghg_category || '').length > 12 ? (e.ghg_category || '').slice(0, 10) + '..' : (e.ghg_category || ''),
            fmtNum(Number(e.quantity)),
            (e.unit || '').replace('kgCO2eq/', ''),
            fmtNum(Number(e.factor_value), 4),
            formatCO2(parseFloat(String(e.total_co2eq)) || 0),
          ]),
          foot: [[`TOTAL (${report.entries.length} postes)`, '', '', '', '', '', '', formatCO2(report.summary.total)]],
          headStyles: { ...tbl.headStyles, fontSize: 7 },
          bodyStyles: { ...tbl.bodyStyles, fontSize: 6.5 },
          footStyles: { ...tbl.footStyles, fontSize: 7 },
          columnStyles: {
            0: { cellWidth: 42 },
            1: { cellWidth: 22 },
            2: { cellWidth: 8, halign: 'center' as const },
            3: { cellWidth: 18 },
            4: { halign: 'right' as const, cellWidth: 22 },
            5: { cellWidth: 16 },
            6: { halign: 'right' as const, cellWidth: 18 },
            7: { halign: 'right' as const, cellWidth: 25 },
          },
        })
        y = tblY() + 10
      }

      // ===== METHODOLOGY =====
      check(65)
      section('Methodologie & References')
      doc.setFillColor(...bg); doc.roundedRect(margin, y, cw, 50, 2, 2, 'F')
      doc.setFontSize(7.5); doc.setTextColor(...dark)
      const lines = [
        'Ce bilan carbone a ete realise conformement aux normes :',
        '  - GHG Protocol Corporate Standard (WRI/WBCSD)',
        '  - ISO 14064-1:2018 - Quantification des emissions de GES',
        '  - ISO 14069:2013 - Guide d\'application de l\'ISO 14064-1',
        '',
        'Facteurs d\'emission : Base Carbone ADEME et sources reconnues. Resultats en kgCO2eq.',
        '',
        'Scope 1 : Emissions directes (combustion, procedes, fuites).',
        'Scope 2 : Emissions indirectes liees a l\'achat d\'energie.',
        'Scope 3 : Autres emissions indirectes (achats, fret, dechets, deplacements).',
      ]
      let ly = y + 7
      for (const l of lines) { doc.text(l, margin + 5, ly); ly += 4.5 }
      y += 56

      // Disclaimer
      doc.setFontSize(6); doc.setTextColor(...light)
      doc.text('Ce rapport est genere automatiquement par GreenLeaves. Les resultats dependent des donnees saisies. Document a titre informatif.', margin, y + 3)

      addFooter(pageNum.v)

      // Save
      const fn = `bilan-carbone-${report.assessment.name.replace(/[^a-zA-Z0-9]/g, '-')}-${mode === 'monthly' ? 'mensuel' : 'annuel'}-${new Date().toISOString().slice(0, 10)}.pdf`
      doc.save(fn)
    } catch (err) {
      console.error('PDF generation error:', err)
      alert('Erreur lors de la generation du PDF')
    } finally {
      setPdfGenerating(false)
      setPdfModal(false)
    }
  }, [report, selectedId, isoData, drawPieChart, drawBarChart, drawMonthlyChart, drawCumulativeChart, drawHorizontalBars])

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports & Synthese</h1>
          <p className="text-gray-500 mt-1">Bilan Carbone - GHG Protocol / ISO 14064 / ISO 14069</p>
        </div>
        {report && (
          <button onClick={() => setPdfModal(true)} className="btn-primary inline-flex items-center gap-2">
            <Download className="w-4 h-4" /> Telecharger PDF
          </button>
        )}
      </div>

      {/* Assessment selector */}
      <div className="card p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Bilan :</label>
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className="input-field max-w-md">
            {assessments.map(a => (
              <option key={a.id} value={a.id}>{a.name} - {a.site_name} ({a.year})</option>
            ))}
          </select>
        </div>
      </div>

      {assessments.length === 0 && (
        <div className="card p-16 text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun bilan disponible</h3>
          <p className="text-gray-500">Creez un bilan et saisissez des donnees pour voir les rapports.</p>
        </div>
      )}

      {loading && <div className="text-center py-12 text-gray-500">Chargement du rapport...</div>}

      {report && !loading && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total emissions', value: report.summary.total, color: 'brand', icon: TrendingDown },
              { label: 'Scope 1 - Direct', value: report.summary.scope1, color: 'red', icon: Shield },
              { label: 'Scope 2 - Energie', value: report.summary.scope2, color: 'orange', icon: Shield },
              { label: 'Scope 3 - Indirect', value: report.summary.scope3, color: 'blue', icon: Globe },
            ].map((s, i) => {
              const Icon = s.icon
              return (
                <div key={i} className={`card p-5 border-l-4 ${
                  s.color === 'brand' ? 'border-l-brand-500' :
                  s.color === 'red' ? 'border-l-red-500' :
                  s.color === 'orange' ? 'border-l-orange-500' : 'border-l-blue-500'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-500">{s.label}</p>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{formatCO2(s.value)}</p>
                  {report.summary.total > 0 && i > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <span>{((s.value / report.summary.total) * 100).toFixed(1)}% du total</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${
                          s.color === 'red' ? 'bg-red-400' : s.color === 'orange' ? 'bg-orange-400' : 'bg-blue-400'
                        }`} style={{ width: `${Math.min(100, (s.value / report.summary.total) * 100)}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Report tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
            {[
              { id: 'overview' as const, label: 'Vue d\'ensemble', icon: BarChart3 },
              { id: 'monthly' as const, label: 'Mensuel', icon: Calendar },
              { id: 'ghg' as const, label: 'GHG Protocol', icon: FileText },
              { id: 'iso' as const, label: 'ISO 14064', icon: Shield },
              { id: 'detail' as const, label: 'Detail', icon: Globe },
            ].map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveReportTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeReportTab === tab.id ? 'bg-white text-brand-700 shadow-md ring-1 ring-brand-200' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* ===== OVERVIEW TAB ===== */}
          {activeReportTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Scope pie chart */}
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Repartition par Scope</h3>
                  {scopeData.length > 0 ? (
                    <div className="flex items-center gap-6">
                      {/* Donut */}
                      <div className="flex-shrink-0" style={{ width: 180, height: 180 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={scopeData}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              innerRadius={45}
                              dataKey="value"
                              paddingAngle={3}
                              minAngle={20}
                              strokeWidth={0}
                            >
                              {scopeData.map((entry, index) => (
                                <Cell key={index} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => formatCO2(value)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      {/* Legend */}
                      <div className="flex-1 space-y-3">
                        {scopeData.map((entry, i) => {
                          const total = scopeData.reduce((s, e) => s + e.value, 0)
                          const pct = total > 0 ? (entry.value / total) * 100 : 0
                          return (
                            <div key={i}>
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: entry.fill }} />
                                  <span className="text-sm font-medium text-gray-700">{entry.name}</span>
                                </div>
                                <span className="text-sm font-bold text-gray-900">{formatCO2(entry.value)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: entry.fill }} />
                                </div>
                                <span className="text-xs font-semibold text-gray-500 w-12 text-right">{pct.toFixed(1)}%</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400">Aucune donnee</div>
                  )}
                </div>

                {/* Category bar chart */}
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Emissions par categorie</h3>
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={Math.max(250, categoryData.length * 50)}>
                      <BarChart data={categoryData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={smartAxisFormat} scale="auto" />
                        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value: number) => formatCO2(value)} />
                        <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]}>
                          {categoryData.map((_, index) => (
                            <Cell key={index} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12 text-gray-400">Aucune donnee</div>
                  )}
                </div>
              </div>

              {/* Top emitters chart */}
              {topEmittersData.length > 0 && (
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Top sources d&apos;emissions</h3>
                  <p className="text-sm text-gray-500 mb-6">Les {topEmittersData.length} principales sources d&apos;emissions identifiees</p>
                  <ResponsiveContainer width="100%" height={Math.max(250, topEmittersData.length * 40)}>
                    <BarChart data={topEmittersData} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={smartAxisFormat} scale="auto" />
                      <YAxis type="category" dataKey="name" width={200} tick={{ fontSize: 10 }} />
                      <Tooltip content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload
                          return (
                            <div className="bg-white p-3 rounded-lg shadow-lg border text-sm">
                              <p className="font-semibold text-gray-900">{d.fullName}</p>
                              <p className="text-gray-500">{d.category} - Scope {d.scope}</p>
                              <p className="font-bold text-brand-700 mt-1">{formatCO2(d.value)}</p>
                            </div>
                          )
                        }
                        return null
                      }} />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                        {topEmittersData.map((d, i) => (
                          <Cell key={i} fill={d.scope === 1 ? '#ef4444' : d.scope === 2 ? '#f97316' : '#3b82f6'} fillOpacity={1 - i * 0.05} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Subcategory breakdown */}
              {subcategoryData.length > 0 && (
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Repartition par sous-categorie</h3>
                  <p className="text-sm text-gray-500 mb-6">Ventilation detaillee par type de source</p>
                  <ResponsiveContainer width="100%" height={Math.max(250, subcategoryData.length * 40)}>
                    <BarChart data={subcategoryData} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={smartAxisFormat} scale="auto" />
                      <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 10 }} />
                      <Tooltip content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload
                          return (
                            <div className="bg-white p-3 rounded-lg shadow-lg border text-sm">
                              <p className="font-semibold text-gray-900">{d.fullName}</p>
                              <p className="text-gray-500">{d.category}</p>
                              <p className="font-bold text-brand-700 mt-1">{formatCO2(d.value)}</p>
                            </div>
                          )
                        }
                        return null
                      }} />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                        {subcategoryData.map((_, i) => (
                          <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Scope x Category — stacked horizontal bar */}
              {scopeByCategoryData.length > 0 && (
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Composition par scope et categorie</h3>
                  <p className="text-sm text-gray-500 mb-6">Decomposition de chaque categorie selon les trois scopes du GHG Protocol</p>
                  <ResponsiveContainer width="100%" height={Math.max(260, scopeByCategoryData.length * 48)}>
                    <BarChart data={scopeByCategoryData} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={smartAxisFormat} scale="auto" />
                      <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value: number) => formatCO2(value)} />
                      <Legend />
                      <Bar dataKey="scope1" stackId="cat" name="Scope 1" fill="#ef4444" />
                      <Bar dataKey="scope2" stackId="cat" name="Scope 2" fill="#f97316" />
                      <Bar dataKey="scope3" stackId="cat" name="Scope 3" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Cumulative trend in overview when monthly data available */}
              {cumulativeData.length > 0 && cumulativeData.some(c => c.cumulative > 0) && (
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Cumul des emissions sur l&apos;annee</h3>
                  <p className="text-sm text-gray-500 mb-6">Progression cumulee des emissions mois apres mois</p>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={cumulativeData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="cumGradOverview" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={smartAxisFormat} />
                      <Tooltip formatter={(value: number) => formatCO2(value)} />
                      <Area type="monotone" dataKey="cumulative" name="Cumul" stroke="#10b981" strokeWidth={2.5} fill="url(#cumGradOverview)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Company info card */}
              <div className="card p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Informations du bilan</h3>
                <div className="grid grid-cols-3 gap-6 text-sm">
                  <div>
                    <p className="text-gray-400 mb-1">Entreprise</p>
                    <p className="font-medium text-gray-800">{report.assessment.company_name || '-'}</p>
                    <p className="text-xs text-gray-400">{report.assessment.rccm ? `RCCM: ${report.assessment.rccm}` : ''} {report.assessment.sector ? `| ${report.assessment.sector}` : ''}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Site</p>
                    <p className="font-medium text-gray-800">{report.assessment.site_name || '-'}</p>
                    <p className="text-xs text-gray-400">{report.assessment.site_type || ''} {report.assessment.site_address ? `- ${report.assessment.site_address}` : ''}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Nombre de postes saisis</p>
                    <p className="font-medium text-gray-800">{report.entries?.length || 0} postes d&apos;emission</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== MONTHLY TAB ===== */}
          {activeReportTab === 'monthly' && (
            <div className="space-y-6">
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Calendar className="w-5 h-5 text-brand-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Suivi mensuel des emissions</h3>
                </div>
                {report.byMonth && report.byMonth.some(m => m.total > 0) ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={report.byMonth} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={smartAxisFormat} />
                      <Tooltip formatter={(value: number) => formatCO2(value)} />
                      <Legend />
                      <Bar dataKey="scope1" stackId="a" name="Scope 1" fill="#ef4444" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="scope2" stackId="a" name="Scope 2" fill="#f97316" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="scope3" stackId="a" name="Scope 3" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-gray-400">Aucune donnee mensuelle. Saisissez des donnees mois par mois dans le bilan.</div>
                )}
              </div>

              {/* Cumulative area chart */}
              {cumulativeData.length > 0 && cumulativeData.some(c => c.cumulative > 0) && (
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Evolution cumulative</h3>
                  <p className="text-sm text-gray-500 mb-6">Progression des emissions cumulees sur l&apos;annee</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={cumulativeData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={smartAxisFormat} />
                      <Tooltip formatter={(value: number) => formatCO2(value)} />
                      <Area type="monotone" dataKey="cumulative" name="Cumul" stroke="#10b981" strokeWidth={2.5} fill="url(#cumGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Monthly detail table */}
              {report.byMonth && report.byMonth.some(m => m.total > 0) && (
                <div className="card p-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Detail mensuel (kgCO2eq)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                          <th className="text-left px-4 py-3 font-medium">Mois</th>
                          <th className="text-right px-4 py-3 font-medium">Scope 1</th>
                          <th className="text-right px-4 py-3 font-medium">Scope 2</th>
                          <th className="text-right px-4 py-3 font-medium">Scope 3</th>
                          <th className="text-right px-4 py-3 font-medium">Total</th>
                          <th className="text-right px-4 py-3 font-medium">Part (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {report.byMonth.map((m, i) => (
                          <tr key={i} className={m.total > 0 ? 'hover:bg-gray-50' : 'opacity-40'}>
                            <td className="px-4 py-2 font-medium text-gray-800">{m.label}</td>
                            <td className="px-4 py-2 text-right text-red-600">{m.scope1 > 0 ? formatCO2(m.scope1) : '-'}</td>
                            <td className="px-4 py-2 text-right text-orange-600">{m.scope2 > 0 ? formatCO2(m.scope2) : '-'}</td>
                            <td className="px-4 py-2 text-right text-blue-600">{m.scope3 > 0 ? formatCO2(m.scope3) : '-'}</td>
                            <td className="px-4 py-2 text-right font-semibold text-gray-900">{m.total > 0 ? formatCO2(m.total) : '-'}</td>
                            <td className="px-4 py-2 text-right text-gray-500">
                              {report.summary.total > 0 && m.total > 0 ? ((m.total / report.summary.total) * 100).toFixed(1) + '%' : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-brand-50 font-bold">
                          <td className="px-4 py-3 text-brand-800">TOTAL ANNUEL</td>
                          <td className="px-4 py-3 text-right text-red-700">{formatCO2(report.summary.scope1)}</td>
                          <td className="px-4 py-3 text-right text-orange-700">{formatCO2(report.summary.scope2)}</td>
                          <td className="px-4 py-3 text-right text-blue-700">{formatCO2(report.summary.scope3)}</td>
                          <td className="px-4 py-3 text-right text-brand-800">{formatCO2(report.summary.total)}</td>
                          <td className="px-4 py-3 text-right text-brand-800">100%</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Yearly comparison */}
              {report.byYear && report.byYear.length > 0 && (
                <div className="card p-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Comparaison annuelle (kgCO2eq)</h3>
                  {report.byYear.length > 1 ? (
                    <div className="mb-6">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={report.byYear.map(y => ({ ...y, label: String(y.year) }))} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                          <YAxis tickFormatter={smartAxisFormat} />
                          <Tooltip formatter={(value: number) => formatCO2(value)} />
                          <Legend />
                          <Bar dataKey="scope1" stackId="a" name="Scope 1" fill="#ef4444" />
                          <Bar dataKey="scope2" stackId="a" name="Scope 2" fill="#f97316" />
                          <Bar dataKey="scope3" stackId="a" name="Scope 3" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : null}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                          <th className="text-left px-4 py-3 font-medium">Annee</th>
                          <th className="text-right px-4 py-3 font-medium">Scope 1</th>
                          <th className="text-right px-4 py-3 font-medium">Scope 2</th>
                          <th className="text-right px-4 py-3 font-medium">Scope 3</th>
                          <th className="text-right px-4 py-3 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {report.byYear.map((y, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-2 font-bold text-gray-900">{y.year}</td>
                            <td className="px-4 py-2 text-right text-red-600">{y.scope1 > 0 ? formatCO2(y.scope1) : '-'}</td>
                            <td className="px-4 py-2 text-right text-orange-600">{y.scope2 > 0 ? formatCO2(y.scope2) : '-'}</td>
                            <td className="px-4 py-2 text-right text-blue-600">{y.scope3 > 0 ? formatCO2(y.scope3) : '-'}</td>
                            <td className="px-4 py-2 text-right font-semibold text-gray-900">{formatCO2(y.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== GHG PROTOCOL TAB ===== */}
          {activeReportTab === 'ghg' && (
            <div className="space-y-6">
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="w-5 h-5 text-brand-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Rapport GHG Protocol - Corporate Standard</h3>
                </div>

                {/* Scope 1 */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <h4 className="font-semibold text-red-700">Scope 1 - Emissions directes</h4>
                    <span className="ml-auto font-bold text-red-700">{formatCO2(report.summary.scope1)}</span>
                  </div>
                  <div className="pl-5 space-y-1">
                    {ghgData.filter(d => d.name.startsWith('1-')).map((item, i) => (
                      <div key={i} className="flex justify-between text-sm py-1.5 border-b border-gray-50">
                        <span className="text-gray-600">{item.name}</span>
                        <span className="font-medium text-gray-800">{formatCO2(item.value)}</span>
                      </div>
                    ))}
                    {ghgData.filter(d => d.name.startsWith('1-')).length === 0 && (
                      <p className="text-sm text-gray-400 italic">Aucune emission Scope 1</p>
                    )}
                  </div>
                </div>

                {/* Scope 2 */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <h4 className="font-semibold text-orange-700">Scope 2 - Emissions indirectes liees a l&apos;energie</h4>
                    <span className="ml-auto font-bold text-orange-700">{formatCO2(report.summary.scope2)}</span>
                  </div>
                  <div className="pl-5 space-y-1">
                    {ghgData.filter(d => d.name.startsWith('2-')).map((item, i) => (
                      <div key={i} className="flex justify-between text-sm py-1.5 border-b border-gray-50">
                        <span className="text-gray-600">{item.name}</span>
                        <span className="font-medium text-gray-800">{formatCO2(item.value)}</span>
                      </div>
                    ))}
                    {ghgData.filter(d => d.name.startsWith('2-')).length === 0 && (
                      <p className="text-sm text-gray-400 italic">Aucune emission Scope 2</p>
                    )}
                  </div>
                </div>

                {/* Scope 3 */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <h4 className="font-semibold text-blue-700">Scope 3 - Autres emissions indirectes</h4>
                    <span className="ml-auto font-bold text-blue-700">{formatCO2(report.summary.scope3)}</span>
                  </div>
                  <div className="pl-5 space-y-1">
                    {ghgData.filter(d => d.name.startsWith('3-')).map((item, i) => (
                      <div key={i} className="flex justify-between text-sm py-1.5 border-b border-gray-50">
                        <span className="text-gray-600">{item.name}</span>
                        <span className="font-medium text-gray-800">{formatCO2(item.value)}</span>
                      </div>
                    ))}
                    {ghgData.filter(d => d.name.startsWith('3-')).length === 0 && (
                      <p className="text-sm text-gray-400 italic">Aucune emission Scope 3</p>
                    )}
                  </div>
                </div>

                {/* Grand total */}
                <div className="border-t-2 border-brand-200 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg text-brand-800">TOTAL DES EMISSIONS</span>
                    <span className="font-bold text-lg text-brand-800">{formatCO2(report.summary.total)}</span>
                  </div>
                </div>
              </div>

              {/* GHG bar chart */}
              <div className="card p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Repartition par categorie GHG</h3>
                {ghgData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={Math.max(250, ghgData.length * 45)}>
                    <BarChart data={ghgData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={smartAxisFormat} scale="auto" />
                      <YAxis type="category" dataKey="name" width={250} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value: number) => formatCO2(value)} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {ghgData.map((item, index) => (
                          <Cell key={index} fill={item.name.startsWith('1-') ? '#ef4444' : item.name.startsWith('2-') ? '#f97316' : '#3b82f6'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-gray-400">Aucune donnee</div>
                )}
              </div>

              {/* Scope 3 detail breakdown */}
              {ghgData.filter(d => d.name.startsWith('3-')).length > 1 && (
                <div className="card p-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Focus Scope 3 - Detail</h3>
                  <p className="text-xs text-gray-400 mb-4">Le Scope 3 represente generalement la majorite des emissions</p>
                  {(() => {
                    const scope3Items = ghgData.filter(d => d.name.startsWith('3-'))
                    const scope3Colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#2563eb', '#1d4ed8', '#1e40af', '#dbeafe']
                    return (
                      <div>
                        <ResponsiveContainer width="100%" height={240}>
                          <PieChart>
                            <Pie
                              data={scope3Items}
                              cx="50%" cy="50%" outerRadius={90} innerRadius={40}
                              dataKey="value"
                              paddingAngle={2}
                              minAngle={10}
                              label={({ name, percent }) => `${name.split(' - ').pop()?.slice(0, 12)}: ${(percent * 100).toFixed(0)}%`}
                              labelLine={true}
                            >
                              {scope3Items.map((_, i) => (
                                <Cell key={i} fill={scope3Colors[i % scope3Colors.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => formatCO2(value)} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap justify-center gap-3 mt-3">
                          {scope3Items.map((item, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: scope3Colors[i % scope3Colors.length] }} />
                              <span className="text-xs text-gray-600 truncate max-w-[140px]">{item.name.split(' - ').pop()}</span>
                              <span className="text-xs font-semibold text-gray-800">{formatCO2(item.value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          )}

          {/* ===== ISO 14064/14069 TAB ===== */}
          {activeReportTab === 'iso' && (
            <div className="space-y-6">
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Shield className="w-5 h-5 text-brand-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Rapport ISO 14064-1 / ISO 14069</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                        <th className="text-left px-4 py-3 font-medium">Poste ISO 14069</th>
                        <th className="text-center px-4 py-3 font-medium">Scope</th>
                        <th className="text-right px-4 py-3 font-medium">Nb postes</th>
                        <th className="text-right px-4 py-3 font-medium">Emissions (kgCO2eq)</th>
                        <th className="text-right px-4 py-3 font-medium">Part (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {isoData.map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              item.scope === 1 ? 'bg-red-100 text-red-700' :
                              item.scope === 2 ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                            }`}>Scope {item.scope}</span>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-500">{item.count}</td>
                          <td className="px-4 py-3 text-right font-medium text-gray-800">{formatCO2(item.total)}</td>
                          <td className="px-4 py-3 text-right text-gray-500">
                            {report.summary.total > 0 ? ((item.total / report.summary.total) * 100).toFixed(1) : '0'}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-brand-50 font-bold">
                        <td className="px-4 py-3 text-brand-800">TOTAL</td>
                        <td className="px-4 py-3" />
                        <td className="px-4 py-3 text-right text-brand-800">{report.entries?.length || 0}</td>
                        <td className="px-4 py-3 text-right text-brand-800">{formatCO2(report.summary.total)}</td>
                        <td className="px-4 py-3 text-right text-brand-800">100%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* ISO bar chart */}
              {isoData.length > 0 && (
                <div className="card p-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Repartition visuelle ISO 14069</h3>
                  <ResponsiveContainer width="100%" height={Math.max(250, isoData.length * 45)}>
                    <BarChart data={isoData.map(d => ({ ...d, value: Math.round(d.total) }))} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={smartAxisFormat} scale="auto" />
                      <YAxis type="category" dataKey="name" width={200} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value: number) => formatCO2(value)} />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                        {isoData.map((d, i) => (
                          <Cell key={i} fill={d.scope === 1 ? '#ef4444' : d.scope === 2 ? '#f97316' : '#3b82f6'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Standards reference */}
              <div className="card p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Cadre normatif</h3>
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-bold text-gray-700 mb-2">ISO 14064-1:2018</p>
                    <p>Specification et lignes directrices, au niveau des organismes, pour la quantification et la declaration des emissions et des suppressions des gaz a effet de serre.</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-bold text-gray-700 mb-2">ISO 14069:2013</p>
                    <p>Guide d&apos;application de l&apos;ISO 14064-1 pour la quantification et la declaration des emissions de GES. Definit les categories 1-1 a 6-2.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== DETAIL TAB ===== */}
          {activeReportTab === 'detail' && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Detail de tous les postes d&apos;emission</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                      <th className="text-left px-4 py-3 font-medium">Source</th>
                      <th className="text-left px-4 py-3 font-medium">Categorie</th>
                      <th className="text-center px-4 py-3 font-medium">Scope</th>
                      <th className="text-right px-4 py-3 font-medium">Quantite</th>
                      <th className="text-left px-4 py-3 font-medium">Unite</th>
                      <th className="text-right px-4 py-3 font-medium">FE</th>
                      <th className="text-right px-4 py-3 font-medium">Total (kgCO2eq)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(report.entries || []).map((entry, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <p className="font-medium text-gray-800 text-sm">{entry.factor_name}</p>
                          <p className="text-xs text-gray-400">{entry.source_characterization}</p>
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-500">{entry.ghg_category}</td>
                        <td className="px-4 py-2 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            entry.scope === 1 ? 'bg-red-100 text-red-700' :
                            entry.scope === 2 ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                          }`}>{entry.scope}</span>
                        </td>
                        <td className="px-4 py-2 text-right text-gray-700">{Number(entry.quantity).toLocaleString('fr-FR')}</td>
                        <td className="px-4 py-2 text-xs text-gray-500">{entry.unit?.replace('kgCO2eq/', '') || ''}</td>
                        <td className="px-4 py-2 text-right text-xs text-gray-400">{entry.factor_value}</td>
                        <td className="px-4 py-2 text-right font-semibold text-gray-900">{formatCO2(parseFloat(String(entry.total_co2eq)) || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-brand-50 font-bold">
                      <td colSpan={6} className="px-4 py-3 text-brand-800">TOTAL</td>
                      <td className="px-4 py-3 text-right text-brand-800">{formatCO2(report.summary.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {(!report.entries || report.entries.length === 0) && (
                <div className="text-center py-12 text-gray-400">Aucun poste d&apos;emission saisi. Allez dans le bilan pour saisir vos donnees.</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===== PDF DOWNLOAD MODAL ===== */}
      {pdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
            <button onClick={() => setPdfModal(false)} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5 text-gray-400" />
            </button>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
                <Download className="w-7 h-7 text-brand-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Telecharger le rapport PDF</h3>
              <p className="text-sm text-gray-500 mt-2">Choisissez le type de rapport a generer</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => generatePDF('yearly')}
                disabled={pdfGenerating}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-brand-400 hover:bg-brand-50 transition-all text-left disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Rapport Annuel</p>
                  <p className="text-xs text-gray-500">Synthese globale avec repartition par scope, categorie, GHG et ISO</p>
                </div>
              </button>
              <button
                onClick={() => generatePDF('monthly')}
                disabled={pdfGenerating}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-brand-400 hover:bg-brand-50 transition-all text-left disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Rapport Mensuel Detaille</p>
                  <p className="text-xs text-gray-500">Inclut le suivi mensuel complet en plus de la synthese annuelle</p>
                </div>
              </button>
            </div>
            {pdfGenerating && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 text-sm text-brand-600">
                  <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                  Generation du PDF en cours...
                </div>
              </div>
            )}
            <div className="mt-5 flex items-center gap-2 text-xs text-gray-400">
              <QrCode className="w-3.5 h-3.5" />
              <span>Chaque rapport inclut un QR code pour acces rapide en ligne</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
