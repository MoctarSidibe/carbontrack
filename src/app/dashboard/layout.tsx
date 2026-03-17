'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Leaf, LayoutDashboard, Building2, ClipboardList, BarChart3,
  LogOut, Menu, X, ChevronRight, User, Award, Clock
} from 'lucide-react'

function ExpiryBanner({ expiresAt }: { expiresAt: string }) {
  const [visible, setVisible] = useState(true)
  const daysLeft = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  if (!visible || daysLeft > 14) return null

  const isUrgent = daysLeft <= 3

  return (
    <div className={`flex items-center justify-between gap-3 px-5 py-2.5 text-sm ${
      isUrgent
        ? 'bg-red-50 border-b border-red-200 text-red-800'
        : 'bg-amber-50 border-b border-amber-200 text-amber-800'
    }`}>
      <div className="flex items-center gap-2">
        <Clock className={`w-4 h-4 flex-shrink-0 ${isUrgent ? 'text-red-500' : 'text-amber-500'}`} />
        <span>
          {daysLeft <= 0
            ? 'Votre abonnement a expiré.'
            : <>Votre abonnement expire dans <strong>{daysLeft} jour{daysLeft > 1 ? 's' : ''}</strong>.</>
          }
          {' '}
          <Link href="/subscription" className="underline font-medium hover:opacity-80">Renouveler</Link>
        </span>
      </div>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className={`p-1 rounded hover:bg-black/10 flex-shrink-0 ${isUrgent ? 'text-red-600' : 'text-amber-700'}`}
        title="Fermer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

interface UserData {
  id: number
  email: string
  firstName: string
  lastName: string
  phone: string
  company: { id: number; name: string; logoUrl: string | null }
  subscription: { id: number; plan: string; status: string; expiresAt: string } | null
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<UserData | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated')
        return res.json()
      })
      .then(data => {
        setUser(data)
        if (!data.subscription) {
          router.push('/subscription')
          return
        }
        setLoading(false)
      })
      .catch(() => {
        router.push('/login')
      })
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const navItems = [
    { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/dashboard/sites', label: 'Sites & Entités', icon: Building2 },
    { href: '/dashboard/assessments', label: 'Bilans Carbone', icon: ClipboardList },
    { href: '/dashboard/reports', label: 'Rapports & Graphiques', icon: BarChart3 },
    { href: '/dashboard/certifications', label: 'Bilans Certifies', icon: Award },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Leaf className="w-7 h-7 text-white" />
          </div>
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-100 flex flex-col transition-all duration-300 fixed h-full z-20`}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-brand-600">
              {user?.company?.logoUrl
                ? <img src={user.company.logoUrl} alt={user.company.name} className="w-full h-full object-contain" />
                : <Leaf className="w-6 h-6 text-white" />}
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{user?.company?.name || 'CarbonTrack'}</p>
                <p className="text-xs text-gray-400">CarbonTrack</p>
              </div>
            )}
          </Link>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive ? 'active' : ''} ${!sidebarOpen ? 'justify-center px-2' : ''}`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
                {sidebarOpen && isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-gray-100">
          {sidebarOpen && user && (
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-brand-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`sidebar-link text-red-500 hover:bg-red-50 hover:text-red-600 w-full ${!sidebarOpen ? 'justify-center px-2' : ''}`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300 overflow-hidden`}>
        {/* Subscription expiry banner */}
        {user?.subscription && <ExpiryBanner expiresAt={user.subscription.expiresAt} />}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
