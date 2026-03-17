'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Building2, Users, CreditCard,
  Award, LogOut, Menu, X, ChevronRight, ShieldCheck, User, UserCheck, Settings
} from 'lucide-react'

interface AdminUser {
  id: number
  email: string
  firstName: string
  lastName: string
  role: string
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<AdminUser | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated')
        return res.json()
      })
      .then(data => {
        if (data.role !== 'admin') {
          router.push('/dashboard')
          return
        }
        setUser(data)
        setLoading(false)
      })
      .catch(() => {
        router.push('/admin/login')
      })
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  const navItems = [
    { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/admin/companies', label: 'Entreprises', icon: Building2 },
    { href: '/admin/users', label: 'Utilisateurs', icon: Users },
    { href: '/admin/subscriptions', label: 'Abonnements', icon: CreditCard },
    { href: '/admin/certifications', label: 'Certifications', icon: Award },
    { href: '/admin/experts', label: 'Experts', icon: UserCheck },
    { href: '/admin/settings', label: 'Paramètres', icon: Settings },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <p className="text-gray-500 text-sm">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300 fixed h-full z-20`}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2 min-w-0">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="text-sm font-bold text-white leading-tight">CarbonTrack</p>
                <p className="text-xs text-gray-500">Administration</p>
              </div>
            )}
          </Link>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500 hover:text-white p-1 flex-shrink-0">
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                title={!sidebarOpen ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                  ${isActive ? 'bg-brand-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
                  ${!sidebarOpen ? 'justify-center' : ''}`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="flex-1">{item.label}</span>}
                {sidebarOpen && isActive && <ChevronRight className="w-4 h-4" />}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-800 space-y-1">
          {sidebarOpen && user && (
            <div className="flex items-center gap-3 px-3 py-2 mb-1">
              <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            title={!sidebarOpen ? 'Déconnexion' : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors w-full ${!sidebarOpen ? 'justify-center' : ''}`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300 min-h-screen bg-gray-950`}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
