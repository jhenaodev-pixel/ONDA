import { useMemo } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  PieChart,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useApp } from '../state/AppContext'
import { AreaChart, Bars, Donut } from '../components/charts'
import { countByType, monthlySummary } from '../lib/analytics'
import { assetMeta } from '../lib/assets'
import { formatMoney, formatPercent, formatQuantity } from '../lib/formatters'

const COLORS = ['#5b45f5', '#18b98c', '#2f9df4', '#f2568f', '#f5a623', '#8b5cf6']

const TYPE_LABELS: Record<string, string> = {
  DEPOSIT: 'Depósitos',
  WITHDRAWAL: 'Retiros',
  TRANSFER: 'Transferencias',
  INVESTMENT_BUY: 'Compras',
  INVESTMENT_SELL: 'Ventas',
}

export default function AnalyticsPage() {
  const { accounts, transactions, portfolio, trades } = useApp()

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)
  const months = useMemo(() => monthlySummary(transactions, accounts, 6), [transactions, accounts])
  const typeCounts = useMemo(() => countByType(transactions), [transactions])

  const allocation = portfolio.positions.slice(0, 6).map((position, index) => ({
    label: assetMeta(position.symbol, position.assetType).name,
    value: position.currentValue ?? position.investedAmount,
    color: COLORS[index % COLORS.length],
  }))

  const ranked = [...portfolio.positions].sort(
    (left, right) => (right.profitLossPercent ?? 0) - (left.profitLossPercent ?? 0),
  )
  const winners = portfolio.positions.filter((position) => (position.profitLoss ?? 0) > 0).length
  const winRate = portfolio.positions.length > 0 ? (winners / portfolio.positions.length) * 100 : 0
  const profit = portfolio.totalProfitLoss

  const netFlow = transactions.length > 0
    ? months.map((month) => month.inflow - month.outflow)
    : []
  const lastNetFlow = netFlow.length > 0 ? netFlow[netFlow.length - 1] : 0

  return (
    <div className="page analytics-page">
      <header className="page-head">
        <div>
          <span className="eyebrow">INTELIGENCIA</span>
          <h1>Analíticas</h1>
          <p>Entiende el comportamiento de tu patrimonio y el rendimiento de cada activo.</p>
        </div>
        <div className="page-head-actions">
          <span className="soft-chip"><BarChart3 size={13} /> Período: 6 meses</span>
        </div>
      </header>

      <section className="kpi-grid">
        <article className="kpi-card">
          <span className="kpi-icon kpi-violet"><Wallet size={18} /></span>
          <div>
            <small>Patrimonio total</small>
            <strong>{formatMoney(totalBalance + portfolio.totalCurrentValue)}</strong>
            <span className="kpi-foot">Efectivo + inversiones</span>
          </div>
        </article>
        <article className="kpi-card">
          <span className="kpi-icon kpi-sky"><PieChart size={18} /></span>
          <div>
            <small>Capital invertido</small>
            <strong>{formatMoney(portfolio.totalInvested)}</strong>
            <span className="kpi-foot">{portfolio.positions.length} {portfolio.positions.length === 1 ? 'posición activa' : 'posiciones activas'}</span>
          </div>
        </article>
        <article className="kpi-card">
          <span className={`kpi-icon ${profit >= 0 ? 'kpi-mint' : 'kpi-rose'}`}>
            {profit >= 0 ? <TrendingUp size={18} /> : <ArrowUpRight size={18} />}
          </span>
          <div>
            <small>Resultado no realizado</small>
            <strong className={profit >= 0 ? 'positive' : 'negative'}>
              {profit >= 0 ? '+' : ''}{formatMoney(profit)}
            </strong>
            <span className="kpi-foot">{formatPercent(portfolio.totalProfitLossPercent)}</span>
          </div>
        </article>
        <article className="kpi-card">
          <span className="kpi-icon kpi-amber"><Target size={18} /></span>
          <div>
            <small>Tasa de acierto</small>
            <strong>{winRate.toFixed(1)}%</strong>
            <span className="kpi-foot">{winners} de {portfolio.positions.length} en positivo</span>
          </div>
        </article>
      </section>

      <section className="overview-grid">
        <article className="panel panel-chart">
          <div className="panel-head">
            <div>
              <span className="eyebrow">FLUJOS</span>
              <h2>Flujo neto mensual</h2>
            </div>
            <span className="soft-chip">Últimos 6 meses</span>
          </div>
          <AreaChart values={netFlow} height={210} tone={lastNetFlow >= 0 ? 'mint' : 'rose'} />
          <div className="chart-foot">
            <span>Entradas menos salidas de tus cuentas por mes</span>
            <span className={lastNetFlow >= 0 ? 'positive' : 'negative'}>{formatMoney(lastNetFlow)}</span>
          </div>
        </article>

        <article className="panel panel-allocation">
          <div className="panel-head">
            <div>
              <span className="eyebrow">ASIGNACIÓN</span>
              <h2>Composición actual</h2>
            </div>
          </div>
          {allocation.length > 0 ? (
            <div className="allocation-body">
              <Donut
                segments={allocation}
                size={170}
                centerValue={formatMoney(portfolio.totalCurrentValue)}
                centerLabel="Valor actual"
              />
              <ul className="allocation-legend">
                {allocation.map((segment) => (
                  <li key={segment.label}>
                    <i style={{ background: segment.color }} />
                    <span>{segment.label}</span>
                    <strong>
                      {portfolio.totalCurrentValue > 0
                        ? `${((segment.value / portfolio.totalCurrentValue) * 100).toFixed(1)}%`
                        : '—'}
                    </strong>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="empty-state"><p>Sin posiciones para analizar.</p></div>
          )}
        </article>
      </section>

      <section className="overview-grid">
        <article className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">FLUJOS</span>
              <h2>Entradas y salidas</h2>
            </div>
            <span className="soft-chip"><ArrowDownLeft size={13} /> últimos 6 meses</span>
          </div>
          <div className="flows-grid">
            <div>
              <span className="flow-label positive">Entradas</span>
              <Bars values={months.map((month) => ({ label: month.label, value: month.inflow }))} tone="mint" />
            </div>
            <div>
              <span className="flow-label negative">Salidas</span>
              <Bars values={months.map((month) => ({ label: month.label, value: month.outflow }))} tone="violet" />
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">ACTIVIDAD</span>
              <h2>Distribución operativa</h2>
            </div>
          </div>
          <div className="type-list">
            {Object.keys(TYPE_LABELS).map((type) => {
              const count = typeCounts[type] ?? 0
              const total = Object.values(typeCounts).reduce((sum, value) => sum + value, 0) || 1
              return (
                <div className="type-row" key={type}>
                  <span>{TYPE_LABELS[type]}</span>
                  <div className="type-track">
                    <span style={{ width: `${(count / total) * 100}%` }} />
                  </div>
                  <strong>{count}</strong>
                </div>
              )
            })}
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <span className="eyebrow">RANKING</span>
            <h2>Mejores y peores desempeños</h2>
          </div>
          <span className="soft-chip">{trades.length} operaciones</span>
        </div>
        {ranked.length > 0 ? (
          <div className="ranking-list">
            {ranked.map((position) => {
              const meta = assetMeta(position.symbol, position.assetType)
              const percent = position.profitLossPercent ?? 0
              return (
                <div className="ranking-row" key={`${position.assetType}-${position.symbol}`}>
                  <span className="ranking-index">{ranked.indexOf(position) + 1}</span>
                  <span className={`asset-glyph asset-glyph-${meta.tone}`}>{meta.glyph}</span>
                  <span className="ranking-copy">
                    <strong>{meta.name}</strong>
                    <small>{formatQuantity(position.quantity)} unidades · {formatMoney(position.currentValue ?? position.investedAmount)}</small>
                  </span>
                  <span className={`ranking-result ${percent >= 0 ? 'positive' : 'negative'}`}>
                    {formatPercent(percent)}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="empty-state"><p>Realiza tu primera inversión para ver el ranking.</p></div>
        )}
      </section>
    </div>
  )
}
