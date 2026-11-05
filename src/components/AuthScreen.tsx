import { useState, type FormEvent } from 'react'
import {
  ArrowLeftRight,
  ArrowRight,
  BarChart3,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  Mail,
  TrendingUp,
  User,
  Wallet,
} from 'lucide-react'
import { Brand } from './Brand'

type Mode = 'login' | 'register'

interface AuthScreenProps {
  onAuthenticate: (mode: Mode, values: Record<string, string>) => Promise<void>
  message: string
}

const FEATURES = [
  { icon: Wallet, title: 'Cuentas en USD', copy: 'Ahorro y corriente con saldo disponible.' },
  { icon: ArrowLeftRight, title: 'Operaciones', copy: 'Depósitos, retiros y transferencias.' },
  { icon: TrendingUp, title: 'Inversiones', copy: 'Criptomonedas y acciones con precios de mercado.' },
  { icon: BarChart3, title: 'Analíticas', copy: 'Flujos y resultados calculados con tus movimientos.' },
]

function passwordScore(value: string) {
  let score = 0
  if (value.length >= 8) score += 1
  if (/[A-Z]/.test(value)) score += 1
  if (/[0-9]/.test(value)) score += 1
  if (/[^A-Za-z0-9]/.test(value)) score += 1
  return score
}

export default function AuthScreen({ onAuthenticate, message }: AuthScreenProps) {
  const [mode, setMode] = useState<Mode>('register')
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')

  const score = passwordScore(password)
  const strength = score <= 1 ? 'Baja' : score === 2 ? 'Media' : score === 3 ? 'Buena' : 'Alta'

  function changeMode(next: Mode) {
    setMode(next)
    setFormError('')
    setPassword('')
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>

    if (mode === 'register' && values.password.length < 8) {
      setFormError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    setBusy(true)
    setFormError('')
    try {
      await onAuthenticate(mode, values)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'No fue posible completar la solicitud.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-page">
      <header className="auth-topbar">
        <Brand />
        <div className="auth-topbar-action">
          <span>{mode === 'register' ? '¿Ya tienes cuenta?' : '¿Aún no tienes cuenta?'}</span>
          <button onClick={() => changeMode(mode === 'register' ? 'login' : 'register')}>
            {mode === 'register' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        </div>
      </header>

      <section className="auth-content">
        <div className="auth-hero">
          <span className="eyebrow eyebrow-pill">
            <span className="status-dot" /> CUENTA DIGITAL ONDA
          </span>
          <h1>
            Abre tu cuenta
            <br />
            <span className="gradient-text">y opera desde hoy</span>
          </h1>
          <p className="auth-lead">
            Gestiona tus cuentas en dólares, mueve fondos e invierte en criptomonedas
            y acciones desde un solo lugar.
          </p>

          <ul className="auth-features">
            {FEATURES.map(({ icon: Icon, title, copy }) => (
              <li className="auth-feature" key={title}>
                <span className="auth-feature-icon"><Icon size={18} /></span>
                <div>
                  <strong>{title}</strong>
                  <small>{copy}</small>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="auth-card">
          <div className="auth-card-head">
            <div>
              <h2>{mode === 'register' ? 'Crear cuenta' : 'Iniciar sesión'}</h2>
              <p>
                {mode === 'register'
                  ? 'Ingresa tus datos para abrir tu cuenta ONDA.'
                  : 'Accede a tus cuentas, movimientos e inversiones.'}
              </p>
            </div>
          </div>

          <form className="auth-form" onSubmit={submit}>
            {mode === 'register' && (
              <div className="field-row">
                <label className="field">
                  <span>Nombre</span>
                  <div className="input-shell">
                    <User size={17} />
                    <input name="firstName" autoComplete="given-name" required placeholder="Nombre" />
                  </div>
                </label>
                <label className="field">
                  <span>Apellido</span>
                  <div className="input-shell">
                    <User size={17} />
                    <input name="lastName" autoComplete="family-name" required placeholder="Apellido" />
                  </div>
                </label>
              </div>
            )}

            <label className="field">
              <span>Correo electrónico</span>
              <div className="input-shell">
                <Mail size={17} />
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="tu@correo.com"
                />
              </div>
            </label>

            <label className="field">
              <span>
                {mode === 'register' ? 'Crear contraseña' : 'Contraseña'}
                {mode === 'register' && <small className="field-hint">Mín. 8 caracteres</small>}
              </span>
              <div className="input-shell">
                <Lock size={17} />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  minLength={mode === 'register' ? 8 : undefined}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={mode === 'register' ? '••••••••••••' : 'Tu contraseña'}
                />
                <button
                  type="button"
                  className="input-action"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>

            {mode === 'register' && (
              <div className={`password-meter score-${score}`}>
                <div className="password-bars">
                  {[1, 2, 3, 4].map((bar) => (
                    <span key={bar} className={bar <= score ? 'is-on' : ''} />
                  ))}
                </div>
                <small>Seguridad: {strength}</small>
              </div>
            )}

            {(formError || message) && (
              <div className="alert alert-error" role="alert">
                {formError || message}
              </div>
            )}

            <button className="primary-button auth-submit" type="submit" disabled={busy}>
              {busy ? (
                <LoaderCircle className="spin" size={19} />
              ) : (
                <>
                  {mode === 'register' ? 'Crear mi cuenta' : 'Entrar a mi cuenta'}
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <p className="auth-switch">
            {mode === 'register' ? '¿Ya tienes una cuenta?' : '¿Aún no tienes cuenta?'}{' '}
            <button onClick={() => changeMode(mode === 'register' ? 'login' : 'register')}>
              {mode === 'register' ? 'Inicia sesión' : 'Crea tu cuenta'}
            </button>
          </p>
        </div>
      </section>

      <footer className="auth-footer">
        <span>ONDA · Gestión de cuentas e inversiones</span>
      </footer>
    </main>
  )
}
