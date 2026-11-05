import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from 'lucide-react'
import type { Account, BankTransaction } from '../lib/api'
import { assetMeta } from '../lib/assets'
import { formatMoney, formatShortDate, formatTime } from '../lib/formatters'

interface TransactionRowProps {
  transaction: BankTransaction
  accounts: Account[]
}

const LABELS: Record<string, string> = {
  DEPOSIT: 'Depósito',
  WITHDRAWAL: 'Retiro',
  TRANSFER: 'Transferencia',
  INVESTMENT_BUY: 'Compra de activo',
  INVESTMENT_SELL: 'Venta de activo',
}

export default function TransactionRow({ transaction, accounts }: TransactionRowProps) {
  const ownNumbers = new Set(accounts.map((account) => account.accountNumber))
  const isInvestment = transaction.transactionType === 'INVESTMENT_BUY' || transaction.transactionType === 'INVESTMENT_SELL'

  let direction: 'in' | 'out' | 'internal' = 'internal'
  if (transaction.transactionType === 'DEPOSIT') direction = 'in'
  else if (transaction.transactionType === 'WITHDRAWAL') direction = 'out'
  else if (transaction.transactionType === 'INVESTMENT_BUY') direction = 'out'
  else if (transaction.transactionType === 'INVESTMENT_SELL') direction = 'in'
  else if (transaction.transactionType === 'TRANSFER') {
    const sourceOwn = transaction.sourceAccountNumber ? ownNumbers.has(transaction.sourceAccountNumber) : false
    const destinationOwn = transaction.destinationAccount ? ownNumbers.has(transaction.destinationAccount) : false
    if (sourceOwn && !destinationOwn) direction = 'out'
    else if (!sourceOwn && destinationOwn) direction = 'in'
    else direction = 'internal'
  }

  const symbol = transaction.description?.match(/\b([A-Z]{2,10}USDT|[A-Z]{2,5})\b/)?.[1]
  const title = isInvestment && symbol
    ? `${LABELS[transaction.transactionType]} · ${assetMeta(symbol, symbol.endsWith('USDT') ? 'CRYPTO' : 'STOCK').name}`
    : transaction.description || LABELS[transaction.transactionType] || 'Movimiento'

  const Icon = direction === 'in'
    ? ArrowDownLeft
    : direction === 'out'
      ? ArrowUpRight
      : ArrowLeftRight

  return (
    <div className="transaction-row">
      <span className={`transaction-icon transaction-${direction}`}>
        <Icon size={17} />
      </span>
      <span className="transaction-details">
        <strong>{title}</strong>
        <small>
          {LABELS[transaction.transactionType] ?? transaction.transactionType}
          {transaction.sourceAccountNumber && ` · desde •••• ${transaction.sourceAccountNumber.slice(-4)}`}
          {transaction.destinationAccount && ` · hacia •••• ${transaction.destinationAccount.slice(-4)}`}
        </small>
      </span>
      <span className="transaction-meta">
        <strong className={direction === 'in' ? 'positive' : direction === 'out' ? 'negative' : ''}>
          {direction === 'in' ? '+' : direction === 'out' ? '−' : ''}
          {formatMoney(transaction.amount)}
        </strong>
        <small>{formatShortDate(transaction.timestamp)} · {formatTime(transaction.timestamp)}</small>
      </span>
    </div>
  )
}
