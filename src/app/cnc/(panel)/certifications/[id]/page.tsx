'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  CheckCircle, FileText, Building2, Calendar,
  ChevronDown, ChevronUp, Award, TrendingUp, BarChart3,
  Layers, User, Clock, Download, FileCheck,
  AlertCircle, Loader2, X, ScrollText, ArrowLeft,
} from 'lucide-react'

interface Entry {
  id: number; scope: number; category: string; factorName: string
  quantity: number; unit: string; factorValue: number
  totalCo2eq: number; month: number | null
}
interface MonthRow { month: number; label: string; total: number; scope1: number; scope2: number; scope3: number }
interface CatRow { category: string; total: number; scope: number; count: number }
interface DocRow { id: number; docType: string; originalName: string; fileSize: number; createdAt: string }

interface CertDetail {
  id: number; status: string; requestedAt: string; updatedAt: string
  inspectionDate: string | null; inspectionNotes: string | null
  auditChecklist: Record<string, unknown> | null
  auditScheduledDate: string | null; auditLocation: string | null
  certifiedAt: string | null; glCertificateNumber: string | null
  expertName: string | null; expertEmail: string | null
  submittedToCncAt: string | null; cncReviewedAt: string | null
  cncNotes: string | null
  cncCertificatePdfUrl: string | null
  cncCertificateGeneratedAt: string | null
  cncCertificateNumber: string | null
  assessmentId: number; assessmentName: string; assessmentYear: number; approach: string | null
  totalCo2eq: number; scope1: number; scope2: number; scope3: number
  siteName: string; siteType: string; siteAddress: string | null
  companyName: string; sector: string; rccm: string | null
  companyLogoUrl: string | null
  entries: Entry[]; byMonth: MonthRow[]; byCategory: CatRow[]
  documents: DocRow[]
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmt(n: number | null) {
  if (!n) return '—'
  if (n >= 1000) return (n / 1000).toFixed(2) + ' tCO₂e'
  return n.toFixed(2) + ' kgCO₂e'
}

const SCOPE_COLORS = ['', '#22c55e', '#3b82f6', '#f59e0b']
const SCOPE_TEXT = ['', 'text-green-600', 'text-blue-600', 'text-amber-600']
const SCOPE_BG = ['', 'bg-green-50', 'bg-blue-50', 'bg-amber-50']

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  submitted_to_cnc:    { label: 'En attente de certificat', cls: 'text-amber-700 bg-amber-50 border border-amber-200' },
  certificate_generated: { label: 'Certificat émis',          cls: 'text-emerald-700 bg-emerald-50 border border-emerald-200' },
}

