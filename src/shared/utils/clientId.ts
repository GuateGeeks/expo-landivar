const STORAGE_KEY_PREFIX = 'socrates_client_id'

/**
 * Get or create a persistent client identifier scoped by page role.
 * Uses localStorage for session persistence across page reloads.
 * This is NOT an auth token — just a stable peer identifier.
 *
 * Each page role (publisher, viewer, etc.) gets its own ID so that
 * multiple MPA pages open in the same browser don't collide.
 */
export function getOrCreateClientId(role: string = 'default'): string {
  const key = `${STORAGE_KEY_PREFIX}_${role}`
  const existing = localStorage.getItem(key)
  if (existing) return existing

  const id = crypto.randomUUID()
  localStorage.setItem(key, id)
  return id
}
