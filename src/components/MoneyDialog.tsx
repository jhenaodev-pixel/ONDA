import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeftRight, ArrowDownLeft, ArrowUpRight, LoaderCircle } from 'lucide-react'
import type { Account, MoneyOperationRequest, TransferRequest } from '../lib/api'
import { formatMoney } from '../lib/formatters'
import Modal from './Modal'

export type MoneyMode = 'deposit' | 'withdraw' | 'transfer'

interface MoneyDialogProps {
  mode: MoneyMode
  accounts: Account[]
  onClose: () => void
  onDeposit: (values: MoneyOperationRequest) => Promise<unknown>
  onWithdraw: (values: MoneyOperationRequest) => Promise<unknown>
  onTransfer: (values: TransferRequest) => Promise<unknown>
}

const COPY: Record<MoneyMode, { title: string; subtitle: string; cta: string }> = {
  deposit: {
    title: 'Depositar fondos',
    subtitle: 'Acredita dinero a una de tus cuentas ONDA.',
    cta: 'Confirmar depósito',
  },
  withdraw: {
    title: 'Retirar fondos',
    subtitle: 'Transfiere dinero desde tu cuenta a una cuenta externa.',
    cta: 'Confirmar retiro',
  },
  transfer: {
    title: 'Transferir entre cuentas',
    subtitle: 'Mueve dinero al instante entre tus cuentas ONDA.',
    cta: 'Confirmar transferencia',
  },
}

export default function MoneyDialog({
  mode,
  accounts,
  onClose,
  onDeposit,
  onWithdraw,
  onTransfer,
}: MoneyDialogProps) {
  const copy = COPY[mode]
  const [accountNumber, setAccountNumber] = useState(accounts[0]?.accountNumber ?? '')
  const [destination, setDestination] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setError('')
  }, [mode])

  const numeric = Number(amount.replace(',', '.')) || 0
  const selectedAccount = accounts.find((account) => account.accountNumber === accountNumber)
  const destinations = accounts.filter((account) => account.accountNumber !== accountNumber)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!accountNumber) {
      setError('Selecciona una cuenta.')
      return
    }
    if (numeric <= 0) {
      setError('Ingresa un monto mayor a cero.')
      return
    }
    if (mode === 'withdraw' && selectedAccount && numeric > selectedAccount.balance + 0.001) {
      setError('El monto supera el saldo disponible de la cuenta.')
      return
    }
    if (mode === 'transfer') {
      if (!destination) {
        setError('Selecciona la cuenta destino.')
        return
      }
      if (destination === accountNumber) {
        setError('La cuenta destino debe ser diferente a la cuenta origen.')
        return
      }
    }

    setBusy(true)
    try {
      if (mode === 'deposit') {
        await onDeposit({ accountNumber, amount: numeric, description: description || undefined })
      } else if (mode === 'withdraw') {
        await onWithdraw({ accountNumber, amount: numeric, description: description || undefined })
      } else {
        await onTransfer({
          sourceAccountNumber: accountNumber,
          destinationAccountNumber: destination,
          amount: numeric,
          description: description || undefined,
        })
      }
      onClose()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo completar la operación.')
    } finally {
      setBusy(false)
    }
  }

  const Icon = mode === 'deposit' ? ArrowDownLeft : mode === 'withdraw' ? ArrowUpRight : ArrowLeftRight

  return (
    <Modal title={copy.title} subtitle={copy.subtitle} onClose={onClose}>
      <form className="money-form" onSubmit={submit}>
        <div className={`money-orb money-orb-${mode}`}>
          <Icon size={22} />
        </div>

        <label className="field">
          <span>{mode === 'transfer' ? 'Cuenta origen' : 'Cuenta'}</span>
          <div className="input-shell">
            <select value={accountNumber} onChange={(event) => setAccountNumber(event.target.value)}>
              {accounts.map((account) => (
                <option key={account.id} value={account.accountNumber}>
                  •••• {account.accountNumber.slice(-4)} · {formatMoney(account.balance)}
                </option>
              ))}
            </select>
          </div>
        </label>

        {mode === 'transfer' && (
          <label className="field">
            <span>Cuenta destino</span>
            <div className="input-shell">
              <select value={destination} onChange={(event) => setDestination(event.target.value)}>
                <option value="">Selecciona una cuenta</option>
                {destinations.map((account) => (
                  <option key={account.id} value={account.accountNumber}>
                    •••• {account.accountNumber.slice(-4)} · {formatMoney(account.balance)}
                  </option>
                ))}
              </select>
            </div>
          </label>
        )}

        <label className="field">
          <span>Monto</span>
          <div className="input-shell">
            <span className="input-prefix">$</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
              autoFocus
            />
          </div>
          <small className="field-hint">Saldo disponible: {formatMoney(selectedAccount?.balance ?? 0)}</small>
        </label>

        <label className="field">
          <span>Descripción <small className="field-hint">Opcional</small></span>
          <div className="input-shell">
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Ej. Ahorro mensual"
              maxLength={120}
            />
          </div>
        </label>

        {error && <div className="alert alert-error" role="alert">{error}</div>}

        <div className="modal-actions">
          <button type="button" className="ghost-button" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button type="submit" className="primary-button" disabled={busy}>
            {busy ? <LoaderCircle className="spin" size={18} /> : copy.cta}
          </button>
        </div>
      </form>
    </Modal>
  )
}
