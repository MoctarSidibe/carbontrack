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

export default function CncDashboardPage() {
  const router = useRouter()
  const [certs, setCerts] = useState<CncCertification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/cnc/certifications')
      .then(r => r.json())
      .then(data => {
        setCerts(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const pending = certs.filter(c => c.status === 'submitted_to_cnc')
  const completed = certs.filter(c => c.status === 'certificate_generated')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Conseil National du Climat</h1>
        <p className="text-gray-400 text-sm mt-1">Espace de certification officielle</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider">En attente</p>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-bold text-white">{pending.length}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Certificats émis</p>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-white">{completed.length}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total dossiers</p>
            <FileCheck className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white">{certs.length}</p>
        </div>
      </div>

      {/* Pending certifications */}
      {pending.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Dossiers en attente de certificat</h2>
          <div className="space-y-2">
            {pending.map(cert => (
              <button
                key={cert.id}
                onClick={() => router.push(`/cnc/certifications/${cert.id}`)}
                className="w-full bg-gray-800 border border-gray-700 hover:border-emerald-500/50 rounded-xl p-4 text-left transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">{cert.assessmentName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{cert.companyName} · {cert.assessmentYear}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">En attente</span>
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transition-colors" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recently completed */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Certificats émis</h2>
          <div className="space-y-2">
            {completed.slice(0, 5).map(cert => (
              <button
                key={cert.id}
                onClick={() => router.push(`/cnc/certifications/${cert.id}`)}
                className="w-full bg-gray-800 border border-gray-700 hover:border-emerald-500/50 rounded-xl p-4 text-left transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">{cert.assessmentName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{cert.companyName} · N° {cert.certificateNumber}</p>
                  </div>
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full ml-4">Certificat émis</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {certs.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <FileCheck className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p>Aucun dossier soumis pour le moment.</p>
          <p className="text-sm text-gray-600 mt-1">Les dossiers vous seront attribués par les administrateurs.</p>
        </div>
      )}
    </div>
  )
}
