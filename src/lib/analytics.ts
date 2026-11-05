import type { Account, BankTransaction } from './api'

export type Direction = 'in' | 'out' | 'internal'

export function transactionDirection(transaction: BankTransaction, accounts: Account[]): Direction {
  const own = new Set(accounts.map((account) => account.accountNumber))
  switch (transaction.transactionType) {
    case 'DEPOSIT':
    case 'INVESTMENT_SELL':
      return 'in'
    case 'WITHDRAWAL':
    case 'INVESTMENT_BUY':
      return 'out'
    case 'TRANSFER': {
      const sourceOwn = transaction.sourceAccountNumber ? own.has(transaction.sourceAccountNumber) : false
      const destinationOwn = transaction.destinationAccount ? own.has(transaction.destinationAccount) : false
      if (sourceOwn && !destinationOwn) return 'out'
      if (!sourceOwn && destinationOwn) return 'in'
      return 'internal'
    }
    default:
      return 'internal'
  }
}

export function signedAmount(transaction: BankTransaction, accounts: Account[]): number {
  const direction = transactionDirection(transaction, accounts)
  if (direction === 'in') return Math.abs(transaction.amount)
  if (direction === 'out') return -Math.abs(transaction.amount)
  return 0
}

/** Flujo neto acumulado de los movimientos (más reciente al final). */
export function cumulativeFlow(transactions: BankTransaction[], accounts: Account[]): number[] {
  const ordered = [...transactions].sort((left, right) => left.timestamp.localeCompare(right.timestamp))
  let total = 0
  const series = ordered.map((transaction) => {
    total += signedAmount(transaction, accounts)
    return total
  })
  return series.length >= 2 ? series : [0, ...series]
}

export interface MonthSummary {
  key: string
  label: string
  inflow: number
  outflow: number
}

const MONTH_LABEL = new Intl.DateTimeFormat('es-CO', { month: 'short' })

export function monthlySummary(transactions: BankTransaction[], accounts: Account[], months = 6): MonthSummary[] {
  const buckets = new Map<string, MonthSummary>()
  const now = new Date()

  for (let index = months - 1; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    buckets.set(key, {
      key,
      label: MONTH_LABEL.format(date).replace('.', ''),
      inflow: 0,
      outflow: 0,
    })
  }

  transactions.forEach((transaction) => {
    const date = new Date(transaction.timestamp)
    if (Number.isNaN(date.getTime())) return
    const key = `${date.getFullYear()}-${date.getMonth()}`
    const bucket = buckets.get(key)
    if (!bucket) return
    const direction = transactionDirection(transaction, accounts)
    if (direction === 'in') bucket.inflow += Math.abs(transaction.amount)
    if (direction === 'out') bucket.outflow += Math.abs(transaction.amount)
  })

  return Array.from(buckets.values())
}

export function countByType(transactions: BankTransaction[]) {
  return transactions.reduce<Record<string, number>>((accumulator, transaction) => {
    accumulator[transaction.transactionType] = (accumulator[transaction.transactionType] ?? 0) + 1
    return accumulator
  }, {})
}
