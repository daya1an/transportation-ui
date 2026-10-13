import { createSseTicket } from '../../api/endpoints'
import { API_BASE_URL } from '../../lib/config'

/** EventSource cannot send headers, so with auth on we trade the access token for a short-lived ticket. */
export async function resolveStreamUrl(authRequired) {
  const base = `${API_BASE_URL}/api/events`
  if (!authRequired) return base
  const { ticket } = await createSseTicket()
  return `${base}?ticket=${encodeURIComponent(ticket)}`
}
