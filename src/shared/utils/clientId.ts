const STORAGE_KEY = 'socrates_client_id'

/**
 * Get or create a persistent client identifier.
 * Uses localStorage for session persistence across page reloads.
 * This is NOT an auth token — just a stable peer identifier.
 */
export function getOrCreateClientId(): string {
  const existing = localStorage.getItem(STORAGE_KEY)
  if (existing) return existing

  const id = crypto.randomUUID()
  localStorage.setItem(STORAGE_KEY, id)
  return id
}
