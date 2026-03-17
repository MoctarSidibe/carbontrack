'use client'

import { useState, useEffect, useCallback } from 'react'
import { CreditCard, Search, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, RefreshCw, Plus, X } from 'lucide-react'

interface Subscription {
  id: number
  plan: string
  amount: number
  currency: string
  paymentMethod: string
  paymentRef: string
  phonePayment: string
  status: string
  startsAt: string
  expiresAt: string
  createdAt: string
  company: { id: number; name: string }
}

interface Company { id: number; name: string }

function formatDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatFCFA(n: number) {
  return n.toLocaleString('fr-FR') + ' FCFA'
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    active:  { label: 'Actif',      cls: 'bg-green-500/20 text-green-400',  icon: <CheckCircle className="w-3 h-3" /> },
    pending: { label: 'En attente', cls: 'bg-yellow-500/20 text-yellow-400', icon: <Clock className="w-3 h-3" /> },
    expired: { label: 'Expiré',     cls: 'bg-red-500/20 text-red-400',      icon: <XCircle className="w-3 h-3" /> },
  }
  const s = map[status] || { label: status, cls: 'bg-gray-700 text-gray-400', icon: null }
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${s.cls}`}>
      {s.icon}{s.label}
    </span>
  )
}

const DEFAULT_FORM = {
  companyId: '',
  plan: 'monthly',
  amount: '250000',
  currency: 'XAF',
  paymentMethod: 'Airtel Money',
  paymentRef: '',
  phonePayment: '',
  months: '1',
}

export default function AdminSubscriptions() {
  const [subs, setSubs] = useState<Subscription[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [actioning, setActioning] = useState<number | null>(null)
  const [extendModal, setExtendModal] = useState<Subscription | null>(null)
  const [extendMonths, setExtendMonths] = useState(1)

  // Create modal
  const [createOpen, setCreateOpen] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [form, setForm] = useState(DEFAULT_FORM)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const loadSubs = useCallback(async (p = 1) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p) })
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    const res = await fetch(`/api/admin/subscriptions?${params}`)
    const data = await res.json()
    setSubs(data.subscriptions || [])
    setTotal(data.total || 0)
    setPages(data.pages || 1)
    setPage(p)
    setLoading(false)
  }, [search, statusFilter])

  useEffect(() => { loadSubs(1) }, [loadSubs])

  // Load companies when create modal opens
  useEffect(() => {
    if (createOpen && companies.length === 0) {
      fetch('/api/admin/companies').then(r => r.json()).then(d => {
        setCompanies(d.companies?.map((c: any) => ({ id: c.id, name: c.name })) || [])
      }).catch(() => {})
    }
  }, [createOpen])

  const doAction = async (id: number, action: string, extra?: object) => {
    setActioning(id)
    await fetch(`/api/admin/subscriptions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
    })
    setActioning(null)
    setExtendModal(null)
    loadSubs(page)
  }

  const handleCreate = async () => {
    setCreateError('')
    if (!form.companyId) { setCreateError('Sélectionnez une entreprise.'); return }
    setCreating(true)
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: parseInt(form.companyId),
          plan: form.plan,
          amount: parseFloat(form.amount),
          currency: form.currency,
          paymentMethod: form.paymentMethod,
          paymentRef: form.paymentRef || null,
          phonePayment: form.phonePayment || null,
          months: parseInt(form.months),
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setCreateError(d.error || 'Erreur lors de la création.')
      } else {
        setCreateOpen(false)
        setForm(DEFAULT_FORM)
        loadSubs(1)
      }
    } catch {
      setCreateError('Erreur réseau.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Abonnements</h1>
          <p className="text-gray-400 text-sm mt-1">{total} abonnement{total !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setCreateOpen(true); setCreateError('') }}
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Créer un abonnement
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher entreprise, réf. paiement, téléphone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadSubs(1)}
            className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500"
        >
          <option value="">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="pending">En attente</option>
          <option value="expired">Expiré</option>
        </select>
        <button
          onClick={() => loadSubs(1)}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          Rechercher
        </button>
      </div>

      {/* Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-gray-400 font-medium px-4 py-3">Entreprise</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3 hidden md:table-cell">Paiement</th>
                <th className="text-right text-gray-400 font-medium px-4 py-3">Montant</th>
                <th className="text-center text-gray-400 font-medium px-4 py-3">Statut</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3 hidden lg:table-cell">Expire</th>
                <th className="text-right text-gray-400 font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-500">Chargement...</td></tr>
              )}
              {!loading && subs.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-500">Aucun abonnement trouvé.</td></tr>
              )}
              {subs.map(s => (
                <tr key={s.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{s.company.name}</p>
                        <p className="text-xs text-gray-500">{s.plan} · {formatDate(s.createdAt)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-gray-300">{s.paymentMethod}</p>
                    {s.phonePayment && <p className="text-xs text-gray-500">{s.phonePayment}</p>}
                    {s.paymentRef && <p className="text-xs text-gray-500 font-mono">{s.paymentRef}</p>}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-white">{formatFCFA(s.amount)}</td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">{formatDate(s.expiresAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {s.status === 'pending' && (
                        <button
                          onClick={() => doAction(s.id, 'activate')}
                          disabled={actioning === s.id}
                          className="text-xs text-green-400 hover:text-green-300 bg-green-500/10 hover:bg-green-500/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Activer
                        </button>
                      )}
                      {s.status === 'active' && (
                        <>
                          <button
                            onClick={() => { setExtendModal(s); setExtendMonths(1) }}
                            className="text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" /> Prolonger
                          </button>
                          <button
                            onClick={() => confirm('Révoquer cet abonnement ?') && doAction(s.id, 'revoke')}
                            disabled={actioning === s.id}
                            className="text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            Révoquer
                          </button>
                        </>
                      )}
                      {s.status === 'expired' && (
                        <button
                          onClick={() => doAction(s.id, 'activate')}
                          disabled={actioning === s.id}
                          className="text-xs text-green-400 hover:text-green-300 bg-green-500/10 hover:bg-green-500/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Réactiver
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700">
            <p className="text-xs text-gray-500">Page {page} sur {pages}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => loadSubs(page - 1)} disabled={page <= 1}
                className="p-1.5 rounded-lg bg-gray-700 text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => loadSubs(page + 1)} disabled={page >= pages}
                className="p-1.5 rounded-lg bg-gray-700 text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Extend modal ── */}
      {extendModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-white mb-1">Prolonger l&apos;abonnement</h2>
            <p className="text-sm text-gray-400 mb-5">{extendModal.company.name}</p>
            <div className="mb-5">
              <label className="block text-sm text-gray-300 mb-2">Nombre de mois supplémentaires</label>
              <input
                type="number" min={1} max={24} value={extendMonths}
                onChange={e => setExtendMonths(parseInt(e.target.value) || 1)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setExtendModal(null)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gray-800 text-gray-300 hover:text-white text-sm font-medium transition-colors">
                Annuler
              </button>
              <button onClick={() => doAction(extendModal.id, 'extend', { months: extendMonths })}
                className="flex-1 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors">
                Prolonger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create modal ── */}
      {createOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-white">Créer un abonnement</h2>
                <p className="text-xs text-gray-400 mt-0.5">Activer immédiatement pour une entreprise</p>
              </div>
              <button onClick={() => setCreateOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Company */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Entreprise *</label>
                <select
                  value={form.companyId}
                  onChange={e => setForm(f => ({ ...f, companyId: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500"
                >
                  <option value="">— Sélectionner —</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Plan + Months row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Plan</label>
                  <select
                    value={form.plan}
                    onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500"
                  >
                    <option value="monthly">Mensuel</option>
                    <option value="starter">Starter</option>
                    <option value="standard">Standard</option>
                    <option value="professional">Professionnel</option>
                    <option value="enterprise">Entreprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Durée (mois)</label>
                  <input
                    type="number" min={1} max={36} value={form.months}
                    onChange={e => setForm(f => ({ ...f, months: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Amount + Currency row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Montant (FCFA) *</label>
                  <input
                    type="number" value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Mode de paiement</label>
                  <select
                    value={form.paymentMethod}
                    onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500"
                  >
                    <option>Airtel Money</option>
                    <option>Mobile Money</option>
                    <option>Virement bancaire</option>
                    <option>Espèces</option>
                  </select>
                </div>
              </div>

              {/* Phone + Ref row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Téléphone paiement</label>
                  <input
                    type="tel" value={form.phonePayment} placeholder="+241 77..."
                    onChange={e => setForm(f => ({ ...f, phonePayment: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Référence paiement</label>
                  <input
                    type="text" value={form.paymentRef} placeholder="TXN-..."
                    onChange={e => setForm(f => ({ ...f, paymentRef: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl px-4 py-3 text-sm text-brand-300 flex items-center justify-between">
                <span>Abonnement activé immédiatement</span>
                <span className="font-bold text-white">
                  {parseFloat(form.amount || '0').toLocaleString('fr-FR')} FCFA
                </span>
              </div>

              {createError && (
                <p className="text-red-400 text-xs">{createError}</p>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setCreateOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-800 text-gray-300 hover:text-white text-sm font-medium transition-colors">
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {creating ? 'Création...' : <><Plus className="w-4 h-4" /> Créer & Activer</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
