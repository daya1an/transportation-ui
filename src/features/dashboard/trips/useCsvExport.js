import { useCallback, useEffect, useRef, useState } from 'react'
import { downloadTripsCsv } from '../../../api/endpoints'
import { useToast } from '../../../components/ToastProvider'
import { describeExportError, saveBlob } from '../../../lib/download'

function fallbackFilename({ city = 'all', dateFrom, dateTo } = {}) {
  const parts = ['trips', city || 'all', dateFrom, dateTo].filter(Boolean)
  return `${parts.join('_')}.csv`
}

function normalizeErrorToast(described) {
  if (typeof described === 'string' && described.trim()) {
    return { summary: 'Could not download CSV', detail: described }
  }
  if (described && typeof described === 'object') {
    return {
      summary: described.summary || described.title || 'Could not download CSV',
      detail: described.detail || described.message || 'Please try again.',
    }
  }
  return { summary: 'Could not download CSV', detail: 'Please try again.' }
}

export function useCsvExport() {
  const toast = useToast()
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState(null)
  const controllerRef = useRef(null)

  useEffect(() => () => controllerRef.current?.abort(), [])

  const cancel = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
    setDownloading(false)
  }, [])

  const exportCsv = useCallback(
    async (filters) => {
      if (controllerRef.current) return false

      const controller = new AbortController()
      controllerRef.current = controller
      setDownloading(true)
      setError(null)

      try {
        const result = await downloadTripsCsv(filters, controller.signal)
        const blob = result?.blob ?? result
        const filename = result?.filename || fallbackFilename(filters)
        saveBlob(blob, filename)
        toast.success('Export downloaded', filename)
        return true
      } catch (err) {
        if (err?.name === 'AbortError' || controller.signal.aborted) {
          return false
        }
        const described = describeExportError(err)
        const { summary, detail } = normalizeErrorToast(described)
        setError(detail)
        toast.error(summary, detail)
        return false
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null
        }
        setDownloading(false)
      }
    },
    [toast]
  )

  return { exportCsv, cancel, downloading, error }
}

export default useCsvExport