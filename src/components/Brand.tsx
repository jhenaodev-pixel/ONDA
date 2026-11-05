import { Link } from 'react-router-dom'

export function BrandMark({ className = '' }: { className?: string }) {
  return (
    <span className={`brand-mark ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 40 40" role="img">
        <path
          d="M7 16c4.8-4.6 9.6-6.2 14.4-4.8 4 1.2 7.1 4.1 11.6 3.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.55"
        />
        <path
          d="M7 22c4.8-4.6 9.6-6.2 14.4-4.8 4 1.2 7.1 4.1 11.6 3.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.7"
          strokeLinecap="round"
          opacity="0.8"
        />
        <path
          d="M7 28c4.8-4.6 9.6-6.2 14.4-4.8 4 1.2 7.1 4.1 11.6 3.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.9"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link className={compact ? 'brand brand-compact' : 'brand'} to="/" aria-label="ONDA, inicio">
      <BrandMark />
      <span className="brand-copy">
        <strong>ONDA</strong>
        <small>FLUID<br />BANKING</small>
      </span>
    </Link>
  )
}
