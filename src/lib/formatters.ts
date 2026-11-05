const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const quantity = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 8,
})

const shortDate = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: 'short',
})

const time = new Intl.DateTimeFormat('es-CO', {
  hour: '2-digit',
  minute: '2-digit',
})

export function formatMoney(value?: number | null) {
  if (value == null || Number.isNaN(value)) return '—'
  return money.format(value)
}

export function formatQuantity(value?: number | null) {
  if (value == null || Number.isNaN(value)) return '—'
  return quantity.format(value)
}

export function formatCryptoPrice(value?: number | null) {
  if (value == null || Number.isNaN(value)) return '—'
  if (value < 0.01) {
    return `$${value.toLocaleString('en-US', { maximumFractionDigits: 8 })}`
  }
  if (value < 1) {
    return `$${value.toLocaleString('en-US', { maximumFractionDigits: 4 })}`
  }
  return money.format(value)
}

export function formatPercent(value?: number | null, withSign = true) {
  if (value == null || Number.isNaN(value)) return '—'
  const sign = withSign && value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatShortDate(iso?: string | null) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return shortDate.format(date)
}

export function formatTime(iso?: string | null) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return time.format(date)
}

export function initials(value: string) {
  const clean = value.split('@')[0]?.replace(/[._-]+/g, ' ').trim() ?? ''
  const parts = clean.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'ON'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function firstName(value: string) {
  const clean = value.split('@')[0]?.split(/[._-]/)[0] ?? 'Usuario'
  return clean.charAt(0).toUpperCase() + clean.slice(1)
}

export function accountLabel(type: string) {
  if (type === 'SAVINGS') return 'Cuenta de ahorros'
  if (type === 'CHECKINGS') return 'Cuenta corriente'
  return type
}

export function maskAccount(value: string) {
  return `•••• ${value.slice(-4)}`
}

export function dayGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}
