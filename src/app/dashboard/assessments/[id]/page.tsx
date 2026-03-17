import dynamic from 'next/dynamic'

const AssessmentDetailClient = dynamic(
  () => import('./AssessmentDetailClient'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Chargement du bilan…</p>
        </div>
      </div>
    ),
  }
)

export default function Page() {
  return <AssessmentDetailClient />
}
