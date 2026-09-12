import { useEffect, useState } from 'react'
import { getDonations, addDonation, deleteDonation, exportDonationsPdf } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtDate = (d) => { try { return new Date(d).toLocaleDateString('en-IN') } catch { return '—' } }

export default function Donations() {
  const { isAdmin } = useAuth()
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [donorName, setDonorName] = useState('')
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState('cash')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    getDonations()
      .then((data) => { setDonations(Array.isArray(data) ? data : []); setLoadError('') })
      .catch(() => setLoadError('Could not load donations. Is the backend running?'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!donorName.trim() || !amount || Number(amount) <= 0) {
      setFormError('Enter a donor name and an amount greater than 0.')
      return
    }
    setSubmitting(true)
    try {
      await addDonation({ donor_name: donorName.trim(), amount: Number(amount), mode })
      setDonorName('')
      setAmount('')
      load()
    } catch (err) {
      setFormError(err?.response?.data?.detail || 'Could not add donation.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteDonation(id)
      load()
    } catch {
      setLoadError('Could not delete that donation.')
    }
  }

  const handleExport = async () => {
    try {
      const res = await exportDonationsPdf()
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.download = 'donations.pdf'
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
        <h2 className="font-semibold text-slate-800 mb-4">Add a donation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Donor name</label>
            <input
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="e.g. Ramesh Patil"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Amount (₹)</label>
            <input
              type="number" min="0" step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Mode</label>
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
          {submitting ? 'Adding…' : 'Add donation'}
        </button>
      </form>
      )}

      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-800">Donation history</h2>
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
      ) : donations.length === 0 ? (
        <div className="text-slate-400 text-sm py-12 text-center bg-white rounded-xl border border-slate-200">
          No donations recorded yet.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="min-w-[500px] sm:min-w-0 w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                <th className="px-3 sm:px-5 py-3 font-medium">Donor</th>
                <th className="px-3 sm:px-5 py-3 font-medium">Amount</th>
                <th className="px-3 sm:px-5 py-3 font-medium">Mode</th>
                <th className="px-3 sm:px-5 py-3 font-medium">Date</th>
                {isAdmin && <th className="px-5 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {donations.map((d) => (
                <tr key={d.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 sm:px-5 py-3">{d.donor_name}</td>
                  <td className="px-3 sm:px-5 py-3 font-semibold tabular-nums">{fmt(d.amount)}</td>
                  <td className="px-3 sm:px-5 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      d.mode === 'cash' ? 'bg-cash-soft text-cash' : 'bg-online-soft text-online'
                    }`}>{d.mode}</span>
                  </td>
                  <td className="px-3 sm:px-5 py-3 text-slate-500">{fmtDate(d.created_at)}</td>
                  {isAdmin && (
                    <td className="px-3 sm:px-5 py-3 text-right">
  		      <button onClick={() => handleDelete(d.id)} className="text-xs text-slate-400 hover:text-red-600 underline">Remove</button>
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
