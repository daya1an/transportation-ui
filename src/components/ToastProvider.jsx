import { createContext, useCallback, useContext, useMemo, useRef } from 'react'
import { Toast } from 'primereact/toast'

const ToastContext = createContext(null)

const DEFAULT_LIFE = 4000
const ERROR_LIFE = 6000

export function ToastProvider({ children }) {
  const toastRef = useRef(null)

  const show = useCallback((message) => {
    toastRef.current?.show({ life: DEFAULT_LIFE, ...message })
  }, [])

  const api = useMemo(
    () => ({
      show,
      success: (summary, detail, options) =>
        show({ severity: 'success', summary, detail, ...options }),
      info: (summary, detail, options) =>
        show({ severity: 'info', summary, detail, ...options }),
      warn: (summary, detail, options) =>
        show({ severity: 'warn', summary, detail, ...options }),
      error: (summary, detail, options) =>
        show({ severity: 'error', summary, detail, life: ERROR_LIFE, ...options }),
    }),
    [show]
  )

  return (
    <ToastContext.Provider value={api}>
      <Toast ref={toastRef} position="bottom-right" />
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used inside ToastProvider')
  }
  return context
}

export default ToastProvider