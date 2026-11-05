import { useMemo, useState, type FormEvent } from 'react'
import { ArrowDownRight, ArrowUpRight, LoaderCircle, Wallet } from 'lucide-react'
import type { Account, AssetType, TradeRequest, TradeType } from '../lib/api'
import { assetMeta } from '../lib/assets'
import { formatMoney, formatQuantity } from '../lib/formatters'
import Modal from './Modal'

interface TradeDialogProps {
  mode: TradeType
  symbol: string
  assetType: AssetType
  price: number
  accounts: Account[]
  availableQuantity?: number
  onClose: () => void
  onSubmit: (values: TradeRequest) => Promise<unknown>
}

type InputMode = 'amount' | 'quantity'

export default function TradeDialog({
  mode,
  symbol,
  assetType,
  price,
  accounts,
  availableQuantity,
  onClose,
  onSubmit,
}: TradeDialogProps) {
  const meta = assetMeta(symbol, assetType)
  const isBuy = mode === 'BUY'
  const [accountNumber, setAccountNumber] = useState(accounts[0]?.accountNumber ?? '')
  const [inputMode, setInputMode] = useState<InputMode>(isBuy ? 'amount' : 'quantity')
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const selectedAccount = accounts.find((account) => account.accountNumber === accountNumber)
  const numeric = Number(value.replace(',', '.')) || 0

  const quantity = useMemo(() => {
    if (inputMode === 'quantity') return numeric
    if (price > 0) return numeric / price
    return 0
  }, [inputMode, numeric, price])

  const total = quantity * price
  const maxQuantity = availableQuantity ?? Number.POSITIVE_INFINITY

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!accountNumber) {
      setError('Selecciona una cuenta para operar.')
      return
    }
    if (numeric <= 0) {
      setError('Ingresa un monto válido mayor a cero.')
      return
    }
    if (!isBuy && quantity > maxQuantity + 1e-8) {
      setError('No tienes suficientes unidades disponibles para vender.')
      return
    }
    if (isBuy && selectedAccount && total > selectedAccount.balance + 0.001) {
      setError('El saldo de la cuenta no es suficiente para esta compra.')
      return
    }

    setBusy(true)
    try {
      const payload: TradeRequest = {
        accountNumber,
        symbol,
        assetType,
        ...(inputMode === 'amount' ? { amount: numeric } : { quantity: numeric }),
      }
      await onSubmit(payload)
      onClose()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo completar la operación.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title={`${isBuy ? 'Comprar' : 'Vender'} ${meta.name}`}
      subtitle={`${symbol} · ${assetType === 'CRYPTO' ? 'Cripto' : 'Acción'} · Precio de mercado ${formatMoney(price)}`}
      onClose={onClose}
    >
      <form className="trade-form" onSubmit={submit}>
        <div className={`asset-badge asset-badge-${meta.tone}`}>
          <span className="asset-glyph">{meta.glyph}</span>
          <div>
            <strong>{meta.name}</strong>
            <small>{meta.subtitle}</small>
          </div>
          <span className={`trade-direction ${isBuy ? 'is-buy' : 'is-sell'}`}>
            {isBuy ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {isBuy ? 'Compra' : 'Venta'}
          </span>
        </div>

        <label className="field">
          <span>Cuenta</span>
          <div className="input-shell">
            <Wallet size={17} />
            <select value={accountNumber} onChange={(event) => setAccountNumber(event.target.value)}>
              {accounts.map((account) => (
                <option key={account.id} value={account.accountNumber}>
                  •••• {account.accountNumber.slice(-4)} · {formatMoney(account.balance)}
                </option>
              ))}
            </select>
          </div>
        </label>

        <div className="segmented">
          {isBuy && (
            <button
              type="button"
              className={inputMode === 'amount' ? 'is-active' : ''}
              onClick={() => setInputMode('amount')}
            >
              Invertir USD
            </button>
          )}
          <button
            type="button"
            className={inputMode === 'quantity' ? 'is-active' : ''}
            onClick={() => setInputMode('quantity')}
          >
            Unidades
          </button>
        </div>

        <label className="field">
          <span>{inputMode === 'amount' ? 'Monto a invertir (USD)' : 'Cantidad de unidades'}</span>
          <div className="input-shell">
            <span className="input-prefix">{inputMode === 'amount' ? '$' : '#'}</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={inputMode === 'amount' ? '0.00' : '0'}
              autoFocus
            />
          </div>
          {!isBuy && Number.isFinite(maxQuantity) && (
            <small className="field-hint">Disponibles: {formatQuantity(maxQuantity)} unidades</small>
          )}
        </label>

        <div className="trade-summary">
          <div>
            <small>Unidades estimadas</small>
            <strong>{formatQuantity(quantity)}</strong>
          </div>
          <div>
            <small>Total operación</small>
            <strong>{formatMoney(total)}</strong>
          </div>
          <div>
            <small>Saldo disponible</small>
            <strong>{formatMoney(selectedAccount?.balance ?? 0)}</strong>
          </div>
        </div>

        {error && <div className="alert alert-error" role="alert">{error}</div>}

        <div className="modal-actions">
          <button type="button" className="ghost-button" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button type="submit" className={`primary-button ${isBuy ? '' : 'is-sell'}`} disabled={busy}>
            {busy ? <LoaderCircle className="spin" size={18} /> : isBuy ? 'Confirmar compra' : 'Confirmar venta'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
