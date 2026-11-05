export type AccountType = 'SAVINGS' | 'CHECKINGS'
export type AssetType = 'CRYPTO' | 'STOCK'
export type TradeType = 'BUY' | 'SELL'
export type TransactionType =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'TRANSFER'
  | 'INVESTMENT_BUY'
  | 'INVESTMENT_SELL'

export interface AuthResponse {
  token: string
  email: string
  role: string
}

export interface Session extends AuthResponse {
  displayName: string
}

export interface Account {
  id: number
  accountNumber: string
  balance: number
  accountType: AccountType
}

export interface BankTransaction {
  id: number
  reference?: string
  sourceAccountNumber: string | null
  destinationAccount: string | null
  amount: number
  transactionType: TransactionType
  description: string | null
  timestamp: string
}

export interface AssetQuote {
  symbol: string
  assetType: AssetType
  price: number
  change?: number | null
  changePercent?: number | null
  openPrice?: number | null
  highPrice?: number | null
  lowPrice?: number | null
  previousClose?: number | null
  volume?: number | null
  quoteVolume?: number | null
  currency?: string
  quotedAt?: string
}

export interface StockSearchItem {
  symbol: string
  displaySymbol?: string
  description?: string
  type?: string
}

export interface Position {
  id: number
  symbol: string
  assetType: AssetType
  quantity: number
  averagePrice: number
  investedAmount: number
  currentPrice?: number | null
  currentValue?: number | null
  profitLoss?: number | null
  profitLossPercent?: number | null
}

export interface Portfolio {
  totalInvested: number
  totalCurrentValue: number
  totalProfitLoss: number
  totalProfitLossPercent?: number | null
  fullyValued: boolean
  valuedAt?: string
  positions: Position[]
}

export interface Trade {
  id: number
  reference: string
  symbol: string
  assetType: AssetType
  tradeType: TradeType
  quantity: number
  price: number
  totalAmount: number
  realizedProfit?: number | null
  accountNumber: string
  accountBalance?: number | null
  description?: string | null
  timestamp: string
}

export interface RegisterValues {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface TransferRequest {
  sourceAccountNumber: string
  destinationAccountNumber: string
  amount: number
  description?: string
}

export interface MoneyOperationRequest {
  accountNumber: string
  amount: number
  description?: string
}

export interface TradeRequest {
  accountNumber: string
  symbol: string
  assetType: AssetType
  amount?: number
  quantity?: number
  description?: string
}

export interface ApiErrorBody {
  message?: string | string[]
  error?: string
  details?: Record<string, string>
}

export class ApiError extends Error {
  readonly status: number
  readonly details?: Record<string, string>

  constructor(message: string, status: number, details?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers })
  } catch {
    throw new ApiError('No se pudo conectar con el backend. Verifica que esté iniciado.', 0)
  }

  const payload: unknown = response.status === 204 ? null : await response.json().catch(() => null)

  if (!response.ok) {
    const body = payload as ApiErrorBody | null
    const detailMessage = body?.details ? Object.values(body.details).join('. ') : ''
    const message = detailMessage
      || (Array.isArray(body?.message) ? body.message.join('. ') : body?.message)
      || body?.error
      || `La solicitud falló (${response.status}).`
    throw new ApiError(message, response.status, body?.details)
  }

  return payload as T
}

export const bankApi = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (values: RegisterValues) =>
    request<AuthResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(values),
    }),

  getAccounts: (token: string) =>
    request<Account[]>('/api/v1/accounts', {}, token),

  createAccount: (accountType: AccountType, token: string) =>
    request<Account>('/api/v1/accounts', {
      method: 'POST',
      body: JSON.stringify({ accountType }),
    }, token),

  getTransactions: (accountNumber: string, token: string) =>
    request<BankTransaction[]>(
      `/api/v1/transactions/account/${encodeURIComponent(accountNumber)}`,
      {},
      token,
    ),

  transfer: (values: TransferRequest, token: string) =>
    request<BankTransaction>('/api/v1/transactions/transfer', {
      method: 'POST',
      body: JSON.stringify(values),
    }, token),

  deposit: (values: MoneyOperationRequest, token: string) =>
    request<BankTransaction>('/api/v1/transactions/deposit', {
      method: 'POST',
      body: JSON.stringify(values),
    }, token),

  withdraw: (values: MoneyOperationRequest, token: string) =>
    request<BankTransaction>('/api/v1/transactions/withdraw', {
      method: 'POST',
      body: JSON.stringify(values),
    }, token),
}

export const marketApi = {
  getCryptos: () => request<AssetQuote[]>('/api/v1/market/crypto'),

  getStockQuote: (symbol: string) =>
    request<AssetQuote>(`/api/v1/market/stocks/${encodeURIComponent(symbol)}`),

  searchStocks: (query: string, limit = 8) =>
    request<StockSearchItem[]>(
      `/api/v1/market/stocks/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    ),
}

export const investmentApi = {
  getPortfolio: (token: string) =>
    request<Portfolio>('/api/v1/investments/portfolio', {}, token),

  getHistory: (token: string) =>
    request<Trade[]>('/api/v1/investments/history', {}, token),

  buy: (values: TradeRequest, token: string) =>
    request<Trade>('/api/v1/investments/buy', {
      method: 'POST',
      body: JSON.stringify(values),
    }, token),

  sell: (values: TradeRequest, token: string) =>
    request<Trade>('/api/v1/investments/sell', {
      method: 'POST',
      body: JSON.stringify(values),
    }, token),
}

export const emptyPortfolio: Portfolio = {
  totalInvested: 0,
  totalCurrentValue: 0,
  totalProfitLoss: 0,
  totalProfitLossPercent: 0,
  fullyValued: true,
  positions: [],
}
