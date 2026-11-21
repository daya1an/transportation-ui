import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { EmptyState } from './EmptyState'

afterEach(cleanup)

describe('EmptyState', () => {
  it('renders title, description, and default icon', () => {
    const { container } = render(
      <EmptyState
        title="No trips found"
        description="Try widening the date range or clearing your search."
      />
    )

    expect(screen.getByRole('status')).toBeTruthy()
    expect(screen.getByText('No trips found')).toBeTruthy()
    expect(
      screen.getByText('Try widening the date range or clearing your search.')
    ).toBeTruthy()
    expect(container.querySelector('.pi-inbox')).toBeTruthy()
  })

  it('supports a custom icon and compact sizing', () => {
    const { container } = render(
      <EmptyState icon="pi-table" title="No tables available" compact />
    )

    expect(container.querySelector('.pi-table')).toBeTruthy()
    expect(screen.getByRole('status').className).toContain('min-h-36')
  })

  it('renders an action button and calls onAction when clicked', () => {
    const onAction = vi.fn()
    render(
      <EmptyState
        title="No matching rows"
        actionLabel="Reset filters"
        onAction={onAction}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }))
    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it('omits the action button when actionLabel or onAction is missing', () => {
    render(<EmptyState title="No data" actionLabel="Reset filters" />)
    expect(screen.queryByRole('button')).toBeNull()
  })
})