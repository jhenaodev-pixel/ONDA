import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ArrowDownRight,
  ArrowUpRight,
  Info,
  LoaderCircle,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import {
  marketApi,
  type AssetQuote,
  type AssetType,
  type StockSearchItem,
  type TradeType,
} from '../lib/api'
import { assetMeta } from '../lib/assets'
import {
  formatCryptoPrice,
  formatMoney,
  formatPercent,
  formatQuantity,
  formatShortDate,
} from '../lib/formatters'
import { useApp } from '../state/AppContext'
import { Donut } from '../components/charts'
import TradeDialog from '../components/TradeDialog'

type Tab = 'CRYPTO' | 'STOCK'

interface TradeTarget {
  mode: TradeType
  symbol: string
  assetType: AssetType
  price: number
  availableQuantity?: number
}

const ALLOCATION_COLORS = ['#5b45f5', '#18b98c', '#2f9df4', '#f2568f', '#f5a623', '#8b5cf6']

export default function InvestmentsPage() {
  const {
    accounts,
    portfolio,
    trades,
    cryptoQuotes,
    stockQuotes,
    stocksEnabled,
    stockMessage,
    buy,
    sell,
  } = useApp()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>('CRYPTO')
  const [target, setTarget] = useState<TradeTarget | null>(null)
  const [stockInput, setStockInput] = useState('')
  const [customStock, setCustomStock] = useState<AssetQuote | null>(null)
  const [stockResults, setStockResults] = useState<StockSearchItem[]>([])
  const [stockLoading, setStockLoading] = useState(false)
  const [stockError, setStockError] = useState('')

  const querySymbol = searchParams.get('q')

  useEffect(() => {
    if (!querySymbol) return
    const symbol = querySymbol.trim().toUpperCase()
    if (!symbol) return
    setTab('STOCK')
    setStockInput(symbol)
    let active = true
    setStockLoading(true)
    marketApi
      .getStockQuote(symbol)
      .then((quote) => {
        if (!active) return
        setCustomStock(quote)
        setStockError('')
      })
      .catch((error: unknown) => {
        if (!active) return
        setCustomStock(null)
        setStockError(error instanceof Error ? error.message : 'No se pudo consultar la acción.')
      })
      .finally(() => {
        if (active) setStockLoading(false)
      })
    return () => {
      active = false
    }
  }, [querySymbol])

  const cryptoList = useMemo(() => cryptoQuotes, [cryptoQuotes])

  const stockList = useMemo(() => {
    const map = new Map<string, AssetQuote>()
    stockQuotes.forEach((quote) => map.set(quote.symbol, quote))
    if (customStock) map.set(customStock.symbol, customStock)
    return Array.from(map.values())
  }, [stockQuotes, customStock])

  const positions = portfolio.positions
  const allocation = positions.slice(0, 6).map((position, index) => ({
    label: assetMeta(position.symbol, position.assetType).name,
    value: position.currentValue ?? position.investedAmount,
    color: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length],
  }))

  const profit = portfolio.totalProfitLoss

  async function loadStockQuote(symbol: string) {
    setStockLoading(true)
    setStockError('')
    try {
      const quote = await marketApi.getStockQuote(symbol)
      setCustomStock(quote)
      setStockInput(quote.symbol)
      setStockResults([])
    } catch (error) {
      setCustomStock(null)
      setStockError(error instanceof Error ? error.message : 'No se pudo consultar la acción.')
    } finally {
      setStockLoading(false)
    }
  }

  async function searchStock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const term = stockInput.trim().toUpperCase()
    if (!term) return

    setStockLoading(true)
    setStockError('')
    setStockResults([])
    try {
      const results = await marketApi.searchStocks(term, 8)
      if (results.length === 0) {
        setStockError(`No encontramos acciones para «${term}».`)
        return
      }

      const exact = results.find(
        (item) => item.symbol.toUpperCase() === term || item.displaySymbol?.toUpperCase() === term,
      )
      if (exact || results.length === 1) {
        await loadStockQuote((exact ?? results[0]).symbol)
        return
      }

      setStockResults(results)
    } catch (error) {
      setStockError(error instanceof Error ? error.message : 'No se pudo buscar la acción.')
    } finally {
      setStockLoading(false)
    }
  }

  function openBuy(quote: AssetQuote) {
    setTarget({ mode: 'BUY', symbol: quote.symbol, assetType: quote.assetType, price: quote.price })
  }

  function openSellPosition(symbol: string, assetType: AssetType, price: number, quantity: number) {
    setTarget({ mode: 'SELL', symbol, assetType, price, availableQuantity: quantity })
  }

  return (
    <div className="page investments-page">
      <header className="page-head">
        <div>
          <span className="eyebrow">MERCADOS</span>
          <h1>Inversiones</h1>
          <p>Compra y vende cripto y acciones con precios de mercado.</p>
        </div>
        <div className="page-head-actions">
          <span className="soft-chip soft-chip-mint"><Sparkles size={13} /> Cripto en vivo</span>
          <span className={`soft-chip ${stocksEnabled ? 'soft-chip-mint' : 'soft-chip-amber'}`}>
            Acciones {stocksEnabled ? 'activas' : 'no disponibles'}
          </span>
        </div>
      </header>

      <section className="investment-hero">
        <div className="investment-hero-main">
          <span className="eyebrow eyebrow-light">VALOR DEL PORTAFOLIO</span>
          <strong>{formatMoney(portfolio.totalCurrentValue)}</strong>
          <span className={`investment-delta ${profit >= 0 ? 'positive' : 'negative'}`}>
            {profit >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {profit >= 0 ? '+' : ''}{formatMoney(profit)} ({formatPercent(portfolio.totalProfitLossPercent)})
          </span>
          <div className="investment-metrics">
            <div><small>Invertido</small><strong>{formatMoney(portfolio.totalInvested)}</strong></div>
            <div><small>Posiciones</small><strong>{positions.length}</strong></div>
            <div><small>Operaciones</small><strong>{trades.length}</strong></div>
          </div>
        </div>
        <div className="investment-hero-side">
          {allocation.length > 0 ? (
            <>
              <Donut
                segments={allocation}
                size={150}
                thickness={18}
                centerValue={formatMoney(portfolio.totalCurrentValue)}
                centerLabel="Portafolio"
              />
              <ul className="allocation-legend compact">
                {allocation.map((segment) => (
                  <li key={segment.label}>
                    <i style={{ background: segment.color }} />
                    <span>{segment.label}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="empty-state empty-state-light">
              <Sparkles size={26} />
              <p>Aún no tienes posiciones abiertas.</p>
            </div>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head panel-head-wrap">
          <div>
            <span className="eyebrow">MERCADO</span>
            <h2>Explorar activos</h2>
          </div>
          <div className="tabs">
            <button className={tab === 'CRYPTO' ? 'is-active' : ''} onClick={() => setTab('CRYPTO')}>
              Criptomonedas
            </button>
            <button className={tab === 'STOCK' ? 'is-active' : ''} onClick={() => setTab('STOCK')}>
              Acciones
            </button>
          </div>
        </div>

        {tab === 'STOCK' && (
          <div className="stock-tools">
            <form className="search-inline" onSubmit={searchStock}>
              <Search size={16} />
              <input
                value={stockInput}
                onChange={(event) => setStockInput(event.target.value)}
                placeholder="Buscar acción (ej. AAPL, NVDA, SPY)"
                aria-label="Buscar acción"
              />
              <button type="submit" className="ghost-button small" disabled={stockLoading}>
                Buscar
              </button>
            </form>
            {stockLoading && (
              <span className="inline-loading"><LoaderCircle className="spin" size={15} /> Consultando…</span>
            )}
            {!stocksEnabled && stockMessage && (
              <div className="alert alert-info">
                <Info size={16} />
                <span>{stockMessage}</span>
              </div>
            )}
            {stockError && <div className="alert alert-error">{stockError}</div>}
            {stockResults.length > 0 && (
              <div className="stock-results">
                {stockResults.map((item) => (
                  <button
                    key={`${item.symbol}-${item.type ?? ''}`}
                    type="button"
                    className="stock-result"
                    onClick={() => void loadStockQuote(item.symbol)}
                  >
                    <strong>{item.displaySymbol ?? item.symbol}</strong>
                    <small>{item.description ?? item.type ?? 'Acción'}</small>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'CRYPTO' ? (
          <div className="asset-grid">
            {cryptoList.map((quote) => (
              <AssetCard
                key={quote.symbol}
                quote={quote}
                onBuy={() => openBuy(quote)}
              />
            ))}
            {cryptoList.length === 0 && (
              <div className="empty-state"><p>No hay cotizaciones de cripto disponibles.</p></div>
            )}
          </div>
        ) : (
          <div className="asset-grid">
            {stockList.map((quote) => (
              <AssetCard
                key={quote.symbol}
                quote={quote}
                onBuy={() => openBuy(quote)}
              />
            ))}
            {stockList.length === 0 && (
              <div className="empty-state">
                <Info size={24} />
                <p>
                  {stocksEnabled
                    ? 'Busca un símbolo para consultar su cotización.'
                    : 'Las acciones no están disponibles: falta configurar la clave de Finnhub en el backend.'}
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="overview-grid">
        <article className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">POSICIONES</span>
              <h2>Tu portafolio</h2>
            </div>
            <span className="soft-chip">{positions.length} activos</span>
          </div>
          {positions.length > 0 ? (
            <div className="position-table">
              <div className="position-row position-head">
                <span>Activo</span>
                <span>Cantidad</span>
                <span>Precio prom.</span>
                <span>Valor</span>
                <span>Resultado</span>
                <span />
              </div>
              {positions.map((position) => {
                const meta = assetMeta(position.symbol, position.assetType)
                const price = position.currentPrice ?? position.averagePrice
                return (
                  <div className="position-row" key={`${position.assetType}-${position.symbol}`}>
                    <span className="position-asset">
                      <span className={`asset-glyph asset-glyph-${meta.tone}`}>{meta.glyph}</span>
                      <span>
                        <strong>{meta.name}</strong>
                        <small>{position.symbol}</small>
                      </span>
                    </span>
                    <span>{formatQuantity(position.quantity)}</span>
                    <span>{formatCryptoPrice(position.averagePrice)}</span>
                    <span>{formatMoney(position.currentValue ?? position.investedAmount)}</span>
                    <span className={(position.profitLoss ?? 0) >= 0 ? 'positive' : 'negative'}>
                      {formatPercent(position.profitLossPercent)}
                    </span>
                    <span>
                      <button
                        className="ghost-button small danger"
                        onClick={() => openSellPosition(position.symbol, position.assetType, price, position.quantity)}
                      >
                        Vender
                      </button>
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty-state"><p>Aún no tienes posiciones abiertas.</p></div>
          )}
        </article>

        <article className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">REGISTRO</span>
              <h2>Historial de operaciones</h2>
            </div>
          </div>
          {trades.length > 0 ? (
            <div className="trade-history">
              {trades.slice(0, 8).map((trade) => {
                const meta = assetMeta(trade.symbol, trade.assetType)
                const isBuy = trade.tradeType === 'BUY'
                return (
                  <div className="trade-history-row" key={trade.id}>
                    <span className={`trade-history-icon ${isBuy ? 'is-buy' : 'is-sell'}`}>
                      {isBuy ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                    </span>
                    <span className="trade-history-copy">
                      <strong>{meta.name}</strong>
                      <small>{formatShortDate(trade.timestamp)} · {formatQuantity(trade.quantity)} unidades</small>
                    </span>
                    <span className={`trade-history-amount ${isBuy ? 'negative' : 'positive'}`}>
                      {isBuy ? '−' : '+'}{formatMoney(trade.totalAmount)}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty-state"><p>Tus operaciones aparecerán aquí.</p></div>
          )}
        </article>
      </section>

      {target && (
        <TradeDialog
          mode={target.mode}
          symbol={target.symbol}
          assetType={target.assetType}
          price={target.price}
          accounts={accounts}
          availableQuantity={target.availableQuantity}
          onClose={() => setTarget(null)}
          onSubmit={target.mode === 'BUY' ? buy : sell}
        />
      )}
    </div>
  )
}

interface AssetCardProps {
  quote: AssetQuote
  onBuy: () => void
}

function AssetCard({ quote, onBuy }: AssetCardProps) {
  const meta = assetMeta(quote.symbol, quote.assetType)
  const delta = quote.changePercent ?? 0
  const isCrypto = quote.assetType === 'CRYPTO'
  const hasRange = quote.highPrice != null || quote.lowPrice != null

  return (
    <article className="asset-card">
      <div className="asset-card-head">
        <span className={`asset-glyph asset-glyph-${meta.tone}`}>{meta.glyph}</span>
        <div>
          <strong>{meta.name}</strong>
          <small>{quote.symbol}</small>
        </div>
        <span className={`asset-change ${delta >= 0 ? 'positive' : 'negative'}`}>
          {formatPercent(delta)}
        </span>
      </div>
      <div className="asset-card-price">
        <strong>{isCrypto ? formatCryptoPrice(quote.price) : formatMoney(quote.price)}</strong>
        <span>{isCrypto ? 'USDT' : quote.currency ?? 'USD'}</span>
      </div>
      {hasRange && (
        <div className="asset-card-meta">
          <span>Máx. {formatCryptoPrice(quote.highPrice)}</span>
          <span>Mín. {formatCryptoPrice(quote.lowPrice)}</span>
        </div>
      )}
      <div className="asset-card-foot">
        <span>{meta.subtitle.split('•')[1]?.trim() ?? (isCrypto ? 'Cripto' : 'Acción')}</span>
        <button className="primary-button small" onClick={onBuy}>Invertir</button>
      </div>
    </article>
  )
}
