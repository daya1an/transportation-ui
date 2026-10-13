/** Hands a blob to the browser as a file download. */
export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Turns a failed export into a sentence the user can act on. */
export function describeExportError(error) {
  if (error.status === 413) return error.message // the server explains how to narrow the range
  if (error.status === 429) return `Too many downloads. Try again in ${error.retryAfter ?? 60} seconds.`
  return error.message || 'The download failed.'
}
