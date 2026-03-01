import type { SignalMessage, Role } from './types.ts'

interface SignalingClientOptions {
  url: string
  onMessage?: (msg: SignalMessage) => void
  onOpen?: () => void
  onClose?: () => void
  onError?: (event: Event) => void
  /** Max reconnect attempts before giving up. Default: 5 */
  maxReconnectAttempts?: number
  /** Base delay in ms for exponential backoff. Default: 1000 */
  baseReconnectDelay?: number
}

export class SignalingClient {
  private ws: WebSocket | null = null
  private readonly url: string
  private reconnectAttempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private intentionallyClosed = false
  private readonly maxReconnectAttempts: number
  private readonly baseReconnectDelay: number

  onMessage: ((msg: SignalMessage) => void) | null
  onOpen: (() => void) | null
  onClose: (() => void) | null
  onError: ((event: Event) => void) | null

  constructor(options: SignalingClientOptions) {
    this.url = options.url
    this.onMessage = options.onMessage ?? null
    this.onOpen = options.onOpen ?? null
    this.onClose = options.onClose ?? null
    this.onError = options.onError ?? null
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 5
    this.baseReconnectDelay = options.baseReconnectDelay ?? 1000
  }

  connect(): void {
    this.intentionallyClosed = false
    this.ws = new WebSocket(this.url)

    this.ws.onopen = () => {
      this.reconnectAttempts = 0
      this.onOpen?.()
    }

    this.ws.onclose = () => {
      this.onClose?.()
      this.scheduleReconnect()
    }

    this.ws.onerror = (event) => {
      this.onError?.(event)
    }

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string) as SignalMessage
        this.onMessage?.(msg)
      } catch {
        // Ignore malformed messages
      }
    }
  }

  send(msg: SignalMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
    this.ws.send(JSON.stringify(msg))
  }

  close(): void {
    this.intentionallyClosed = true
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.ws?.close()
    this.ws = null
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  private scheduleReconnect(): void {
    if (this.intentionallyClosed) return
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return

    const delay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts)
    this.reconnectAttempts++

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, delay)
  }
}

/** Factory for a HELLO message. */
export function createHelloMessage(
  roomId: string,
  from: string,
  role: Role,
  displayName: string,
): SignalMessage {
  return { type: 'HELLO', roomId, from, payload: { role, displayName } }
}
