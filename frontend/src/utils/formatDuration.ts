import type { TimeUnit } from '../types'

function toMinutes(value: number, unit: TimeUnit): number {
  return unit === 'hours' ? value * 60 : value
}

export function formatTotalMinutes(totalMinutes: number): string {
  if (totalMinutes < 60) {
    return `${totalMinutes} min`
  }

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`
}

/**
 * Formats a stored (value, unit) pair as combined hours/minutes (e.g.
 * "1h 30m") rather than the raw unit — handles both legacy hours-only
 * entries and the current always-minutes storage the same way.
 */
export function formatDuration(value: number, unit: TimeUnit): string {
  return formatTotalMinutes(toMinutes(value, unit))
}
