import { createContext, useContext } from 'react'
import type {
  Account,
  AccountType,
  AssetQuote,
  BankTransaction,
  MoneyOperationRequest,
  Portfolio,
  Session,
  Trade,
  TradeRequest,
  TransferRequest,
} from '../lib/api'

export interface AppState {
  session: Session
  accounts: Account[]
  transactions: BankTransaction[]
  portfolio: Portfolio
  trades: Trade[]
  cryptoQuotes: AssetQuote[]
  stockQuotes: AssetQuote[]
  loading: boolean
  stocksEnabled: boolean
  stockMessage: string
  error: string
  notice: string
  lastUpdated: Date | null
  refresh: () => void
  clearNotice: () => void
  showNotice: (message: string) => void
  logout: () => void
  transfer: (values: TransferRequest) => Promise<BankTransaction>
  deposit: (values: MoneyOperationRequest) => Promise<BankTransaction>
  withdraw: (values: MoneyOperationRequest) => Promise<BankTransaction>
  buy: (values: TradeRequest) => Promise<Trade>
  sell: (values: TradeRequest) => Promise<Trade>
  createAccount: (type: AccountType) => Promise<Account>
}

export const AppContext = createContext<AppState | null>(null)

export function useApp(): AppState {
  const value = useContext(AppContext)
  if (!value) {
    throw new Error('useApp debe usarse dentro de AppContext.Provider')
  }
  return value
}
