import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MatchBox from './MatchBox'
import type { Match } from '../types'

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 'R32-left-0', round: 'R32', slot: 0, side: 'left',
    home: { id: 1, name: 'Brazil', shortName: 'Brazil', crest: '' },
    away: { id: 2, name: 'Croatia', shortName: 'Croatia', crest: '' },
    winner: null, homeProb: 0.65, awayProb: 0.35, isProjected: false,
    ...overrides,
  }
}

describe('MatchBox', () => {
  it('renders both team names', () => {
    render(<MatchBox match={makeMatch()} onAdvance={vi.fn()} />)
    expect(screen.getByText('Brazil')).toBeTruthy()
    expect(screen.getByText('Croatia')).toBeTruthy()
  })

  it('calls onAdvance with match id and team when team is clicked', () => {
    const onAdvance = vi.fn()
    render(<MatchBox match={makeMatch()} onAdvance={onAdvance} />)
    fireEvent.click(screen.getByText('Brazil'))
    expect(onAdvance).toHaveBeenCalledWith('R32-left-0', expect.objectContaining({ name: 'Brazil' }))
  })

  it('does not call onAdvance when match has confirmed winner', () => {
    const onAdvance = vi.fn()
    const match = makeMatch({ winner: { id: 1, name: 'Brazil', shortName: 'Brazil', crest: '' }, isProjected: false })
    render(<MatchBox match={match} onAdvance={onAdvance} />)
    fireEvent.click(screen.getByText('Croatia'))
    expect(onAdvance).not.toHaveBeenCalled()
  })

  it('shows TBD when a team slot is empty', () => {
    render(<MatchBox match={makeMatch({ home: null })} onAdvance={vi.fn()} />)
    expect(screen.getByText('TBD')).toBeTruthy()
  })

  it('renders probability percentages', () => {
    render(<MatchBox match={makeMatch()} onAdvance={vi.fn()} />)
    expect(screen.getByText('65%')).toBeTruthy()
    expect(screen.getByText('35%')).toBeTruthy()
  })
})
