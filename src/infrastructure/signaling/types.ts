export type Role = 'publisher' | 'viewer'

/** Base shape shared by all signaling messages. */
interface SignalMessageBase {
  roomId: string
  from: string
}

/** Directed messages include a target peer. */
interface DirectedMessage extends SignalMessageBase {
  to: string
}

export interface HelloMessage extends SignalMessageBase {
  type: 'HELLO'
  payload: { role: Role; displayName: string }
}

export interface PublisherInfo {
  clientId: string
  displayName: string
  ts: number
}

export interface PublisherListMessage extends SignalMessageBase {
  type: 'PUBLISHER_LIST'
  payload: { publishers: PublisherInfo[] }
}

export interface PublisherJoinMessage extends SignalMessageBase {
  type: 'PUBLISHER_JOIN'
  payload: PublisherInfo
}

export interface PublisherLeaveMessage extends SignalMessageBase {
  type: 'PUBLISHER_LEAVE'
  payload: { clientId: string; ts: number }
}

export interface SdpOfferMessage extends DirectedMessage {
  type: 'SDP_OFFER'
  payload: { sdp: string }
}

export interface SdpAnswerMessage extends DirectedMessage {
  type: 'SDP_ANSWER'
  payload: { sdp: string }
}

export interface IceCandidateMessage extends DirectedMessage {
  type: 'ICE_CANDIDATE'
  payload: { candidate: RTCIceCandidateInit }
}

export interface ErrorMessage extends SignalMessageBase {
  type: 'ERROR'
  payload: { message: string }
}

/** Discriminated union of all signaling messages. */
export type SignalMessage =
  | HelloMessage
  | PublisherListMessage
  | PublisherJoinMessage
  | PublisherLeaveMessage
  | SdpOfferMessage
  | SdpAnswerMessage
  | IceCandidateMessage
  | ErrorMessage

/** Message types that are directed to a specific peer. */
export type DirectedSignalMessage =
  | SdpOfferMessage
  | SdpAnswerMessage
  | IceCandidateMessage
