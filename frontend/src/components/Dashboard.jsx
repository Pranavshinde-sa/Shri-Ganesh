import { useEffect, useState } from 'react'
import { getDashboard } from '../api.js'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getDashboard()
      .then((data) => { if (!cancelled) { setSummary(data); setError('') } })
      .catch(() => { if (!cancelled) setError('Could not reach the backend. Is the FastAPI server running on port 8000?') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return <div className="text-slate-400 text-sm py-12 text-center">Loading…</div>
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm p-4">
        {error}
      </div>
    )
  }

  if (!summary) return null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-brand text-white p-6">
          <p className="text-xs uppercase tracking-wide text-white/70 mb-1">Total received</p>
          <p className="text-3xl font-bold">{fmt(summary.total_received)}</p>
        </div>
        <div className="rounded-xl bg-brand-dark text-white p-6">
          <p className="text-xs uppercase tracking-wide text-white/70 mb-1">Total expenses</p>
          <p className="text-3xl font-bold">{fmt(summary.total_expenses)}</p>
        </div>
        <div className="rounded-xl bg-slate-800 text-white p-6">
          <p className="text-xs uppercase tracking-wide text-white/70 mb-1">Total left (cash + online)</p>
          <p className="text-3xl font-bold">{fmt(summary.total_balance)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl bg-white border border-cash-border p-6">
          <h3 className="font-semibold text-cash mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cash inline-block" />
            Cash portfolio
          </h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Received to date</dt><dd className="font-medium">{fmt(summary.cash_received)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Spent</dt><dd className="font-medium">{fmt(summary.cash_expenses)}</dd></div>
            <div className="flex justify-between pt-2 border-t border-cash-border"><dt className="text-slate-600 font-medium">Balance left</dt><dd className="font-bold text-cash">{fmt(summary.cash_balance)}</dd></div>
          </dl>
        </div>

        <div className="rounded-xl bg-white border border-online-border p-6">
          <h3 className="font-semibold text-online mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-online inline-block" />
            Online portfolio
          </h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Received to date</dt><dd className="font-medium">{fmt(summary.online_received)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Spent</dt><dd className="font-medium">{fmt(summary.online_expenses)}</dd></div>
            <div className="flex justify-between pt-2 border-t border-online-border"><dt className="text-slate-600 font-medium">Balance left</dt><dd className="font-bold text-online">{fmt(summary.online_balance)}</dd></div>
          </dl>
        </div>
      </div>
    </div>
  )
}
