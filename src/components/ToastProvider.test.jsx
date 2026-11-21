import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ToastProvider, useToast } from './ToastProvider'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function DemoControls() {
  const toast = useToast()
  return (
    <div>
      <button type="button" onClick={() => toast.success('Export ready', 'Saved trips.csv')}>
        Success
      </button>
      <button type="button" onClick={() => toast.error('Export failed', 'Too many rows')}>
        Error
      </button>
      <button type="button" onClick={() => toast.warn('Export limit', 'Narrow the date range')}>
        Warn
      </button>
    </div>
  )
}

function OutsideConsumer() {
  useToast()
  return null
}

describe('ToastProvider', () => {
  it('displays success and error toast messages', () => {
    render(
      <ToastProvider>
        <DemoControls />
      </ToastProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Success' }))
    expect(screen.getByText('Export ready')).toBeTruthy()
    expect(screen.getByText('Saved trips.csv')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Error' }))
    expect(screen.getByText('Export failed')).toBeTruthy()
    expect(screen.getByText('Too many rows')).toBeTruthy()
  })

  it('displays warning toast messages', () => {
    render(
      <ToastProvider>
        <DemoControls />
      </ToastProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Warn' }))
    expect(screen.getByText('Export limit')).toBeTruthy()
    expect(screen.getByText('Narrow the date range')).toBeTruthy()
  })

  it('throws when useToast is called outside ToastProvider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<OutsideConsumer />)).toThrow(
      'useToast must be used inside ToastProvider'
    )
  })
})