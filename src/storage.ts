import type { Match } from './types'

const KEY = 'wc2026_bracket'

export function saveProjection(matches: Match[]): void {
  localStorage.setItem(KEY, JSON.stringify(matches))
}

export function loadProjection(): Match[] | null {
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Match[]
  } catch {
    return null
  }
}

export function clearProjection(): void {
  localStorage.removeItem(KEY)
}
