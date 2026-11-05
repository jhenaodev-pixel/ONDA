import { useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import {
  ApiError,
  bankApi,
  emptyPortfolio,
  investmentApi,
  marketApi,
  type Account,
  type AccountType,
  type AssetQuote,
  type AuthResponse,
  type BankTransaction,
  type MoneyOperationRequest,
  type Portfolio,
  type Session,
  type Trade,
  type TradeRequest,
  type TransferRequest,
} from './lib/api'
import { FEATURED_STOCKS, assetMeta } from './lib/assets'
import { firstName, formatMoney } from './lib/formatters'
import { AppContext, type AppState } from './state/AppContext'
import AuthScreen from './components/AuthScreen'
import Layout from './components/Layout'
import OverviewPage from './pages/OverviewPage'
import OperationsPage from './pages/OperationsPage'
import InvestmentsPage from './pages/InvestmentsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import './styles.css'

const SESSION_KEY = 'onda.session'

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Session
    return parsed.token && parsed.email ? parsed : null
  } catch {
    return null
  }
}

function isUnauthorized(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403)
}

export default function App() {
  const [session, setSession] = useState<Session | null>(readSession)
  const [authMessage, setAuthMessage] = useState('')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [portfolio, setPortfolio] = useState<Portfolio>(emptyPortfolio)
  const [trades, setTrades] = useState<Trade[]>([])
  const [cryptoQuotes, setCryptoQuotes] = useState<AssetQuote[]>([])
  const [stockQuotes, setStockQuotes] = useState<AssetQuote[]>([])
  const [stockMessage, setStockMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const logout = useCallback((message = '') => {
    localStorage.removeItem(SESSION_KEY)
    setSession(null)
    setAccounts([])
    setTransactions([])
    setPortfolio(emptyPortfolio)
    setTrades([])
    setCryptoQuotes([])
    setStockQuotes([])
    setStockMessage('')
    setError('')
    setAuthMessage(message)
  }, [])

  const refresh = useCallback(() => {
    setRefreshKey((value) => value + 1)
  }, [])

  const showNotice = useCallback((message: string) => {
    setNotice(message)
  }, [])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 4200)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    if (!session) return

    let active = true
    const token = session.token
    setLoading(true)
    setError('')

    async function load() {
      try {
        const nextAccounts = await bankApi.getAccounts(token)
        if (!active) return
        setAccounts(nextAccounts)

        const [nextPortfolio, nextCryptos, nextTrades, histories] = await Promise.all([
          investmentApi.getPortfolio(token).catch((reason: unknown) => {
            if (isUnauthorized(reason)) throw reason
            return emptyPortfolio
          }),
          marketApi.getCryptos().catch(() => [] as AssetQuote[]),
          investmentApi.getHistory(token).catch(() => [] as Trade[]),
          Promise.all(
            nextAccounts.map((account) =>
              bankApi.getTransactions(account.accountNumber, token).catch(() => [] as BankTransaction[]),
            ),
          ),
        ])

        if (!active) return

        const merged = new Map<number, BankTransaction>()
        histories.flat().forEach((transaction) => merged.set(transaction.id, transaction))

        setPortfolio(nextPortfolio)
        setCryptoQuotes(nextCryptos)
        setTrades(nextTrades)
        setTransactions(
          Array.from(merged.values()).sort((left, right) =>
            right.timestamp.localeCompare(left.timestamp),
          ),
        )

        const stockResults = await Promise.allSettled(
          FEATURED_STOCKS.map((symbol) => marketApi.getStockQuote(symbol)),
        )
        if (!active) return

        const quotes = stockResults
          .filter((result): result is PromiseFulfilledResult<AssetQuote> => result.status === 'fulfilled')
          .map((result) => result.value)

        setStockQuotes(quotes)
        if (quotes.length === 0) {
          const firstFailure = stockResults.find(
            (result): result is PromiseRejectedResult => result.status === 'rejected',
          )
          setStockMessage(
            firstFailure?.reason instanceof Error
              ? firstFailure.reason.message
              : 'No se pudieron consultar acciones en este momento.',
          )
        } else {
          setStockMessage('')
        }

        setLastUpdated(new Date())
      } catch (loadError) {
        if (!active) return
        if (isUnauthorized(loadError)) {
          logout('Tu sesión venció. Inicia sesión nuevamente.')
        } else {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No se pudo cargar la información de tu cuenta.',
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [session, refreshKey, logout])

  function startSession(auth: AuthResponse, displayName: string) {
    const next: Session = { ...auth, displayName }
    localStorage.setItem(SESSION_KEY, JSON.stringify(next))
    setSession(next)
    setAuthMessage('')
  }

  async function authenticate(mode: 'login' | 'register', values: Record<string, string>) {
    const email = values.email.trim().toLowerCase()

    if (mode === 'login') {
      const auth = await bankApi.login(email, values.password)
      startSession(auth, firstName(email))
      setNotice('Sesión iniciada. Bienvenido a ONDA.')
      return
    }

    const auth = await bankApi.register({
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email,
      password: values.password,
    })
    const displayName = `${values.firstName.trim()} ${values.lastName.trim()}`.trim()
    startSession(auth, displayName || firstName(email))
    setNotice('Tu cuenta ONDA está lista. Abrimos tu primera cuenta con $1,000.')
  }

  async function transfer(values: TransferRequest) {
    if (!session) throw new Error('Sesión no disponible.')
    const transaction = await bankApi.transfer(values, session.token)
    showNotice(`Transferencia de ${formatMoney(values.amount)} completada.`)
    refresh()
    return transaction
  }

  async function deposit(values: MoneyOperationRequest) {
    if (!session) throw new Error('Sesión no disponible.')
    const transaction = await bankApi.deposit(values, session.token)
    showNotice(`Depósito de ${formatMoney(values.amount)} acreditado.`)
    refresh()
    return transaction
  }

  async function withdraw(values: MoneyOperationRequest) {
    if (!session) throw new Error('Sesión no disponible.')
    const transaction = await bankApi.withdraw(values, session.token)
    showNotice(`Retiro de ${formatMoney(values.amount)} realizado.`)
    refresh()
    return transaction
  }

  async function buy(values: TradeRequest) {
    if (!session) throw new Error('Sesión no disponible.')
    const trade = await investmentApi.buy(values, session.token)
    showNotice(`Compraste ${assetMeta(trade.symbol, trade.assetType).name} por ${formatMoney(trade.totalAmount)}.`)
    refresh()
    return trade
  }

  async function sell(values: TradeRequest) {
    if (!session) throw new Error('Sesión no disponible.')
    const trade = await investmentApi.sell(values, session.token)
    showNotice(`Vendiste ${assetMeta(trade.symbol, trade.assetType).name} por ${formatMoney(trade.totalAmount)}.`)
    refresh()
    return trade
  }

  async function createAccount(type: AccountType) {
    if (!session) throw new Error('Sesión no disponible.')
    const account = await bankApi.createAccount(type, session.token)
    showNotice('Cuenta creada correctamente.')
    refresh()
    return account
  }

  if (!session) {
    return <AuthScreen onAuthenticate={authenticate} message={authMessage} />
  }

  const value: AppState = {
    session,
    accounts,
    transactions,
    portfolio,
    trades,
    cryptoQuotes,
    stockQuotes,
    loading,
    stocksEnabled: stockQuotes.length > 0,
    stockMessage,
    error,
    notice,
    lastUpdated,
    refresh,
    clearNotice: () => setNotice(''),
    showNotice,
    logout: () => logout(),
    transfer,
    deposit,
    withdraw,
    buy,
    sell,
    createAccount,
  }

  return (
    <AppContext.Provider value={value}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<OverviewPage />} />
          <Route path="/operaciones" element={<OperationsPage />} />
          <Route path="/inversiones" element={<InvestmentsPage />} />
          <Route path="/analiticas" element={<AnalyticsPage />} />
        </Route>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppContext.Provider>
  )
}
