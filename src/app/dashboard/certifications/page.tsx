'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Award, Shield, Clock, CheckCircle2, XCircle, AlertCircle,
  FileText, Download, Calendar, Building2, ArrowRight, User,
  BarChart3, Eye
} from 'lucide-react'

interface CertDoc {
  id: number
  docType: string
  originalName: string
  fileSize: number
  mimeType: string
  createdAt: string
}

interface Certification {
  id: number
  assessmentId: number
  assessmentName: string
  assessmentYear: number
  siteName: string
  totalCo2eq: number
  scope1: number
  scope2: number
  scope3: number
  status: string
  expertName: string | null
  expertEmail: string | null
  inspectionDate: string | null
  inspectionNotes: string | null
  companyMessage: string | null
  adminNotes: string | null
  rejectionReason: string | null
  certifiedAt: string | null
  certificateNumber: string | null
  requestedAt: string
  documents: CertDoc[]
}

function formatCO2(v: number): string {
  if (Math.abs(v) >= 1000000) return `${(v / 1000000).toFixed(2)} ktCO2eq`
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(2)} tCO2eq`
  return `${v.toFixed(1)} kgCO2eq`
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} Mo`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${bytes} o`
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending: { label: 'En attente', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock },
  assigned: { label: 'Expert assigne', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: User },
  in_progress: { label: 'Audit en cours', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: Eye },
  certified: { label: 'Certifie', color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: CheckCircle2 },
  rejected: { label: 'Refuse', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: XCircle },
}

export default function CertificationsPage() {
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null)

  useEffect(() => {
    fetch('/api/certifications')
      .then(r => r.json())
      .then(data => {
        setCertifications(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const certified = certifications.filter(c => c.status === 'certified')
  const inProgress = certifications.filter(c => ['pending', 'assigned', 'in_progress'].includes(c.status))
  const rejected = certifications.filter(c => c.status === 'rejected')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center mx-auto mb-3 animate-pulse">
            <Award className="w-5 h-5 text-brand-600" />
          </div>
          <p className="text-sm text-gray-500">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bilans carbone certifies</h1>
          <p className="text-sm text-gray-500 mt-1">Certification par nos experts accredites</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
            <Award className="w-4 h-4" />
            {certified.length} certifie{certified.length !== 1 ? 's' : ''}
          </div>
          {inProgress.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm font-medium">
              <Clock className="w-4 h-4" />
              {inProgress.length} en cours
            </div>
          )}
        </div>
      </div>

      {/* Empty state */}
      {certifications.length === 0 && (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune certification</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            Vous n&apos;avez pas encore demande de certification pour vos bilans carbone. 
            Ouvrez un bilan et cliquez sur &quot;Certifier ce bilan&quot; pour commencer.
          </p>
          <Link href="/dashboard/assessments" className="btn-primary inline-flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Voir mes bilans
          </Link>
        </div>
      )}

      {/* Certified bilans */}
      {certified.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" /> Bilans certifies
          </h2>
          <div className="space-y-3">
            {certified.map(cert => (
              <CertCard key={cert.id} cert={cert} onSelect={() => setSelectedCert(cert)} />
            ))}
          </div>
        </div>
      )}

      {/* In progress */}
      {inProgress.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" /> En cours de certification
          </h2>
          <div className="space-y-3">
            {inProgress.map(cert => (
              <CertCard key={cert.id} cert={cert} onSelect={() => setSelectedCert(cert)} />
            ))}
          </div>
        </div>
      )}

      {/* Rejected */}
      {rejected.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-600" /> Certifications refusees
          </h2>
          <div className="space-y-3">
            {rejected.map(cert => (
              <CertCard key={cert.id} cert={cert} onSelect={() => setSelectedCert(cert)} />
            ))}
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selectedCert && (
        <CertDetailModal cert={selectedCert} onClose={() => setSelectedCert(null)} />
      )}
    </div>
  )
}

function CertCard({ cert, onSelect }: { cert: Certification; onSelect: () => void }) {
  const config = STATUS_CONFIG[cert.status] || STATUS_CONFIG.pending
  const StatusIcon = config.icon

  return (
    <div
      onClick={onSelect}
      className="card p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Status icon */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${config.bg}`}>
        {cert.status === 'certified' ? (
          <Award className={`w-6 h-6 ${config.color}`} />
        ) : (
          <StatusIcon className={`w-6 h-6 ${config.color}`} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-semibold text-gray-900 truncate">{cert.assessmentName}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${config.bg} ${config.color}`}>
            {config.label}
          </span>
          {cert.certificateNumber && (
            <span className="text-xs text-gray-400 font-mono">N° {cert.certificateNumber}</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{cert.siteName}</span>
          <span>&bull;</span>
          <span>{cert.assessmentYear}</span>
          <span>&bull;</span>
          <span>{formatCO2(cert.totalCo2eq)}</span>
          {cert.expertName && (
            <>
              <span>&bull;</span>
              <span className="flex items-center gap-1"><User className="w-3 h-3" />{cert.expertName}</span>
            </>
          )}
        </div>
      </div>

      {/* Scopes */}
      <div className="hidden md:flex items-center gap-2 flex-shrink-0">
        <span className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded font-medium">S1: {formatCO2(cert.scope1)}</span>
        <span className="text-xs px-2 py-1 bg-orange-50 text-orange-600 rounded font-medium">S2: {formatCO2(cert.scope2)}</span>
        <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded font-medium">S3: {formatCO2(cert.scope3)}</span>
      </div>

      {/* Arrow */}
      <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
    </div>
  )
}

function CertDetailModal({ cert, onClose }: { cert: Certification; onClose: () => void }) {
  const config = STATUS_CONFIG[cert.status] || STATUS_CONFIG.pending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${config.bg}`}>
                {cert.status === 'certified' ? (
                  <Award className={`w-6 h-6 ${config.color}`} />
                ) : (
                  <config.icon className={`w-6 h-6 ${config.color}`} />
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{cert.assessmentName}</h3>
                <p className="text-sm text-gray-500">{cert.siteName} &bull; {cert.assessmentYear}</p>
              </div>
            </div>
            <span className={`text-sm px-3 py-1 rounded-full font-medium border ${config.bg} ${config.color}`}>
              {config.label}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Emissions summary */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total', value: cert.totalCo2eq, color: 'bg-brand-50 text-brand-700 border-brand-200' },
              { label: 'Scope 1', value: cert.scope1, color: 'bg-red-50 text-red-700 border-red-200' },
              { label: 'Scope 2', value: cert.scope2, color: 'bg-orange-50 text-orange-700 border-orange-200' },
              { label: 'Scope 3', value: cert.scope3, color: 'bg-blue-50 text-blue-700 border-blue-200' },
            ].map((s, i) => (
              <div key={i} className={`rounded-xl p-3 border text-center ${s.color}`}>
                <p className="text-xs font-medium opacity-70">{s.label}</p>
                <p className="text-sm font-bold mt-0.5">{formatCO2(s.value)}</p>
              </div>
            ))}
          </div>

          {/* Timeline / details */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">Demande envoyee le</span>
              <span className="font-medium text-gray-900 ml-auto">{formatDate(cert.requestedAt)}</span>
            </div>

            {cert.expertName && (
              <div className="flex items-center gap-3 text-sm p-3 bg-gray-50 rounded-lg">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">Expert assigne</span>
                <span className="font-medium text-gray-900 ml-auto">{cert.expertName}</span>
              </div>
            )}

            {cert.inspectionDate && (
              <div className="flex items-center gap-3 text-sm p-3 bg-gray-50 rounded-lg">
                <Eye className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">Date d&apos;inspection</span>
                <span className="font-medium text-gray-900 ml-auto">{formatDate(cert.inspectionDate)}</span>
              </div>
            )}

            {cert.certifiedAt && (
              <div className="flex items-center gap-3 text-sm p-3 bg-green-50 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-green-700">Certifie le</span>
                <span className="font-medium text-green-800 ml-auto">{formatDate(cert.certifiedAt)}</span>
              </div>
            )}

            {cert.certificateNumber && (
              <div className="flex items-center gap-3 text-sm p-3 bg-green-50 rounded-lg">
                <Award className="w-4 h-4 text-green-600" />
                <span className="text-green-700">Numero de certificat</span>
                <span className="font-mono font-medium text-green-800 ml-auto">{cert.certificateNumber}</span>
              </div>
            )}
          </div>

          {/* Company message */}
          {cert.companyMessage && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Votre message</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{cert.companyMessage}</p>
            </div>
          )}

          {/* Admin notes */}
          {cert.adminNotes && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notes de l&apos;expert</p>
              <p className="text-sm text-gray-700 bg-blue-50 rounded-lg p-3">{cert.adminNotes}</p>
            </div>
          )}

          {/* Rejection reason */}
          {cert.rejectionReason && (
            <div>
              <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2">Motif de refus</p>
              <p className="text-sm text-red-700 bg-red-50 rounded-lg p-3">{cert.rejectionReason}</p>
            </div>
          )}

          {/* Documents */}
          {cert.documents.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Documents de certification</p>
              <div className="space-y-2">
                {cert.documents.map(doc => (
                  <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FileText className="w-5 h-5 text-brand-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{doc.originalName}</p>
                      <p className="text-xs text-gray-400">{formatFileSize(doc.fileSize)} &bull; {formatDate(doc.createdAt)}</p>
                    </div>
                    <a
                      href={`/api/certifications/documents/${doc.id}`}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      title="Telecharger"
                    >
                      <Download className="w-4 h-4 text-gray-500" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex items-center justify-between">
          <Link
            href={`/dashboard/assessments/${cert.assessmentId}`}
            className="text-sm text-brand-600 hover:text-brand-700 font-medium inline-flex items-center gap-1"
          >
            Voir le bilan <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
