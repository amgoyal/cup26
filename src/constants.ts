import type { Round } from './types'

// Round order for left half (right half is reversed)
export const LEFT_ROUNDS: Round[] = ['R32', 'R16', 'QF', 'SF']
export const RIGHT_ROUNDS: Round[] = ['SF', 'QF', 'R16', 'R32']

// Matches per side per round
export const SLOTS_PER_ROUND: Record<Round, number> = {
  R32: 8,
  R16: 4,
  QF: 2,
  SF: 1,
  FINAL: 1,
  THIRD: 1,
}

// football-data.org stage name → our Round
export const STAGE_TO_ROUND: Record<string, Round> = {
  LAST_32: 'R32',
  LAST_16: 'R16',
  QUARTER_FINALS: 'QF',
  SEMI_FINALS: 'SF',
  FINAL: 'FINAL',
  THIRD_PLACE: 'THIRD',
}

// Layout constants (px) used by RoundColumn and ConnectorLines
export const LAYOUT = {
  MATCH_BOX_HEIGHT: 72,
  MATCH_BOX_WIDTH: 180,
  COLUMN_WIDTH: 220,   // match box + gap between columns
  BRACKET_HEIGHT: 704, // 8 * 88px slots
  SLOT_BASE: 88,       // base slot height at R32; doubles each round
}
