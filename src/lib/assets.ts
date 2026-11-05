import type { AssetType } from './api'

export interface AssetMeta {
  name: string
  subtitle: string
  tone: string
  glyph: string
}

const CRYPTO_META: Record<string, AssetMeta> = {
  BTCUSDT: { name: 'Bitcoin', subtitle: 'BTC • Reserva digital', tone: 'violet', glyph: '₿' },
  ETHUSDT: { name: 'Ethereum', subtitle: 'ETH • Red descentralizada', tone: 'sky', glyph: 'Ξ' },
  BNBUSDT: { name: 'BNB', subtitle: 'BNB • Ecosistema Binance', tone: 'amber', glyph: 'B' },
  SOLUSDT: { name: 'Solana', subtitle: 'SOL • Alto rendimiento', tone: 'mint', glyph: 'S' },
  XRPUSDT: { name: 'XRP', subtitle: 'XRP • Pagos globales', tone: 'indigo', glyph: 'X' },
  ADAUSDT: { name: 'Cardano', subtitle: 'ADA • Investigación', tone: 'sky', glyph: 'A' },
  DOGEUSDT: { name: 'Dogecoin', subtitle: 'DOGE • Comunidad', tone: 'amber', glyph: 'Ð' },
  LINKUSDT: { name: 'Chainlink', subtitle: 'LINK • Oráculos', tone: 'indigo', glyph: 'L' },
  AVAXUSDT: { name: 'Avalanche', subtitle: 'AVAX • Contratos', tone: 'rose', glyph: 'A' },
  DOTUSDT: { name: 'Polkadot', subtitle: 'DOT • Interoperabilidad', tone: 'rose', glyph: '●' },
}

const STOCK_META: Record<string, AssetMeta> = {
  AAPL: { name: 'Apple Inc.', subtitle: 'AAPL • Tecnología', tone: 'indigo', glyph: 'A' },
  MSFT: { name: 'Microsoft', subtitle: 'MSFT • Tecnología', tone: 'sky', glyph: 'M' },
  NVDA: { name: 'NVIDIA', subtitle: 'NVDA • Semiconductores', tone: 'mint', glyph: 'N' },
  SPY: { name: 'S&P 500 ETF', subtitle: 'SPY • Fondo indexado', tone: 'violet', glyph: 'S' },
  TSLA: { name: 'Tesla', subtitle: 'TSLA • Automoción', tone: 'rose', glyph: 'T' },
  AMZN: { name: 'Amazon', subtitle: 'AMZN • Consumo', tone: 'amber', glyph: 'Z' },
  GOOGL: { name: 'Alphabet', subtitle: 'GOOGL • Tecnología', tone: 'sky', glyph: 'G' },
  META: { name: 'Meta Platforms', subtitle: 'META • Tecnología', tone: 'indigo', glyph: 'M' },
}

export const FEATURED_STOCKS = ['AAPL', 'MSFT', 'NVDA', 'SPY', 'TSLA', 'AMZN']

export function assetMeta(symbol: string, assetType?: AssetType): AssetMeta {
  if (CRYPTO_META[symbol]) return CRYPTO_META[symbol]
  if (STOCK_META[symbol]) return STOCK_META[symbol]

  const clean = symbol.replace(/USDT$/, '')
  return {
    name: clean,
    subtitle: assetType === 'CRYPTO' ? `${clean} • Cripto` : `${symbol} • Acción`,
    tone: 'indigo',
    glyph: clean.slice(0, 1).toUpperCase(),
  }
}
