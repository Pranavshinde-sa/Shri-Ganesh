import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function LoginPanel({ onClose }) {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(username, password)
      onClose()
    } catch {
      setError('Incorrect username or password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="absolute right-6 top-20 z-10 w-72 bg-white rounded-xl border border-slate-200 shadow-lg p-5">
      <h3 className="font-semibold text-slate-800 mb-3 text-sm">Admin login</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          autoFocus
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-slate-700 px-3"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
