import { useId } from 'react'
import { areaFrom, scaleSeries, smoothLine } from '../lib/charts'

interface AreaChartProps {
  values: number[]
  height?: number
  tone?: 'violet' | 'mint' | 'rose' | 'sky'
  showGrid?: boolean
  label?: string
}

const TONE_COLORS: Record<string, { line: string; from: string; to: string }> = {
  violet: { line: '#5b45f5', from: 'rgba(91,69,245,0.30)', to: 'rgba(91,69,245,0)' },
  mint: { line: '#18b98c', from: 'rgba(24,185,140,0.28)', to: 'rgba(24,185,140,0)' },
  rose: { line: '#f2568f', from: 'rgba(242,86,143,0.26)', to: 'rgba(242,86,143,0)' },
  sky: { line: '#2f9df4', from: 'rgba(47,157,244,0.26)', to: 'rgba(47,157,244,0)' },
}

export function AreaChart({ values, height = 180, tone = 'violet', showGrid = true, label }: AreaChartProps) {
  const gradientId = useId().replace(/:/g, '')
  const width = 640
  const colors = TONE_COLORS[tone] ?? TONE_COLORS.violet
  const points = scaleSeries(values, width, height, 12)
  const line = smoothLine(points)
  const area = areaFrom(points, height)

  if (points.length === 0) {
    return <div className="chart-empty" style={{ height }}>Sin datos suficientes</div>
  }

  return (
    <svg
      className="area-chart"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label ?? 'Evolución del valor'}
    >
      <defs>
        <linearGradient id={`area-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.from} />
          <stop offset="100%" stopColor={colors.to} />
        </linearGradient>
      </defs>
      {showGrid && (
        <g className="chart-grid">
          {[0.2, 0.5, 0.8].map((ratio) => (
            <line
              key={ratio}
              x1={0}
              x2={width}
              y1={height * ratio}
              y2={height * ratio}
              stroke="currentColor"
              strokeWidth={1}
            />
          ))}
        </g>
      )}
      <path d={area} fill={`url(#area-${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke={colors.line}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.length > 0 && (
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={4.5} fill={colors.line} />
      )}
    </svg>
  )
}

interface DonutProps {
  segments: { label: string; value: number; color: string }[]
  size?: number
  thickness?: number
  centerLabel?: string
  centerValue?: string
}

export function Donut({ segments, size = 168, thickness = 20, centerLabel, centerValue }: DonutProps) {
  const total = segments.reduce((sum, segment) => sum + Math.max(segment.value, 0), 0)
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Distribución del portafolio">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(91,69,245,0.10)"
          strokeWidth={thickness}
        />
        {total > 0 &&
          segments.map((segment) => {
            const portion = Math.max(segment.value, 0) / total
            const dash = portion * circumference
            const circle = (
              <circle
                key={segment.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            )
            offset += dash
            return circle
          })}
      </svg>
      {(centerValue || centerLabel) && (
        <div className="donut-center">
          {centerValue && <strong>{centerValue}</strong>}
          {centerLabel && <small>{centerLabel}</small>}
        </div>
      )}
    </div>
  )
}

interface BarsProps {
  values: { label: string; value: number }[]
  tone?: 'violet' | 'mint'
}

export function Bars({ values, tone = 'violet' }: BarsProps) {
  const max = Math.max(...values.map((item) => Math.abs(item.value)), 1)

  return (
    <div className={`bars bars-${tone}`}>
      {values.map((item) => (
        <div className="bar-column" key={item.label}>
          <div className="bar-track">
            <span
              className="bar-fill"
              style={{ height: `${Math.max((Math.abs(item.value) / max) * 100, 4)}%` }}
            />
          </div>
          <small>{item.label}</small>
        </div>
      ))}
    </div>
  )
}
