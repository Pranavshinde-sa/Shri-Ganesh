import { useEffect, useState } from 'react'
import { getExpenses, addExpense, deleteExpense, exportExpensesPdf } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtDate = (d) => { try { return new Date(d).toLocaleDateString('en-IN') } catch { return '—' } }

export default function Expenses() {
  const { isAdmin } = useAuth()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState('cash')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    getExpenses()
      .then((data) => { setExpenses(Array.isArray(data) ? data : []); setLoadError('') })
      .catch(() => setLoadError('Could not load expenses. Is the backend running?'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!name.trim() || !amount || Number(amount) <= 0) {
      setFormError('Enter an expense name and an amount greater than 0.')
      return
    }
    setSubmitting(true)
    try {
      await addExpense({ name: name.trim(), amount: Number(amount), mode })
      setName('')
      setAmount('')
      load()
    } catch (err) {
      setFormError(err?.response?.data?.detail || 'Could not add expense.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteExpense(id)
      load()
    } catch {
      setLoadError('Could not delete that expense.')
    }
  }

  const handleExport = async () => {
    try {
      const res = await exportExpensesPdf()
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.download = 'expenses.pdf'
      link.click()
      window.URL.revokeObjectURL(url)
    } catch {
      setLoadError('Could not export the PDF.')
    }
  }

  return (
    <div className="space-y-6">
      {isAdmin && (
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-800 mb-4">Add an expense</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Expense name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Printing, transport"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Amount (₹)</label>
            <input
              type="number" min="0" step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="500"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Deduct from</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('cash')}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  mode === 'cash' ? 'bg-cash-soft border-cash text-cash' : 'border-slate-300 text-slate-500 hover:bg-slate-50'
                }`}
              >Cash</button>
              <button
                type="button"
                onClick={() => setMode('online')}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  mode === 'online' ? 'bg-online-soft border-online text-online' : 'border-slate-300 text-slate-500 hover:bg-slate-50'
                }`}
              >Online</button>
            </div>
          </div>
        </div>
        {formError && <p className="text-sm text-red-600 mt-3">{formError}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-4 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          {submitting ? 'Adding…' : 'Add expense'}
        </button>
      </form>
      )}

      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-800">Expense history</h2>
        <button
          onClick={handleExport}
          className="text-sm font-semibold border border-brand text-brand hover:bg-brand hover:text-white px-4 py-2 rounded-lg transition-colors"
        >
          Export PDF
        </button>
      </div>

      {loadError && <p className="text-sm text-red-600">{loadError}</p>}

      {loading ? (
        <div className="text-slate-400 text-sm py-8 text-center">Loading…</div>
      ) : expenses.length === 0 ? (
        <div className="text-slate-400 text-sm py-12 text-center bg-white rounded-xl border border-slate-200">
          No expenses recorded yet.
        </div>
      ) : (
	<div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
	  <table className="w-full sm:min-w-0 min-w-[500px] text-sm">       
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                <th className="px-3 sm:px-5 py-3 font-medium">Expense</th>
                <th className="px-3 sm:px-5 py-3 font-medium">Amount</th>
                <th className="px-3 sm:px-5 py-3 font-medium">Deducted from</th>
                <th className="px-3 sm:px-5 py-3 ont-medium">Date</th>
                {isAdmin && <th className="px-5 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {expenses.map((ex) => (
                <tr key={ex.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 sm:px-5 py-3">{ex.name}</td>
                  <td className="px-3 sm:px-5 py-3 font-semibold tabular-nums">{fmt(ex.amount)}</td>
                  <td className="px-3 sm:px-5 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      ex.mode === 'cash' ? 'bg-cash-soft text-cash' : 'bg-online-soft text-online'
                    }`}>{ex.mode}</span>
                  </td>
                  <td className="px-3 sm:px-5 py-3 text-slate-500">{fmtDate(ex.created_at)}</td>
                  {isAdmin && (
                    <td className="px-3 sm:px-5 py-3 text-right">
                      <button onClick={() => handleDelete(ex.id)} className="text-xs text-slate-400 hover:text-red-600 underline">Remove</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
