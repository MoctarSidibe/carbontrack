'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Award, Clock, Search, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

interface CertRow {
  id: number
  status: string
  assessmentName: string
  assessmentYear: number
  companyName: string
  totalCo2eq: number
  requestedAt: string
  updatedAt: string
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  assigned:    { label: 'Assigné',          cls: 'bg-blue-500/20 text-blue-400' },
  in_progress: { label: 'En cours',         cls: 'bg-violet-500/20 text-violet-400' },
  certified:   { label: 'Certifié',         cls: 'bg-green-500/20 text-green-400' },
  rejected:    { label: 'Rejeté',           cls: 'bg-red-500/20 text-red-400' },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] || { label: status, cls: 'bg-gray-700 text-gray-400' }
  return <span className={`inline-flex items-center text-xs px-2 py-1 rounded-full ${s.cls}`}>{s.label}</span>
}

function fmt(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(2) + ' tCO₂e'
  return n.toFixed(2) + ' kgCO₂e'
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ExpertDashboard() {
  const router = useRouter()
  const [certs, setCerts] = useState<CertRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/expert/certifications')
      .then(r => {
        if (r.status === 403) { router.push('/expert/login'); throw new Error('unauthorized') }
        return r.json()
      })
      .then(data => {
        setCerts(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [router])

  const counts = {
    // "Assigné" = total active caseload (assigned + in_progress)
    // so the number doesn't drop to 0 once you start an inspection
    assigned: certs.filter(c => c.status === 'assigned' || c.status === 'in_progress').length,
    in_progress: certs.filter(c => c.status === 'in_progress').length,
    certified: certs.filter(c => c.status === 'certified').length,
    rejected: certs.filter(c => c.status === 'rejected').length,
  }

  const pending = certs.filter(c => c.status === 'assigned' || c.status === 'in_progress')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
        <p className="text-gray-400 text-sm mt-1">{certs.length} bilan{certs.length !== 1 ? 's' : ''} au total</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Assignés', value: counts.assigned, icon: Clock, color: 'bg-blue-500/20 text-blue-400' },
          { label: 'En cours', value: counts.in_progress, icon: Search, color: 'bg-violet-500/20 text-violet-400' },
          { label: 'Certifiés', value: counts.certified, icon: CheckCircle, color: 'bg-green-500/20 text-green-400' },
          { label: 'Rejetés', value: counts.rejected, icon: XCircle, color: 'bg-red-500/20 text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pending actions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">
          En attente d&apos;action ({pending.length})
        </h2>
        {loading && <p className="text-gray-500 text-sm py-4">Chargement...</p>}
        {!loading && pending.length === 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-center">
            <Award className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Aucune certification en attente d&apos;action.</p>
          </div>
        )}
        <div className="space-y-3">
          {pending.map(c => (
            <Link
              key={c.id}
              href={`/expert/certifications/${c.id}`}
              className="block bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-blue-500/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="font-medium text-white">{c.assessmentName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {c.companyName} · {c.assessmentYear}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-brand-400">{fmt(c.totalCo2eq)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{fmtDate(c.updatedAt)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
