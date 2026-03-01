/**
 * Minimal WebSocket signaling server for WebRTC peer connection negotiation.
 *
 * Responsibilities:
 * - Maintain rooms with publisher/viewer registrations
 * - Route SDP offers/answers and ICE candidates between peers
 * - Notify viewers when publishers join/leave
 *
 * Usage: node --experimental-strip-types signaling.ts
 * Env:   PORT (default 8080)
 */

import { WebSocketServer } from 'ws'
import type { WebSocket } from 'ws'

const PORT = parseInt(process.env.PORT ?? '8080', 10)

type Role = 'publisher' | 'viewer'

interface Client {
  ws: WebSocket
  clientId: string
  roomId: string
  role: Role
  displayName: string
}

interface SignalMessage {
  type: string
  roomId: string
  from: string
  to?: string
  payload: Record<string, unknown>
}

// Room -> clientId -> Client
const rooms = new Map<string, Map<string, Client>>()

function getRoom(roomId: string): Map<string, Client> {
  let room = rooms.get(roomId)
  if (!room) {
    room = new Map()
    rooms.set(roomId, room)
  }
  return room
}

function getPublishers(room: Map<string, Client>): Client[] {
  return Array.from(room.values()).filter((c) => c.role === 'publisher')
}

function broadcast(room: Map<string, Client>, msg: SignalMessage, excludeId?: string): void {
  const data = JSON.stringify(msg)
  for (const client of room.values()) {
    if (client.clientId !== excludeId && client.ws.readyState === 1) {
      client.ws.send(data)
    }
  }
}

function sendTo(room: Map<string, Client>, targetId: string, msg: SignalMessage): void {
  const target = room.get(targetId)
  if (target && target.ws.readyState === 1) {
    target.ws.send(JSON.stringify(msg))
  }
}

const wss = new WebSocketServer({ port: PORT, path: '/ws' })

console.log(`[signaling] Listening on ws://localhost:${PORT}/ws`)

wss.on('connection', (ws: WebSocket) => {
  let client: Client | null = null

  ws.on('message', (raw: Buffer) => {
    let msg: SignalMessage
    try {
      msg = JSON.parse(raw.toString()) as SignalMessage
    } catch {
      return
    }

    const { type, roomId, from } = msg

    if (type === 'HELLO') {
      const payload = msg.payload as { role: Role; displayName: string }
      const room = getRoom(roomId)

      // Register client
      client = { ws, clientId: from, roomId, role: payload.role, displayName: payload.displayName }
      room.set(from, client)

      console.log(`[signaling] ${payload.role} "${payload.displayName}" (${from.slice(0, 8)}…) joined room "${roomId}" [${room.size} clients]`)

      if (payload.role === 'viewer') {
        // Send current publisher list to the new viewer
        const publishers = getPublishers(room).map((p) => ({
          clientId: p.clientId,
          displayName: p.displayName,
          ts: Date.now(),
        }))
        sendTo(room, from, {
          type: 'PUBLISHER_LIST',
          roomId,
          from: 'server',
          payload: { publishers },
        })
      }

      if (payload.role === 'publisher') {
        // Notify all clients about the new publisher
        broadcast(room, {
          type: 'PUBLISHER_JOIN',
          roomId,
          from: 'server',
          payload: {
            clientId: from,
            displayName: payload.displayName,
            ts: Date.now(),
          },
        }, from)
      }

      return
    }

    // Directed messages: route to target
    if (msg.to) {
      const room = rooms.get(roomId)
      if (room) sendTo(room, msg.to, msg)
      return
    }

    // Broadcast messages to room
    const room = rooms.get(roomId)
    if (room) broadcast(room, msg, from)
  })

  ws.on('close', () => {
    if (!client) return

    const room = rooms.get(client.roomId)
    if (!room) return

    room.delete(client.clientId)
    console.log(`[signaling] ${client.role} "${client.displayName}" (${client.clientId.slice(0, 8)}…) left room "${client.roomId}" [${room.size} clients]`)

    if (client.role === 'publisher') {
      broadcast(room, {
        type: 'PUBLISHER_LEAVE',
        roomId: client.roomId,
        from: 'server',
        payload: {
          clientId: client.clientId,
          ts: Date.now(),
        },
      })
    }

    // Clean up empty rooms
    if (room.size === 0) {
      rooms.delete(client.roomId)
    }
  })

  ws.on('error', (err) => {
    console.error('[signaling] WebSocket error:', err.message)
  })
})
