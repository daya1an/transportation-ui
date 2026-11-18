import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/errors'
import ErrorPanel from './ErrorPanel'

describe('ErrorPanel', () => {
  it('shows the server message and a Try again button that calls back', async () => {
    const onRetry = vi.fn()
    render(<ErrorPanel error={new ApiError({ status: 502, code: 'query_failed', message: 'Data query failed' })} onRetry={onRetry} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load data')
    expect(screen.getByText('Data query failed')).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('explains a paused warehouse, with the wait hint and the log reference', () => {
    const error = new ApiError({
      status: 503, code: 'warehouse_unavailable', retryAfter: 30, requestId: '633e6ee5aaaabbbbccccddddeeeeffff',
      message: 'The Databricks SQL warehouse is not accepting connections right now.',
    })
    render(<ErrorPanel error={error} onRetry={() => {}} />)
    expect(screen.getByRole('heading')).toHaveTextContent('The data warehouse is not responding')
    expect(screen.getByText(/waiting about 30 seconds/i)).toBeInTheDocument()
    expect(screen.getByText('Reference 633e6ee5')).toBeInTheDocument() // matches the first 8 characters in the API log
  })

  it('has no button when there is nothing to retry, and survives a missing error', () => {
    render(<ErrorPanel error={undefined} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument()
  })
})
