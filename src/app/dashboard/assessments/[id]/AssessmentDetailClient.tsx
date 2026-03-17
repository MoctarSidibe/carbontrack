'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Save, Flame, Package, Truck, Users, Trash2, Building, Factory, ChevronDown, ChevronRight, AlertCircle, CheckCircle2, BarChart3, X, Calendar, Paperclip, Upload, FileText, Eye, Trash, Shield, Award } from 'lucide-react'
import {
  ENERGY_FUELS_STATIONARY, ENERGY_FUELS_ORGANIC, ENERGY_FUELS_MOBILE,
  ELECTRICITY_FACTORS, STEAM_COOLING_FACTORS, REFRIGERANT_FACTORS,
  INPUTS_METALS, INPUTS_PLASTICS, INPUTS_OTHER,
  FREIGHT_FACTORS, TRANSPORT_PEOPLE_FACTORS, WASTE_FACTORS, CAPITAL_GOODS_FACTORS,
  ALL_EMISSION_FACTORS,
  SCOPE_MAPPING,
  type EmissionFactor
} from '@/lib/emission-factors'

/* ============================================================
   TYPES
   ============================================================ */
interface EntryRow {
  id: string
  emissionFactorId: string
  factorName: string
  category: string
  subcategory: string
  quantity: number
  unit: string
  factorUpstream: number
  factorCombustion: number
  factorValue: number
  totalCo2eq: number
  scope: number
  ghgCategory: string
  isoCategory: string
  description: string
  sourceCharacterization: string
  month: number
  year: number
}

interface AuditDoc {
  id: number
  assessment_id: number
  emission_factor_id: string
  year: number
  month: number
  filename: string
  original_name: string
  file_size: number
  mime_type: string
  created_at: string
}

const MONTHS = [
  { id: 0, label: 'Annuel', short: 'An' },
  { id: 1, label: 'Janvier', short: 'Jan' },
  { id: 2, label: 'Fevrier', short: 'Fev' },
  { id: 3, label: 'Mars', short: 'Mar' },
  { id: 4, label: 'Avril', short: 'Avr' },
  { id: 5, label: 'Mai', short: 'Mai' },
  { id: 6, label: 'Juin', short: 'Jun' },
  { id: 7, label: 'Juillet', short: 'Jul' },
  { id: 8, label: 'Aout', short: 'Aou' },
  { id: 9, label: 'Septembre', short: 'Sep' },
  { id: 10, label: 'Octobre', short: 'Oct' },
  { id: 11, label: 'Novembre', short: 'Nov' },
  { id: 12, label: 'Decembre', short: 'Dec' },
]

/* ============================================================
   TAB DEFINITIONS  (7 main tabs matching Excel sheets)
   ============================================================ */
const TABS = [
  { id: 'energy',        label: 'Energie',              icon: Flame,   color: 'red' },
  { id: 'non_energy',    label: 'Hors Energie',         icon: Factory, color: 'red' },
  { id: 'inputs',        label: 'Intrants',             icon: Package, color: 'blue' },
  { id: 'freight',       label: 'Fret',                 icon: Truck,   color: 'blue' },
  { id: 'transport',     label: 'Transport',            icon: Users,   color: 'blue' },
  { id: 'waste',         label: 'Dechets',              icon: Trash2,  color: 'blue' },
  { id: 'capital',       label: 'Immo.',                icon: Building,color: 'blue' },
]

/* Each tab has sub-sections with their emission factors */
interface SubSection {
  id: string
  label: string
  scopeLabel: string
  scope: number
  factors: EmissionFactor[]
  description?: string
}

