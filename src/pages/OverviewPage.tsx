import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  PieChart,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useApp } from '../state/AppContext'
import { AreaChart, Donut } from '../components/charts'
import MoneyDialog, { type MoneyMode } from '../components/MoneyDialog'
import TransactionRow from '../components/TransactionRow'
import { cumulativeFlow } from '../lib/analytics'
import { assetMeta } from '../lib/assets'
import {
  accountLabel,
  dayGreeting,
  firstName,
  formatCryptoPrice,
  formatMoney,
  formatPercent,
  maskAccount,
} from '../lib/formatters'

const ALLOCATION_COLORS = ['#5b45f5', '#18b98c', '#2f9df4', '#f2568f', '#f5a623', '#8b5cf6']

export default function OverviewPage() {
  const {
    session,
    accounts,
    transactions,
    portfolio,
    cryptoQuotes,
    deposit,
    withdraw,
    transfer,
    createAccount,
    showNotice,
  } = useApp()
  const [moneyMode, setMoneyMode] = useState<MoneyMode | null>(null)
  const [creating, setCreating] = useState(false)

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)
  const portfolioValue = portfolio.totalCurrentValue
  const netWorth = totalBalance + portfolioValue
  const profit = portfolio.totalProfitLoss

  const flow = useMemo(() => cumulativeFlow(transactions, accounts), [transactions, accounts])
  const chartValues = transactions.length > 0 ? flow : []

  const allocation = portfolio.positions.length > 0
    ? portfolio.positions.slice(0, 6).map((position, index) => ({
        label: assetMeta(position.symbol, position.assetType).name,
        value: position.currentValue ?? position.investedAmount,
        color: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length],
      }))
    : []

  const recent = transactions.slice(0, 6)
  const topCrypto = cryptoQuotes.slice(0, 4)

  async function addAccount() {
    setCreating(true)
    try {
      await createAccount('SAVINGS')
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'No se pudo crear la cuenta.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="page overview-page">
      <section className="hero-balance">
        <div className="hero-balance-copy">
          <span className="eyebrow eyebrow-pill">
            <span className="status-dot" /> {dayGreeting()}, {firstName(session.displayName)}
          </span>
          <h1>
            Tu patrimonio,<br />
            <span className="gradient-text">en perfecta armonía</span>
          </h1>
          <p>
            {accounts.length} {accounts.length === 1 ? 'cuenta activa' : 'cuentas activas'} · saldo disponible ·
            portafolio multiactivo.
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => setMoneyMode('deposit')}>
              <ArrowDownLeft size={17} /> Depositar
            </button>
            <button className="ghost-button" onClick={() => setMoneyMode('transfer')}>
              <ArrowLeftRight size={17} /> Transferir
            </button>
            <button className="ghost-button" onClick={() => setMoneyMode('withdraw')}>
              <ArrowUpRight size={17} /> Retirar
            </button>
          </div>
        </div>

        <div className="hero-balance-figure">
          <span className="figure-label">Patrimonio consolidado</span>
          <strong className="figure-value">{formatMoney(netWorth)}</strong>
          <span className={`figure-delta ${profit >= 0 ? 'positive' : 'negative'}`}>
            <TrendingUp size={15} />
            {profit >= 0 ? '+' : ''}{formatMoney(profit)} en inversiones
          </span>
          <div className="figure-chart">
            <AreaChart values={chartValues} height={120} tone="violet" label="Evolución del patrimonio" />
          </div>
          <div className="figure-legend">
            <span><i className="legend-dot legend-violet" /> Flujo neto acumulado</span>
          </div>
        </div>
      </section>

      <section className="kpi-grid">
        <article className="kpi-card">
          <span className="kpi-icon kpi-violet"><Wallet size={18} /></span>
          <div>
            <small>Saldo disponible</small>
            <strong>{formatMoney(totalBalance)}</strong>
            <span className="kpi-foot">{accounts.length} {accounts.length === 1 ? 'cuenta' : 'cuentas'}</span>
          </div>
        </article>
        <article className="kpi-card">
          <span className="kpi-icon kpi-mint"><PieChart size={18} /></span>
          <div>
            <small>Valor del portafolio</small>
            <strong>{formatMoney(portfolioValue)}</strong>
            <span className="kpi-foot">{portfolio.positions.length} {portfolio.positions.length === 1 ? 'posición' : 'posiciones'}</span>
          </div>
        </article>
        <article className="kpi-card">
          <span className="kpi-icon kpi-sky"><Sparkles size={18} /></span>
          <div>
            <small>Capital invertido</small>
            <strong>{formatMoney(portfolio.totalInvested)}</strong>
            <span className="kpi-foot">Cripto + acciones</span>
          </div>
        </article>
        <article className="kpi-card">
          <span className={`kpi-icon ${profit >= 0 ? 'kpi-mint' : 'kpi-rose'}`}><TrendingUp size={18} /></span>
          <div>
            <small>Rendimiento</small>
            <strong className={profit >= 0 ? 'positive' : 'negative'}>
              {profit >= 0 ? '+' : ''}{formatMoney(profit)}
            </strong>
            <span className="kpi-foot">{formatPercent(portfolio.totalProfitLossPercent)}</span>
          </div>
        </article>
      </section>

      <section className="overview-grid">
        <article className="panel panel-chart">
          <div className="panel-head">
            <div>
              <span className="eyebrow">FLUJO DE CAJA</span>
              <h2>Actividad consolidada</h2>
            </div>
            <span className="soft-chip">{transactions.length} movimientos</span>
          </div>
          <AreaChart values={chartValues} height={200} tone="violet" />
          <div className="chart-foot">
            <span>Entradas y salidas netas de tus cuentas ONDA</span>
            <Link className="text-link" to="/operaciones">
              Ver movimientos <ArrowRight size={14} />
            </Link>
          </div>
        </article>

        <article className="panel panel-allocation">
          <div className="panel-head">
            <div>
              <span className="eyebrow">DISTRIBUCIÓN</span>
              <h2>Asignación del portafolio</h2>
            </div>
          </div>
          {allocation.length > 0 ? (
            <div className="allocation-body">
              <Donut
                segments={allocation}
                centerValue={formatMoney(portfolioValue)}
                centerLabel="Valor actual"
                size={170}
              />
              <ul className="allocation-legend">
                {allocation.map((segment) => (
                  <li key={segment.label}>
                    <i style={{ background: segment.color }} />
                    <span>{segment.label}</span>
                    <strong>{portfolioValue > 0 ? `${((segment.value / portfolioValue) * 100).toFixed(1)}%` : '—'}</strong>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="empty-state">
              <PieChart size={26} />
              <p>Aún no tienes activos. Tu portafolio aparecerá aquí.</p>
              <Link className="primary-button" to="/inversiones">Explorar inversiones</Link>
            </div>
          )}
        </article>
      </section>

      <section className="overview-grid">
        <article className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">PRODUCTOS</span>
              <h2>Tus cuentas</h2>
            </div>
            <button className="ghost-button small" onClick={addAccount} disabled={creating}>
              {creating ? 'Creando…' : 'Nueva cuenta'}
            </button>
          </div>
          <div className="account-list">
            {accounts.map((account) => (
              <div className="account-card" key={account.id}>
                <div className="account-card-top">
                  <span className="account-type">{accountLabel(account.accountType)}</span>
                  <span className="account-mask">{maskAccount(account.accountNumber)}</span>
                </div>
                <strong className="account-balance">{formatMoney(account.balance)}</strong>
                <div className="account-card-foot">
                  <span>ONDA · disponible</span>
                  <button className="text-link" onClick={() => setMoneyMode('deposit')}>Depositar</button>
                </div>
              </div>
            ))}
            {accounts.length === 0 && (
              <div className="empty-state">
                <Wallet size={26} />
                <p>Abre tu primera cuenta para comenzar.</p>
                <button className="primary-button" onClick={addAccount} disabled={creating}>
                  Abrir cuenta
                </button>
              </div>
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">ACTIVIDAD RECIENTE</span>
              <h2>Últimos movimientos</h2>
            </div>
            <Link className="text-link" to="/operaciones">Ver todos</Link>
          </div>
          <div className="transaction-list">
            {recent.length > 0 ? (
              recent.map((transaction) => (
                <TransactionRow key={transaction.id} transaction={transaction} accounts={accounts} />
              ))
            ) : (
              <div className="empty-state">
                <ArrowLeftRight size={26} />
                <p>Aún no hay movimientos registrados.</p>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="panel market-strip">
        <div className="panel-head">
          <div>
            <span className="eyebrow">MERCADO EN VIVO</span>
            <h2>Criptomonedas destacadas</h2>
          </div>
          <Link className="text-link" to="/inversiones">Ir a inversiones <ArrowRight size={14} /></Link>
        </div>
        <div className="market-mini-grid">
          {topCrypto.map((quote) => {
            const meta = assetMeta(quote.symbol, 'CRYPTO')
            const delta = quote.changePercent ?? 0
            return (
              <div className="market-mini" key={quote.symbol}>
                <span className={`asset-glyph asset-glyph-${meta.tone}`}>{meta.glyph}</span>
                <div className="market-mini-copy">
                  <strong>{meta.name}</strong>
                  <small>{formatCryptoPrice(quote.price)} USDT</small>
                </div>
                <span className={delta >= 0 ? 'positive' : 'negative'}>{formatPercent(delta)}</span>
              </div>
            )
          })}
          {topCrypto.length === 0 && <div className="empty-state"><p>No hay cotizaciones disponibles.</p></div>}
        </div>
      </section>

      {moneyMode && (
        <MoneyDialog
          mode={moneyMode}
          accounts={accounts}
          onClose={() => setMoneyMode(null)}
          onDeposit={deposit}
          onWithdraw={withdraw}
          onTransfer={transfer}
        />
      )}
    </div>
  )
}
