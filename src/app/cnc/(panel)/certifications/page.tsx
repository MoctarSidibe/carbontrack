'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileCheck, Clock, Award, ChevronRight, Loader2 } from 'lucide-react'

interface CncCertification {
  id: number
  status: string
  certificateNumber: string | null
  submittedToCncAt: string | null
  cncCertificateGeneratedAt: string | null
  assessmentName: string
  assessmentYear: number
  totalCo2eq: number
  companyName: string
}

export default function CncCertificationsPage() {
  const router = useRouter()
  const [certs, setCerts] = useState<CncCertification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all')

  useEffect(() => {
    fetch('/api/cnc/certifications')
      .then(r => r.json())
      .then(data => {
        setCerts(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? certs
    : filter === 'pending' ? certs.filter(c => c.status === 'submitted_to_cnc')
    : certs.filter(c => c.status === 'certificate_generated')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Certifications</h1>
          <p className="text-gray-400 text-sm mt-1">Dossiers soumis au CNC ({certs.length})</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'pending', 'done'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
              filter === f
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {f === 'all' ? 'Tous' : f === 'pending' ? 'En attente' : 'Certificats émis'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <FileCheck className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p>Aucun dossier dans cette catégorie.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(cert => (
            <button
              key={cert.id}
              onClick={() => router.push(`/cnc/certifications/${cert.id}`)}
              className="w-full bg-gray-800 border border-gray-700 hover:border-emerald-500/50 rounded-xl p-4 text-left transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">{cert.assessmentName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{cert.companyName} · {cert.assessmentYear}</p>
                  {cert.submittedToCncAt && (
                    <p className="text-xs text-gray-500 mt-1">Soumis le {new Date(cert.submittedToCncAt).toLocaleDateString('fr-FR')}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    cert.status === 'submitted_to_cnc'
                      ? 'text-amber-400 bg-amber-500/10'
                      : 'text-emerald-400 bg-emerald-500/10'
                  }`}>
                    {cert.status === 'submitted_to_cnc' ? 'En attente' : 'Certificat émis'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transition-colors" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
