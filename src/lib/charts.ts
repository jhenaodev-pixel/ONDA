export interface ChartPoint {
  x: number
  y: number
}

export function scaleSeries(
  values: number[],
  width: number,
  height: number,
  padding = 10,
): ChartPoint[] {
  if (values.length === 0) return []
  if (values.length === 1) {
    return [{ x: width / 2, y: height / 2 }]
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || Math.abs(max) || 1
  const step = (width - padding * 2) / (values.length - 1)

  return values.map((value, index) => ({
    x: padding + index * step,
    y: padding + (1 - (value - min) / span) * (height - padding * 2),
  }))
}

export function smoothLine(points: ChartPoint[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  let path = `M ${points[0].x} ${points[0].y}`

  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index - 1] ?? points[index]
    const p1 = points[index]
    const p2 = points[index + 1]
    const p3 = points[index + 2] ?? p2

    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }

  return path
}

export function areaFrom(points: ChartPoint[], height: number): string {
  if (points.length === 0) return ''
  const line = smoothLine(points)
  const first = points[0]
  const last = points[points.length - 1]
  return `${line} L ${last.x} ${height} L ${first.x} ${height} Z`
}
