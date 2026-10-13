import { useEffect, useState } from 'react'

/** Returns `value` after it has stopped changing for `delayMs`. Used to avoid a request per keystroke. */
export function useDebouncedValue(value, delayMs = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}