const TAB_SECTIONS: Record<string, SubSection[]> = {
  energy: [
    { id: 'fuels_stationary', label: '1 - Combustibles fossiles (sources fixes)', scopeLabel: 'Scope 1', scope: 1, factors: ENERGY_FUELS_STATIONARY, description: 'Butane, Propane, Gaz naturel, Diesel, Charbon, Coke - Consommation directe sur site' },
    { id: 'fuels_organic', label: '2 - Combustibles d\'origine organique', scopeLabel: 'Scope 1', scope: 1, factors: ENERGY_FUELS_ORGANIC, description: 'Biodiesel, Biomethane, Bois, Granules - Sources renouvelables' },
    { id: 'fuels_mobile', label: '3 - Combustibles (sources mobiles)', scopeLabel: 'Scope 1', scope: 1, factors: ENERGY_FUELS_MOBILE, description: 'Essence, Diesel, GPL, GNL, Kerosene - Vehicules et engins' },
    { id: 'steam', label: '4 - Achat de vapeur et froid', scopeLabel: 'Scope 2', scope: 2, factors: STEAM_COOLING_FACTORS, description: 'Reseaux de chaleur, reseaux de froid' },
    { id: 'electricity', label: '5 - Achat d\'electricite', scopeLabel: 'Scope 2', scope: 2, factors: ELECTRICITY_FACTORS, description: 'Electricite par pays/region et par usage (chauffage, industrie, transport...)' },
  ],
  non_energy: [
    { id: 'refrigerants', label: '1 - Fluides frigorigenes (HFC)', scopeLabel: 'Scope 1', scope: 1, factors: REFRIGERANT_FACTORS.filter(f => f.subcategory === 'refrigerants'), description: 'Fuites de climatisation, refrigeration' },
    { id: 'process', label: '2 - Emissions de procedes', scopeLabel: 'Scope 1', scope: 1, factors: REFRIGERANT_FACTORS.filter(f => f.subcategory === 'process'), description: 'CO2, N2O, CH4 - Emissions directes hors combustion' },
  ],
  inputs: [
    { id: 'metals', label: '1 - Metaux', scopeLabel: 'Scope 3', scope: 3, factors: INPUTS_METALS, description: 'Acier, Aluminium, Cuivre, Nickel - neufs et recycles' },
    { id: 'plastics', label: '2 - Plastiques', scopeLabel: 'Scope 3', scope: 3, factors: INPUTS_PLASTICS, description: 'PET, PEHD, PVC, Nylon, Plastique moyen' },
    { id: 'other_inputs', label: '3 - Verre, Papier, Construction, Eau', scopeLabel: 'Scope 3', scope: 3, factors: INPUTS_OTHER, description: 'Verre, Papier/Carton, Beton, Ciment, Eau potable' },
  ],
  freight: [
    { id: 'road', label: '1 - Fret routier', scopeLabel: 'Scope 3', scope: 3, factors: FREIGHT_FACTORS.filter(f => f.subcategory === 'road'), description: 'Camions articules, rigides, utilitaires' },
    { id: 'air_freight', label: '2 - Fret aerien', scopeLabel: 'Scope 3', scope: 3, factors: FREIGHT_FACTORS.filter(f => f.subcategory === 'air'), description: 'Transport aerien de marchandises' },
    { id: 'rail_freight', label: '3 - Fret ferroviaire', scopeLabel: 'Scope 3', scope: 3, factors: FREIGHT_FACTORS.filter(f => f.subcategory === 'rail'), description: 'Transport ferroviaire de marchandises' },
    { id: 'maritime_freight', label: '4 - Fret maritime et fluvial', scopeLabel: 'Scope 3', scope: 3, factors: FREIGHT_FACTORS.filter(f => f.subcategory === 'maritime' || f.subcategory === 'river'), description: 'Container maritime, fret fluvial' },
  ],
  transport: [
    { id: 'car', label: '1 - Voitures', scopeLabel: 'Scope 3', scope: 3, factors: TRANSPORT_PEOPLE_FACTORS.filter(f => f.subcategory === 'car'), description: 'Essence, Diesel, Electrique, Hybride' },
    { id: 'public', label: '2 - Transports en commun', scopeLabel: 'Scope 3', scope: 3, factors: TRANSPORT_PEOPLE_FACTORS.filter(f => ['bus', 'train', 'metro'].includes(f.subcategory)), description: 'Bus, TGV, TER, Metro' },
    { id: 'plane', label: '3 - Avion', scopeLabel: 'Scope 3', scope: 3, factors: TRANSPORT_PEOPLE_FACTORS.filter(f => f.subcategory === 'plane'), description: 'Court, moyen et long courrier' },
  ],
  waste: [
    { id: 'building_waste', label: '1 - Dechets du batiment', scopeLabel: 'Scope 3', scope: 3, factors: WASTE_FACTORS.filter(f => f.subcategory === 'building'), description: 'Beton, Bois, Dechets inertes, Platre' },
    { id: 'mineral_waste', label: '2 - Dechets mineraux', scopeLabel: 'Scope 3', scope: 3, factors: WASTE_FACTORS.filter(f => f.subcategory === 'mineral'), description: 'Incineration, Enfouissement' },
    { id: 'organic_waste', label: '3 - Dechets organiques', scopeLabel: 'Scope 3', scope: 3, factors: WASTE_FACTORS.filter(f => f.subcategory === 'organic'), description: 'Compost, Papier, Carton' },
    { id: 'plastic_waste', label: '4 - Dechets plastiques', scopeLabel: 'Scope 3', scope: 3, factors: WASTE_FACTORS.filter(f => f.subcategory === 'plastic'), description: 'Plastique moyen, PE, PVC' },
    { id: 'household_waste', label: '5 - Ordures menageres', scopeLabel: 'Scope 3', scope: 3, factors: WASTE_FACTORS.filter(f => f.subcategory === 'household'), description: 'Dechets menagers courants' },
    { id: 'dangerous_waste', label: '6 - Dechets dangereux', scopeLabel: 'Scope 3', scope: 3, factors: WASTE_FACTORS.filter(f => f.subcategory === 'dangerous'), description: 'Dechets industriels speciaux' },
    { id: 'wastewater', label: '7 - Eaux usees', scopeLabel: 'Scope 3', scope: 3, factors: WASTE_FACTORS.filter(f => f.subcategory === 'water'), description: 'Traitement des eaux usees' },
  ],
  capital: [
    { id: 'buildings', label: '1 - Batiments (methode surface)', scopeLabel: 'Scope 3', scope: 3, factors: CAPITAL_GOODS_FACTORS.filter(f => f.subcategory === 'buildings'), description: 'Bureau, Entrepot, Industriel - kgCO2eq/m2 amorti' },
    { id: 'vehicles', label: '2 - Vehicules', scopeLabel: 'Scope 3', scope: 3, factors: CAPITAL_GOODS_FACTORS.filter(f => f.subcategory === 'vehicles'), description: 'Vehicules de societe, camions' },
    { id: 'it', label: '3 - Informatique', scopeLabel: 'Scope 3', scope: 3, factors: CAPITAL_GOODS_FACTORS.filter(f => f.subcategory === 'it'), description: 'Ordinateurs, serveurs, smartphones' },
    { id: 'furniture', label: '4 - Mobilier', scopeLabel: 'Scope 3', scope: 3, factors: CAPITAL_GOODS_FACTORS.filter(f => f.subcategory === 'furniture'), description: 'Bureaux, chaises' },
  ],
}

