'use client'

import { Award } from 'lucide-react'

export default function CncCertificatsPage() {
  return (
    <div className="text-center py-20">
      <div className="mx-auto w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
        <Award className="w-7 h-7 text-emerald-500" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900">Certificats émis</h2>
      <p className="text-sm text-gray-500 mt-1">Cette section est en cours de développement.</p>
    </div>
  )
}
