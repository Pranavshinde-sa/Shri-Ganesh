import { useState } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import Dashboard from './components/Dashboard.jsx'
import Donations from './components/Donations.jsx'
import Expenses from './components/Expenses.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import LoginPanel from './components/LoginPanel.jsx'
import { useAuth } from './context/AuthContext.jsx'

const tabClass = ({ isActive }) =>
  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? 'bg-brand text-white shadow-sm'
      : 'text-slate-600 hover:bg-slate-100'
  }`

export default function App() {
  const location = useLocation()
  const { isAdmin, logout } = useAuth()
  const [showLogin, setShowLogin] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-8 relative">
        <header className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-brand-dark tracking-tight leading-snug">
              Jay Hanuman Ganeshutsav Mandal
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Ganeshanagar — donation & expense ledger
            </p>
          </div>

          <div className="flex items-center gap-3">
            <nav className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200">
              <NavLink to="/" end className={tabClass}>Dashboard</NavLink>
              <NavLink to="/donations" className={tabClass}>Donations</NavLink>
              <NavLink to="/expenses" className={tabClass}>Expenses</NavLink>
            </nav>

            {isAdmin ? (
              <button
                onClick={logout}
                className="text-sm font-medium text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 px-3 py-2 rounded-lg transition-colors"
              >
                Log out
              </button>
            ) : (
              <button
                onClick={() => setShowLogin((v) => !v)}
                className="text-sm font-medium text-brand border border-brand/40 hover:bg-brand hover:text-white px-3 py-2 rounded-lg transition-colors"
              >
                Admin login
              </button>
            )}
          </div>
        </header>

        {showLogin && !isAdmin && <LoginPanel onClose={() => setShowLogin(false)} />}

        {!isAdmin && (
          <div className="mb-6 text-xs text-slate-500 bg-slate-100 border border-slate-200 rounded-lg px-4 py-2">
            Viewing in read-only mode. Log in as admin to add or remove entries.
          </div>
        )}

        <ErrorBoundary key={location.pathname}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/donations" element={<Donations />} />
            <Route path="/expenses" element={<Expenses />} />
          </Routes>
        </ErrorBoundary>
      </div>
    </div>
  )
}
