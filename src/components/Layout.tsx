import { useEffect, useState, type FormEvent } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeftRight,
  BarChart3,
  Check,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  TrendingUp,
  X,
} from 'lucide-react'
import { useApp } from '../state/AppContext'
import { initials } from '../lib/formatters'
import { Brand } from './Brand'

const NAV_ITEMS = [
  { to: '/', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/operaciones', label: 'Operaciones', icon: ArrowLeftRight, end: false },
  { to: '/inversiones', label: 'Inversiones', icon: TrendingUp, end: false },
  { to: '/analiticas', label: 'Analíticas', icon: BarChart3, end: false },
]

const PAGE_NAMES: Record<string, string> = {
  '/': 'Resumen',
  '/operaciones': 'Operaciones',
  '/inversiones': 'Inversiones',
  '/analiticas': 'Analíticas',
}

export default function Layout() {
  const {
    session,
    notice,
    error,
    loading,
    refresh,
    clearNotice,
    logout,
    lastUpdated,
  } = useApp()
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = query.trim()
    if (!value) return
    navigate(`/inversiones?q=${encodeURIComponent(value)}`)
    setQuery('')
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`}>
        <div className="sidebar-head">
          <Brand />
          <button
            className="icon-button sidebar-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="side-nav" aria-label="Navegación principal">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-spacer" />

        <div className="side-status" title={session.email}>
          <span className="status-dot" />
          <div>
            <small>SESIÓN ACTIVA</small>
            <strong>{session.email}</strong>
          </div>
        </div>

        <div className="sidebar-bottom">
          <button className="side-link side-link-danger" onClick={logout}>
            <LogOut size={18} />
            Salir
          </button>
        </div>

        <span className="sidebar-version">ONDA · Banca digital</span>
      </aside>

      {menuOpen && <button className="sidebar-overlay" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú" />}

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Abrir menú">
            <Menu size={20} />
          </button>

          <form className="global-search" onSubmit={search}>
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar acciones por símbolo (ej. AAPL)"
              aria-label="Buscar acciones por símbolo"
            />
          </form>

          <div className="topbar-actions">
            <div className="profile" title={session.email}>
              <span className="avatar">{initials(session.displayName)}</span>
              <span className="profile-copy">
                <strong>{session.displayName}</strong>
                <small>{session.email}</small>
              </span>
            </div>
            <button className="icon-button" onClick={logout} aria-label="Cerrar sesión" title="Cerrar sesión">
              <LogOut size={17} />
            </button>
          </div>
        </header>

        <div className="content-wrap">
          <div className="page-meta">
            <span className="page-meta-name">{PAGE_NAMES[location.pathname] ?? 'ONDA'}</span>
            <span className="page-meta-status">
              {loading ? (
                <>
                  <RefreshCw size={13} className="spin" /> Sincronizando
                </>
              ) : (
                <>
                  <span className="status-dot" />
                  {lastUpdated
                    ? `Actualizado ${lastUpdated.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`
                    : 'Sin actualizar'}
                </>
              )}
            </span>
          </div>

          {error && (
            <div className="alert alert-error" role="alert">
              <span>{error}</span>
              <button onClick={refresh}>
                <RefreshCw size={14} /> Reintentar
              </button>
            </div>
          )}

          <Outlet />

          <footer className="app-footer">
            <span>ONDA · Cuentas, operaciones e inversiones</span>
            <span>Cuentas en USD · Cripto en USDT · Acciones en USD</span>
          </footer>
        </div>
      </main>

      {notice && (
        <div className="toast" role="status">
          <span className="toast-icon"><Check size={14} /></span>
          <span>{notice}</span>
          <button onClick={clearNotice} aria-label="Cerrar aviso">
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  )
}