/* ============================================================
   HELPER: format CO2
   ============================================================ */
function formatCO2(v: number): string {
  if (Math.abs(v) >= 1000000) return `${(v / 1000000).toFixed(2)} ktCO2eq`
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(2)} tCO2eq`
  return `${v.toFixed(1)} kgCO2eq`
}

function formatNum(v: number): string {
  return v.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function AssessmentDetailClient() {
  const params = useParams()
  const assessmentId = params.id as string

  const [assessment, setAssessment] = useState<{ name: string; year: number; site_name: string; status: string } | null>(null)
  const [activeTab, setActiveTab] = useState('energy')
  const [activeYear, setActiveYear] = useState(new Date().getFullYear())
  const [activeMonth, setActiveMonth] = useState(1) // 0 = Annuel (read-only), 1-12 = months
  // entries: factorId -> { 'year-month': qty } e.g. { 'elec_fr': { '2025-1': 100, '2025-2': 120, '2024-6': 50 } }
  const [entries, setEntries] = useState<Record<string, Record<string, number>>>({})
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [showSummary, setShowSummary] = useState(false)

  // Document upload state
  const [docs, setDocs] = useState<AuditDoc[]>([])
  const [docPanel, setDocPanel] = useState<{ factorId: string; factorName: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Certification state
  const [certStatus, setCertStatus] = useState<string | null>(null) // null | pending | assigned | in_progress | certified | rejected
  const [certLoading, setCertLoading] = useState(false)
  const [showCertModal, setShowCertModal] = useState(false)
  const [certMessage, setCertMessage] = useState('')
  const [certSubmitting, setCertSubmitting] = useState(false)

  /* ---- Load data ---- */
  const loadData = useCallback(async () => {
    try {
      const [aRes, eRes] = await Promise.all([
        fetch('/api/assessments').then(r => r.json()),
        fetch(`/api/emissions?assessmentId=${assessmentId}`).then(r => r.json())
      ])
      const found = aRes.find((a: { id: number }) => String(a.id) === assessmentId)
      if (found) {
        setAssessment(found)
        setActiveYear(found.year || new Date().getFullYear())
      }

      // Build map: factorId -> { 'year-month': quantity }
      const map: Record<string, Record<string, number>> = {}
      const yearsSet = new Set<number>()
      if (Array.isArray(eRes)) {
        for (const e of eRes) {
          const fid = e.emission_factor_id
          const m = parseInt(e.month) || 0
          const y = parseInt(e.year) || 0
          if (!map[fid]) map[fid] = {}
          // Legacy entries with month=0 or year=0: default to assessment year + month 1
          const targetMonth = m === 0 ? 1 : m
          const targetYear = y === 0 ? (found?.year || new Date().getFullYear()) : y
          const key = `${targetYear}-${targetMonth}`
          map[fid][key] = (map[fid][key] || 0) + (parseFloat(e.quantity) || 0)
          yearsSet.add(targetYear)
        }
      }
      // Ensure at least the assessment year is available
      const baseYear = found?.year || new Date().getFullYear()
      yearsSet.add(baseYear)
      setAvailableYears(Array.from(yearsSet).sort())
      setEntries(map)

      // Auto-open first section of each tab
      const autoOpen: Record<string, boolean> = {}
      Object.values(TAB_SECTIONS).forEach(sections => {
        if (sections.length > 0) autoOpen[sections[0].id] = true
      })
      setOpenSections(autoOpen)
    } catch { /* ignore */ }
  }, [assessmentId])

  useEffect(() => { loadData() }, [loadData])

  /* ---- Load documents ---- */
  const loadDocuments = useCallback(async () => {
    try {
      const res = await fetch(`/api/documents?assessmentId=${assessmentId}`)
      if (res.ok) {
        const data = await res.json()
        setDocs(Array.isArray(data) ? data : [])
      }
    } catch { /* ignore */ }
  }, [assessmentId])

  useEffect(() => { loadDocuments() }, [loadDocuments])

  /* ---- Load certification status ---- */
  useEffect(() => {
    fetch(`/api/certifications/${assessmentId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.certification) setCertStatus(data.certification.status)
      })
      .catch(() => {})
  }, [assessmentId])

  const handleCertRequest = async () => {
    setCertSubmitting(true)
    try {
      const res = await fetch('/api/certifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId: parseInt(assessmentId), message: certMessage }),
      })
      if (res.ok) {
        setCertStatus('pending')
        setShowCertModal(false)
        setCertMessage('')
      }
    } catch { /* ignore */ }
    setCertSubmitting(false)
  }

  // Get docs for a specific factor + year + month (or all months if month=0)
  const getDocsForFactor = (factorId: string): AuditDoc[] => {
    if (activeMonth === 0) {
      return docs.filter(d => d.emission_factor_id === factorId && d.year === activeYear)
    }
    return docs.filter(d => d.emission_factor_id === factorId && d.year === activeYear && d.month === activeMonth)
  }

  // Count total docs for a factor across all years/months
  const getDocCount = (factorId: string): number => {
    return docs.filter(d => d.emission_factor_id === factorId).length
  }

  // Upload handler
  const handleUpload = async (file: File) => {
    if (!docPanel || activeMonth === 0) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('assessmentId', assessmentId)
      fd.append('factorId', docPanel.factorId)
      fd.append('year', String(activeYear))
      fd.append('month', String(activeMonth))
      const res = await fetch('/api/documents', { method: 'POST', body: fd })
      if (res.ok) {
        await loadDocuments()
      }
    } catch { /* ignore */ }
    setUploading(false)
  }

  // Delete handler
  const handleDeleteDoc = async (docId: number) => {
    try {
      const res = await fetch('/api/documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: docId, assessmentId }),
      })
      if (res.ok) {
        await loadDocuments()
      }
    } catch { /* ignore */ }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} o`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
  }

  /* ---- Quantity helpers (year + month aware) ---- */
  const setQuantity = (factorId: string, year: number, month: number, value: number) => {
    const key = `${year}-${month}`
    setEntries(prev => ({
      ...prev,
      [factorId]: { ...prev[factorId], [key]: value }
    }))
  }

  // Get quantity for a specific year+month, or sum of all months for a year if month=0
  const getQuantity = (factorId: string, year?: number, month?: number): number => {
    const y = year ?? activeYear
    const m = month ?? activeMonth
    const data = entries[factorId]
    if (!data) return 0
    if (m === 0) {
      // Annual = sum of months 1-12 for the given year
      let sum = 0
      for (let i = 1; i <= 12; i++) sum += data[`${y}-${i}`] || 0
      return sum
    }
    return data[`${y}-${m}`] || 0
  }

  // Get grand total (sum ALL years, ALL months) for a factor — used for scope cards
  const getGrandTotalQty = (factorId: string): number => {
    const data = entries[factorId]
    if (!data) return 0
    return Object.values(data).reduce((sum, v) => sum + (v || 0), 0)
  }

  // Get annual total for a specific year
  const getYearQty = (factorId: string, year: number): number => {
    const data = entries[factorId]
    if (!data) return 0
    let sum = 0
    for (let i = 1; i <= 12; i++) sum += data[`${year}-${i}`] || 0
    return sum
  }

  const calcTotal = (factor: EmissionFactor): number => {
    return getQuantity(factor.id) * factor.factorTotal
  }

  const calcGrandTotal = (factor: EmissionFactor): number => {
    return getGrandTotalQty(factor.id) * factor.factorTotal
  }

  const calcUpstream = (factor: EmissionFactor): number => {
    return getQuantity(factor.id) * factor.factorUpstream
  }

  const calcCombustion = (factor: EmissionFactor): number => {
    return getQuantity(factor.id) * factor.factorCombustion
  }

  /* ---- Totals ---- */
  const allFactors = useMemo(() => ALL_EMISSION_FACTORS, [])

  // Scope totals always use GRAND total (all years, all months) for the top cards
  const grandTotal = useMemo(() => allFactors.reduce((s, f) => s + calcGrandTotal(f), 0), [entries, allFactors])
  const scope1Total = useMemo(() => {
    return allFactors.filter(f => {
      const si = SCOPE_MAPPING[f.subcategory]
      return si && si.scope === 1
    }).reduce((s, f) => s + calcGrandTotal(f), 0)
  }, [entries, allFactors])
  const scope2Total = useMemo(() => {
    return allFactors.filter(f => {
      const si = SCOPE_MAPPING[f.subcategory]
      return si && si.scope === 2
    }).reduce((s, f) => s + calcGrandTotal(f), 0)
  }, [entries, allFactors])
  const scope3Total = useMemo(() => {
    return allFactors.filter(f => {
      const si = SCOPE_MAPPING[f.subcategory]
      return si && si.scope === 3
    }).reduce((s, f) => s + calcGrandTotal(f), 0)
  }, [entries, allFactors])

  const calcSectionTotal = (factors: EmissionFactor[]): number =>
    factors.reduce((sum, f) => sum + calcTotal(f), 0)

  const calcTabTotal = (tabId: string): number => {
    const sections = TAB_SECTIONS[tabId] || []
    return sections.reduce((sum, sec) => sum + calcSectionTotal(sec.factors), 0)
  }

  /* ---- GHG Protocol breakdown (grand total all years) ---- */
  const ghgBreakdown = useMemo(() => {
    const map: Record<string, { total: number; upstream: number; combustion: number }> = {}
    for (const f of allFactors) {
      const si = SCOPE_MAPPING[f.subcategory]
      if (!si) continue
      const key = si.ghgCategory
      const qty = getGrandTotalQty(f.id)
      if (!map[key]) map[key] = { total: 0, upstream: 0, combustion: 0 }
      map[key].total += qty * f.factorTotal
      map[key].upstream += qty * f.factorUpstream
      map[key].combustion += qty * f.factorCombustion
    }
    return Object.entries(map).filter(([, v]) => v.total > 0).sort((a, b) => b[1].total - a[1].total)
  }, [entries, allFactors])

  /* ---- ISO 14069 breakdown (grand total all years) ---- */
  const isoBreakdown = useMemo(() => {
    const map: Record<string, number> = {}
    for (const f of allFactors) {
      const si = SCOPE_MAPPING[f.subcategory]
      if (!si) continue
      const key = `${si.isoCategory} - ${si.ghgCategory.split(' ').slice(1).join(' ')}`
      if (!map[key]) map[key] = 0
      map[key] += getGrandTotalQty(f.id) * f.factorTotal
    }
    return Object.entries(map).filter(([, v]) => v > 0).sort((a, b) => a[0].localeCompare(b[0]))
  }, [entries, allFactors])

  /* ---- Save (all years x 12 months) ---- */
  const handleSave = async () => {
    setSaving(true)
    setSaveMsg('')
    try {
      const allEntries: Omit<EntryRow, 'id'>[] = []
      // Collect all years that have data
      const yearsWithData = new Set<number>()
      for (const data of Object.values(entries)) {
        for (const key of Object.keys(data)) {
          const y = parseInt(key.split('-')[0])
          if (y > 0) yearsWithData.add(y)
        }
      }
      const years = Array.from(yearsWithData).sort()

      for (const [, sections] of Object.entries(TAB_SECTIONS)) {
        for (const sec of sections) {
          for (const factor of sec.factors) {
            for (const yr of years) {
              for (let m = 1; m <= 12; m++) {
                const qty = getQuantity(factor.id, yr, m)
                if (qty > 0) {
                  const scopeInfo = SCOPE_MAPPING[factor.subcategory] || { scope: 3, ghgCategory: 'Autre', isoCategory: '' }
                  allEntries.push({
                    emissionFactorId: factor.id,
                    factorName: factor.nameFr,
                    category: factor.category,
                    subcategory: factor.subcategory,
                    quantity: qty,
                    unit: factor.unit,
                    factorUpstream: factor.factorUpstream,
                    factorCombustion: factor.factorCombustion,
                    factorValue: factor.factorTotal,
                    totalCo2eq: qty * factor.factorTotal,
                    scope: scopeInfo.scope,
                    ghgCategory: scopeInfo.ghgCategory,
                    isoCategory: scopeInfo.isoCategory,
                    description: `${factor.nameFr} - ${factor.source}`,
                    sourceCharacterization: factor.region,
                    month: m,
                    year: yr,
                  })
                }
              }
            }
          }
        }
      }

      const res = await fetch('/api/emissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId, entries: allEntries }),
      })

      if (res.ok) {
        setSaveMsg('Sauvegarde reussie !')
        setTimeout(() => setSaveMsg(''), 3000)
      } else {
        setSaveMsg('Erreur de sauvegarde')
      }
    } catch {
      setSaveMsg('Erreur de connexion')
    } finally {
      setSaving(false)
    }
  }

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }))
  }

  /* ---- Scope color helpers ---- */
  const scopeColor = (scope: number) => {
    if (scope === 1) return { bg: 'bg-red-50', text: 'text-red-600', badge: 'bg-red-100 text-red-700', border: 'border-red-200' }
    if (scope === 2) return { bg: 'bg-orange-50', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-700', border: 'border-orange-200' }
    return { bg: 'bg-blue-50', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700', border: 'border-blue-200' }
  }

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="max-w-[1400px] mx-auto">
      {/* ---- HEADER ---- */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Link href="/dashboard/assessments" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 truncate">{assessment?.name || 'Chargement...'}</h1>
          <p className="text-gray-500 text-sm truncate">{assessment?.site_name} &bull; Annee {assessment?.year}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {saveMsg && (
            <span className={`text-sm font-medium flex items-center gap-1 ${saveMsg.includes('Erreur') ? 'text-red-500' : 'text-brand-600'}`}>
              {saveMsg.includes('Erreur') ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              {saveMsg}
            </span>
          )}
          <button onClick={() => setShowSummary(!showSummary)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Synthese
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary inline-flex items-center gap-2 disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* Certification status bar */}
      <div className="mb-5">
        {certStatus === 'certified' ? (
          <div className="flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl shadow-sm">
            <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-green-800 font-semibold text-sm">Bilan certifie</p>
              <p className="text-green-600 text-xs">Ce bilan a ete verifie et certifie par nos experts accredites</p>
            </div>
          </div>
        ) : certStatus === 'pending' || certStatus === 'assigned' || certStatus === 'in_progress' ? (
          <div className="flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-xl shadow-sm">
            <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 animate-pulse">
              <Shield className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-amber-800 font-semibold text-sm">Certification en cours</p>
              <p className="text-amber-600 text-xs">Votre demande est en traitement par notre equipe d&apos;experts</p>
            </div>
          </div>
        ) : certStatus === 'rejected' ? (
          <button onClick={() => setShowCertModal(true)} className="w-full flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-300 rounded-xl shadow-sm hover:shadow-md hover:border-red-400 transition-all text-left group">
            <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-red-800 font-semibold text-sm">Certification refusee</p>
              <p className="text-red-600 text-xs">Cliquez ici pour soumettre une nouvelle demande</p>
            </div>
            <ArrowRight className="w-4 h-4 text-red-400 group-hover:translate-x-1 transition-transform" />
          </button>
        ) : (
          <button onClick={() => setShowCertModal(true)} className="w-full flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-brand-50 to-emerald-50 border-2 border-brand-300 rounded-xl shadow-sm hover:shadow-md hover:border-brand-400 transition-all text-left group">
            <div className="w-9 h-9 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-brand-600" />
            </div>
            <div className="flex-1">
              <p className="text-brand-800 font-semibold text-sm">Certifier ce bilan carbone par nos experts</p>
              <p className="text-brand-600 text-xs">Demandez un audit et une certification officielle de vos donnees</p>
            </div>
            <ArrowRight className="w-4 h-4 text-brand-400 group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </div>

      {/* Certification Request Modal */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
                    <Shield className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Certifier ce bilan carbone</h3>
                    <p className="text-sm text-gray-500">Par nos experts accredites</p>
                  </div>
                </div>
                <button onClick={() => setShowCertModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-brand-50 rounded-xl p-4 mb-5">
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-brand-800">
                    <p className="font-semibold mb-1">Processus de certification</p>
                    <ol className="list-decimal list-inside space-y-1 text-brand-700">
                      <li>Votre demande est envoyee a notre equipe</li>
                      <li>Un expert est assigne pour l&apos;audit</li>
                      <li>Inspection sur site et verification des donnees</li>
                      <li>Rapport de certification delivre</li>
                    </ol>
                  </div>
                </div>
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message (optionnel)</label>
              <textarea
                value={certMessage}
                onChange={(e) => setCertMessage(e.target.value)}
                className="input-field h-24 resize-none"
                placeholder="Informations complementaires pour nos experts..."
              />
            </div>
            <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
              <button onClick={() => setShowCertModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                Annuler
              </button>
              <button onClick={handleCertRequest} disabled={certSubmitting} className="btn-primary inline-flex items-center gap-2 disabled:opacity-50">
                <Shield className="w-4 h-4" />
                {certSubmitting ? 'Envoi...' : 'Envoyer la demande'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- SCOPE SUMMARY CARDS ---- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total general', value: grandTotal, color: 'bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700 border border-brand-200' },
          { label: 'Scope 1 - Direct', value: scope1Total, color: 'bg-gradient-to-br from-red-50 to-red-100 text-red-700 border border-red-200' },
          { label: 'Scope 2 - Energie', value: scope2Total, color: 'bg-gradient-to-br from-orange-50 to-orange-100 text-orange-700 border border-orange-200' },
          { label: 'Scope 3 - Indirect', value: scope3Total, color: 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 border border-blue-200' },
        ].map((s, i) => (
          <div key={i} className={`rounded-xl p-4 ${s.color}`}>
            <p className="text-xs font-medium opacity-70 mb-1">{s.label}</p>
            <p className="text-lg font-bold">{formatCO2(s.value)}</p>
            {grandTotal > 0 && i > 0 && (
              <div className="mt-2 h-1.5 bg-white/50 rounded-full overflow-hidden">
                <div className="h-full bg-current opacity-40 rounded-full" style={{ width: `${Math.min(100, (s.value / grandTotal) * 100)}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ---- GHG / ISO SUMMARY PANEL ---- */}
      {showSummary && (
        <div className="card mb-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Synthese GHG Protocol / ISO 14069</h2>
            <button onClick={() => setShowSummary(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {/* GHG Protocol */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">GHG Protocol - Categories</h3>
              <div className="space-y-2">
                {ghgBreakdown.map(([cat, vals]) => (
                  <div key={cat} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 truncate mr-2">{cat}</span>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-gray-400">amont: {formatNum(vals.upstream)} | comb: {formatNum(vals.combustion)}</span>
                      <span className="font-semibold text-gray-900 w-28 text-right">{formatCO2(vals.total)}</span>
                    </div>
                  </div>
                ))}
                {ghgBreakdown.length === 0 && <p className="text-gray-400 text-sm">Aucune donnee saisie</p>}
              </div>
            </div>
            {/* ISO 14069 */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">ISO 14069 - Postes</h3>
              <div className="space-y-2">
                {isoBreakdown.map(([cat, val]) => (
                  <div key={cat} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 truncate mr-2">{cat}</span>
                    <span className="font-semibold text-gray-900 flex-shrink-0">{formatCO2(val)}</span>
                  </div>
                ))}
                {isoBreakdown.length === 0 && <p className="text-gray-400 text-sm">Aucune donnee saisie</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- YEAR + MONTH SELECTOR ---- */}
      <div className="card mb-6 p-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Year selector */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-500">Annee :</span>
            <select
              value={activeYear}
              onChange={e => setActiveYear(parseInt(e.target.value))}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-900 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none cursor-pointer"
            >
              {(() => {
                const now = new Date().getFullYear()
                const start = Math.min(2000, ...availableYears)
                const end = Math.max(now + 5, ...availableYears)
                const years: number[] = []
                for (let y = end; y >= start; y--) years.push(y)
                return years.map(y => (
                  <option key={y} value={y}>
                    {y}{availableYears.includes(y) ? ' ●' : ''}
                  </option>
                ))
              })()}
            </select>
          </div>

          <div className="w-px h-6 bg-gray-200 flex-shrink-0" />

          {/* Month selector */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-xs font-medium text-gray-500">Mois :</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {MONTHS.map(m => {
              const isActive = activeMonth === m.id
              const isAnnual = m.id === 0
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveMonth(m.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? isAnnual
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {m.short}
                </button>
              )
            })}
          </div>
          {activeMonth === 0 && (
            <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100 whitespace-nowrap">Lecture seule - somme {activeYear}</span>
          )}
        </div>
      </div>

      {/* ---- MAIN TABS ---- */}
      <div className="flex flex-wrap gap-1 mb-6 bg-gray-100 p-1 rounded-xl">
        {TABS.map(tab => {
          const tabTotal = calcTabTotal(tab.id)
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-white text-brand-700 shadow-md ring-1 ring-brand-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tabTotal > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-brand-100 text-brand-700' : 'bg-gray-200 text-gray-600'}`}>
                  {formatCO2(tabTotal)}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ---- TAB CONTENT ---- */}
      <div className="space-y-4">
        {(TAB_SECTIONS[activeTab] || []).map(section => {
          const isOpen = openSections[section.id] !== false
          const sectionTotal = calcSectionTotal(section.factors)
          const sc = scopeColor(section.scope)

          return (
            <div key={section.id} className="card overflow-hidden">
              {/* Section header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${sc.bg}`}>
                    <span className={`text-xs font-bold ${sc.text}`}>{section.scope}</span>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 text-sm">{section.label}</h3>
                    {section.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{section.description}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${sc.badge}`}>{section.scopeLabel}</span>
                </div>
                <div className="flex items-center gap-4">
                  {sectionTotal > 0 && (
                    <span className="text-sm font-bold text-gray-800">{formatCO2(sectionTotal)}</span>
                  )}
                  {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                </div>
              </button>

              {/* Section table */}
              {isOpen && (
                <div className="border-t border-gray-100">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                          <th className="text-left px-4 py-3 font-medium" style={{width:'38%'}}>Source d&apos;emission</th>
                          <th className="text-left px-3 py-3 font-medium" style={{width:'8%'}}>Unite</th>
                          <th className="text-right px-3 py-3 font-medium" style={{width:'14%'}}>Quantite</th>
                          <th className="text-right px-3 py-3 font-medium" style={{width:'10%'}}>FE</th>
                          <th className="text-right px-3 py-3 font-medium" style={{width:'18%'}}>Total</th>
                          <th className="text-center px-3 py-3 font-medium" style={{width:'12%'}}>Justif.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {section.factors.map(factor => {
                          const qty = getQuantity(factor.id)
                          const upstream = calcUpstream(factor)
                          const combustion = calcCombustion(factor)
                          const total = upstream + combustion
                          return (
                            <tr key={factor.id} className={`hover:bg-gray-50 transition-colors ${total > 0 ? 'bg-brand-50/30' : ''}`}>
                              <td className="px-4 py-3 min-w-0">
                                <p className="font-medium text-gray-800 text-sm truncate">{factor.nameFr}</p>
                                <div className="flex items-center gap-1 mt-1 flex-wrap">
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">{factor.source}</span>
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-gray-100 text-gray-600">{factor.sourceRef}</span>
                                  <span className="text-[10px] text-gray-400">{factor.region} ±{(factor.uncertainty * 100).toFixed(0)}%</span>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-gray-500 whitespace-nowrap text-xs">{factor.unit.replace('kgCO2eq/', '')}</td>
                              <td className="px-3 py-3">
                                {activeMonth === 0 ? (
                                  <div className="w-28 text-right px-2 py-1.5 text-sm text-gray-600 bg-gray-50 rounded-lg border border-gray-100">
                                    {qty ? formatNum(qty) : '-'}
                                  </div>
                                ) : (
                                  <input
                                    type="number"
                                    value={qty === 0 ? '' : qty}
                                    onChange={e => {
                                      const val = e.target.value
                                      setQuantity(factor.id, activeYear, activeMonth, val === '' ? 0 : parseFloat(val) || 0)
                                    }}
                                    className="w-28 text-right px-2 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm bg-white"
                                    min="0"
                                    step="any"
                                    placeholder="0"
                                  />
                                )}
                              </td>
                              <td className="px-3 py-3 text-right text-xs text-gray-600 font-medium">{factor.factorTotal}</td>
                              <td className="px-3 py-3 text-right font-semibold text-gray-900">
                                {total > 0 ? formatCO2(total) : '-'}
                              </td>
                              <td className="px-3 py-3 text-center">
                                {(() => {
                                  const factorDocs = getDocsForFactor(factor.id)
                                  const totalDocs = getDocCount(factor.id)
                                  const hasDocsForView = factorDocs.length > 0
                                  return (
                                    <button
                                      onClick={() => setDocPanel({ factorId: factor.id, factorName: factor.nameFr })}
                                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                                        hasDocsForView
                                          ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                                          : qty > 0
                                            ? 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100'
                                            : 'bg-gray-50 text-gray-400 border border-gray-100 hover:bg-gray-100'
                                      }`}
                                      title={hasDocsForView ? `${factorDocs.length} doc(s) justificatif(s)` : 'Ajouter un justificatif'}
                                    >
                                      {hasDocsForView ? (
                                        <>
                                          <Paperclip className="w-3 h-3" />
                                          <span>{factorDocs.length}</span>
                                        </>
                                      ) : qty > 0 ? (
                                        <>
                                          <Upload className="w-3 h-3" />
                                        </>
                                      ) : (
                                        <Paperclip className="w-3 h-3" />
                                      )}
                                      {totalDocs > 0 && totalDocs !== factorDocs.length && (
                                        <span className="text-gray-400">/{totalDocs}</span>
                                      )}
                                    </button>
                                  )
                                })()}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50 font-semibold text-sm">
                          <td colSpan={4} className="px-4 py-3 text-gray-700">Total</td>
                          <td className="px-3 py-3 text-right text-gray-900">{formatCO2(sectionTotal)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ---- DOCUMENT PANEL (modal slide-over) ---- */}
      {docPanel && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDocPanel(null)} />
          <div className="relative w-full max-w-md bg-white shadow-xl flex flex-col animate-in slide-in-from-right">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 text-sm truncate">Justificatifs</h3>
                <p className="text-xs text-gray-500 truncate">{docPanel.factorName}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {activeMonth === 0 ? `Annee ${activeYear}` : `${MONTHS[activeMonth]?.label} ${activeYear}`}
                </p>
              </div>
              <button onClick={() => setDocPanel(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Upload area */}
            {activeMonth !== 0 && (
              <div className="p-4 border-b">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.csv"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) handleUpload(file)
                    e.target.value = ''
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50 transition-all disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Envoi en cours...' : 'Cliquer pour uploader un justificatif'}
                </button>
                <p className="text-[10px] text-gray-400 mt-2 text-center">PDF, Images, Excel, Word - max 10 Mo</p>
              </div>
            )}
            {activeMonth === 0 && (
              <div className="p-4 border-b bg-amber-50">
                <p className="text-xs text-amber-600">Selectionnez un mois pour uploader un justificatif</p>
              </div>
            )}

            {/* Documents list */}
            <div className="flex-1 overflow-y-auto p-4">
              {(() => {
                const panelDocs = getDocsForFactor(docPanel.factorId)
                if (panelDocs.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <Paperclip className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">Aucun justificatif</p>
                      <p className="text-xs text-gray-300 mt-1">Uploadez un document pour justifier cette entree</p>
                    </div>
                  )
                }
                return (
                  <div className="space-y-2">
                    {panelDocs.map(doc => (
                      <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                        <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-brand-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{doc.original_name}</p>
                          <p className="text-[10px] text-gray-400">
                            {formatFileSize(doc.file_size)} &bull; {MONTHS[doc.month]?.short} {doc.year} &bull; {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a
                            href={`/api/documents/${doc.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-white rounded-lg text-gray-400 hover:text-brand-600"
                            title="Voir"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleDeleteDoc(doc.id)}
                            className="p-1.5 hover:bg-white rounded-lg text-gray-400 hover:text-red-500"
                            title="Supprimer"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>

            {/* Footer summary */}
            <div className="p-3 border-t bg-gray-50 text-[10px] text-gray-400 text-center">
              {getDocCount(docPanel.factorId)} justificatif(s) au total pour cette source
            </div>
          </div>
        </div>
      )}

      {/* ---- BOTTOM BANNER - Bilan Carbone standards ---- */}
      <div className="mt-8 card p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Normes et standards de reference</h3>
        <div className="grid grid-cols-4 gap-4 text-xs text-gray-500">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="font-bold text-gray-700 mb-1">ISO 14064</p>
            <p>Specification et lignes directrices pour la quantification et la declaration des emissions de GES</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="font-bold text-gray-700 mb-1">ISO 14069</p>
            <p>Lignes directrices pour l&apos;application de l&apos;ISO 14064-1 - Categories d&apos;emissions</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="font-bold text-gray-700 mb-1">GHG Protocol</p>
            <p>Corporate Standard - Scope 1, 2, 3 - Categories 1 a 15 du protocole</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="font-bold text-gray-700 mb-1">Bilan Carbone&reg;</p>
            <p>Methode de l&apos;ADEME - Base Carbone - Facteurs d&apos;emissions France metropolitaine et Europe</p>
          </div>
        </div>
      </div>
    </div>
  )
}
