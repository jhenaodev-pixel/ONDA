import { useMemo, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Filter,
  Search,
  Wallet,
} from 'lucide-react'
import { useApp } from '../state/AppContext'
import MoneyDialog, { type MoneyMode } from '../components/MoneyDialog'
import TransactionRow from '../components/TransactionRow'
import { accountLabel, formatMoney, maskAccount } from '../lib/formatters'

type FilterKey = 'ALL' | 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'INVESTMENT'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'ALL', label: 'Todos' },
  { key: 'DEPOSIT', label: 'Depósitos' },
  { key: 'WITHDRAWAL', label: 'Retiros' },
  { key: 'TRANSFER', label: 'Transferencias' },
  { key: 'INVESTMENT', label: 'Inversiones' },
]

export default function OperationsPage() {
  const { accounts, transactions, deposit, withdraw, transfer, createAccount, showNotice } = useApp()
  const [mode, setMode] = useState<MoneyMode | null>(null)
  const [filter, setFilter] = useState<FilterKey>('ALL')
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)

  const filtered = useMemo(() => {
    return transactions.filter((transaction) => {
      if (filter !== 'ALL') {
        if (filter === 'INVESTMENT') {
          if (!transaction.transactionType.startsWith('INVESTMENT')) return false
        } else if (transaction.transactionType !== filter) {
          return false
        }
      }
      if (query.trim()) {
        const haystack = `${transaction.description ?? ''} ${transaction.transactionType} ${transaction.sourceAccountNumber ?? ''} ${transaction.destinationAccount ?? ''}`.toLowerCase()
        if (!haystack.includes(query.trim().toLowerCase())) return false
      }
      return true
    })
  }, [transactions, filter, query])

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
    <div className="page operations-page">
      <header className="page-head">
        <div>
          <span className="eyebrow">TESORERÍA</span>
          <h1>Operaciones</h1>
          <p>Gestiona el efectivo, mueve fondos entre cuentas y revisa cada movimiento.</p>
        </div>
        <div className="page-head-actions">
          <button className="primary-button" onClick={() => setMode('deposit')}>
            <ArrowDownLeft size={17} /> Depositar
          </button>
          <button className="ghost-button" onClick={() => setMode('withdraw')}>
            <ArrowUpRight size={17} /> Retirar
          </button>
          <button className="ghost-button" onClick={() => setMode('transfer')}>
            <ArrowLeftRight size={17} /> Transferir
          </button>
        </div>
      </header>

      <section className="operations-summary">
        <div className="cash-card">
          <span className="eyebrow eyebrow-light">EFECTIVO TOTAL</span>
          <strong>{formatMoney(totalBalance)}</strong>
          <span>{accounts.length} {accounts.length === 1 ? 'cuenta conectada' : 'cuentas conectadas'}</span>
        </div>
        <div className="account-mini-grid">
          {accounts.map((account) => (
            <article className="account-mini" key={account.id}>
              <span className="account-mini-icon"><Wallet size={17} /></span>
              <div>
                <small>{accountLabel(account.accountType)}</small>
                <strong>{formatMoney(account.balance)}</strong>
                <span>{maskAccount(account.accountNumber)}</span>
              </div>
            </article>
          ))}
          <button className="account-mini account-mini-add" onClick={addAccount} disabled={creating}>
            <span className="account-mini-icon">+</span>
            <div>
              <small>{creating ? 'Creando…' : 'Nueva cuenta'}</small>
              <strong>Ahorros</strong>
              <span>Apertura inmediata</span>
            </div>
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head panel-head-wrap">
          <div>
            <span className="eyebrow">HISTORIAL</span>
            <h2>Movimientos</h2>
          </div>
          <div className="history-tools">
            <div className="search-inline">
              <Search size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar movimiento…"
                aria-label="Buscar movimiento"
              />
            </div>
            <span className="soft-chip"><Filter size={13} /> {filtered.length}</span>
          </div>
        </div>

        <div className="filter-row">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              className={`filter-chip ${filter === item.key ? 'is-active' : ''}`}
              onClick={() => setFilter(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="transaction-list">
          {filtered.length > 0 ? (
            filtered.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} accounts={accounts} />
            ))
          ) : (
            <div className="empty-state">
              <ArrowLeftRight size={26} />
              <p>No encontramos movimientos para este filtro.</p>
            </div>
          )}
        </div>
      </section>

      {mode && (
        <MoneyDialog
          mode={mode}
          accounts={accounts}
          onClose={() => setMode(null)}
          onDeposit={deposit}
          onWithdraw={withdraw}
          onTransfer={transfer}
        />
      )}
    </div>
  )
}