export default function CncCertDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [cert, setCert] = useState<CertDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [cncNotes, setCncNotes] = useState('')
  const [showNotesModal, setShowNotesModal] = useState(false)

  const loadCert = () => {
    fetch(`/api/cnc/certifications/${params.id}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => { setCert(data); setCncNotes(data.cncNotes || ''); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(loadCert, [params.id])

  const generateCertificate = async () => {
    if (!cert) return
    setGenerating(true)
    try {
      const res = await fetch(`/api/cnc/certifications/${cert.id}/generate-certificate`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `Erreur ${res.status}` }))
        alert(`Erreur: ${err.error || res.statusText}`)
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `CNC-Certificat-${cert.id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      loadCert()
    } catch (e) {
      alert(`Erreur réseau: ${e}`)
    } finally { setGenerating(false) }
  }

  const saveNotes = async () => {
    if (!cert) return
    await fetch(`/api/cnc/certifications/${cert.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'review', cncNotes }),
    })
    setShowNotesModal(false)
    loadCert()
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
    </div>
  )
  if (!cert) return (
    <div className="text-center py-20 text-gray-500">Certification introuvable.</div>
  )

  const total = Number(cert.totalCo2eq) || 0
  const s = STATUS_LABELS[cert.status] || { label: cert.status, cls: 'bg-gray-100 text-gray-600 border border-gray-200' }

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button onClick={() => router.back()} className="text-xs text-gray-500 hover:text-emerald-600 mb-2 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Retour
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{cert.assessmentName}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{cert.companyName} · {cert.siteName} · {cert.assessmentYear}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full flex-shrink-0 ${s.cls}`}>
          {s.label}
        </span>
      </div>

      {/* Status banners */}
      {cert.status === 'submitted_to_cnc' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-700">Dossier en attente de certification finale</p>
            <p className="text-xs text-amber-600/80 mt-0.5">
              Soumis le {fmtDate(cert.submittedToCncAt)} · Certificat GreenLeaves N° {cert.glCertificateNumber}
            </p>
          </div>
        </div>
      )}
      {cert.status === 'certificate_generated' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <Award className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-700">Certificat CNC émis</p>
            <p className="text-xs text-emerald-600/80 mt-0.5">
              N° {cert.cncCertificateNumber} · Le {fmtDate(cert.cncCertificateGeneratedAt)}
              {cert.cncCertificatePdfUrl && (
                <a href={cert.cncCertificatePdfUrl} target="_blank" className="ml-2 underline hover:text-emerald-500 font-medium">
                  Télécharger le PDF
                </a>
              )}
            </p>
          </div>
        </div>
      )}

      {/* CNC Actions */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider font-medium">Actions CNC</p>
        <div className="flex flex-wrap gap-2">
          {cert.status === 'submitted_to_cnc' && (
            <button
              onClick={generateCertificate}
              disabled={generating}
              className="flex items-center gap-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
            >
              <Award className="w-3.5 h-3.5" />
              {generating ? 'Génération...' : 'Générer le certificat officiel CNC'}
            </button>
          )}
          <button
            onClick={() => setShowNotesModal(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
          >
            <ScrollText className="w-3.5 h-3.5" />
            Notes CNC
          </button>
          {cert.cncCertificatePdfUrl && (
            <a
              href={cert.cncCertificatePdfUrl}
              target="_blank"
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Certificat CNC PDF
            </a>
          )}
        </div>
        {cert.cncNotes && (
          <div className="mt-3 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border-l-[3px] border-emerald-500">
            <span className="text-gray-400 font-medium">Notes CNC : </span>{cert.cncNotes}
          </div>
        )}
      </div>

      {/* Company info */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-start gap-3">
        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
          <Building2 className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 mb-0.5">Entreprise</p>
          <p className="text-sm font-medium text-gray-900">{cert.companyName}</p>
          <p className="text-xs text-gray-500">{cert.sector}{cert.rccm ? ` · RCCM: ${cert.rccm}` : ''}</p>
        </div>
      </div>

      {/* Expert */}
      {cert.expertName && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">Expert auditeur</p>
            <p className="text-sm font-medium text-gray-900">{cert.expertName}</p>
            {cert.expertEmail && <p className="text-xs text-gray-500">{cert.expertEmail}</p>}
          </div>
        </div>
      )}

      {/* Inspection */}
      {cert.auditScheduledDate && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-start gap-3">
          <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Calendar className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-0.5">Inspection</p>
            <p className="text-sm text-gray-900">
              {fmtDate(cert.auditScheduledDate)}{cert.auditLocation ? ` · ${cert.auditLocation}` : ''}
            </p>
            {cert.inspectionNotes && <p className="text-xs text-gray-500 mt-1">{cert.inspectionNotes}</p>}
          </div>
        </div>
      )}

      {/* CO2 Summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-500" />Bilan carbone — Synthèse
        </h2>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {([1, 2, 3] as const).map(sc => (
            <div key={sc} className={`rounded-xl p-3 ${SCOPE_BG[sc]}`}>
              <p className="text-xs text-gray-500 font-medium">Scope {sc}</p>
              <p className={`text-sm font-bold mt-0.5 ${SCOPE_TEXT[sc]}`}>
                {fmt(sc === 1 ? Number(cert.scope1) : sc === 2 ? Number(cert.scope2) : Number(cert.scope3))}
              </p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <span className="text-sm text-gray-600 font-medium">Total CO₂ éq. — </span>
            <span className="text-xs text-gray-400">{cert.entries.length} sources</span>
          </div>
          <span className="text-lg font-bold text-emerald-600">{fmt(total)}</span>
        </div>
      </div>

      {/* Monthly chart */}
      {cert.byMonth.some(m => m.total > 0) && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-500" />Répartition mensuelle
          </h2>
          <div className="flex items-end gap-1 h-28">
            {cert.byMonth.map(m => {
              const maxVal = Math.max(...cert.byMonth.map(x => x.total), 0.001)
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="w-full flex flex-col-reverse gap-px rounded-t overflow-hidden" style={{ height: `${(m.total / maxVal) * 100}%` }}>
                    <div className="w-full bg-green-500/70" style={{ height: `${(m.scope1 / (m.total || 1)) * 100}%` }} />
                    <div className="w-full bg-blue-500/70" style={{ height: `${(m.scope2 / (m.total || 1)) * 100}%` }} />
                    <div className="w-full bg-amber-500/70" style={{ height: `${(m.scope3 / (m.total || 1)) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-500">{m.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Documents */}
      {cert.documents.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-500" />Documents du dossier ({cert.documents.length})
          </h2>
          <div className="space-y-2">
            {cert.documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm text-gray-800">{doc.originalName}</p>
                  <p className="text-xs text-gray-400">{doc.docType} · {(doc.fileSize / 1024).toFixed(1)} Ko · {fmtDate(doc.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Notes CNC</h2>
              <button onClick={() => setShowNotesModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-500">Observations sur le dossier {cert.assessmentName}</p>
              <textarea
                value={cncNotes}
                onChange={e => setCncNotes(e.target.value)}
                rows={5}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 resize-none"
                placeholder="Notes et observations..."
              />
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setShowNotesModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-medium transition-colors">
                Annuler
              </button>
              <button onClick={saveNotes}
                className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors shadow-sm">
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
