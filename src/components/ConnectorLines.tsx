import { LAYOUT } from '../constants'
import type { Match, Round, Side } from '../types'

interface ConnectorLinesProps {
  side: Side
  matches: Match[]
}

const ROUNDS_IN_ORDER: Round[] = ['R32', 'R16', 'QF', 'SF']
const NEXT_ROUND: Partial<Record<Round, Round>> = { R32: 'R16', R16: 'QF', QF: 'SF' }

function slotCenterY(slot: number, totalSlots: number): number {
  return (slot + 0.5) * (LAYOUT.BRACKET_HEIGHT / totalSlots)
}

function roundSlotCount(round: Round): number {
  const counts: Record<Round, number> = { R32: 8, R16: 4, QF: 2, SF: 1, FINAL: 1, THIRD: 1 }
  return counts[round] ?? 1
}

export default function ConnectorLines({ side, matches }: ConnectorLinesProps) {
  // Total SVG width = 4 columns * COLUMN_WIDTH (includes gaps)
  const totalWidth = 4 * LAYOUT.COLUMN_WIDTH
  const paths: string[] = []

  for (const round of ROUNDS_IN_ORDER) {
    const next = NEXT_ROUND[round]
    if (!next) continue

    const roundMatches = matches.filter(m => m.round === round && m.side === side)
    const roundIdx = ROUNDS_IN_ORDER.indexOf(round) // 0–3
    const colX = roundIdx * LAYOUT.COLUMN_WIDTH    // left edge of this round's column

    const srcSlots = roundSlotCount(round)
    const dstSlots = roundSlotCount(next)

    for (const match of roundMatches) {
      const srcY = slotCenterY(match.slot, srcSlots)
      const dstSlot = Math.floor(match.slot / 2)
      const dstY = slotCenterY(dstSlot, dstSlots)

      // Right edge of current match box
      const x1 = colX + LAYOUT.MATCH_BOX_WIDTH
      // Left edge of next match box
      const x2 = (roundIdx + 1) * LAYOUT.COLUMN_WIDTH
      // Midpoint for the vertical segment
      const mx = x1 + (x2 - x1) / 2

      paths.push(`M ${x1} ${srcY} H ${mx} V ${dstY} H ${x2}`)
    }
  }

  // For right side, mirror the SVG horizontally
  const transform = side === 'right' ? `scale(-1,1) translate(-${totalWidth},0)` : undefined

  return (
    <svg
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', overflow: 'visible' }}
      width={totalWidth}
      height={LAYOUT.BRACKET_HEIGHT}
    >
      <g transform={transform}>
        {paths.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="var(--connector-color)" strokeWidth={1.5} />
        ))}
      </g>
    </svg>
  )
}
