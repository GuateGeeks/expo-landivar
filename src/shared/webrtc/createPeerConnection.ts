import { RTC_CONFIG } from './rtcConfig.ts'

/** Create an RTCPeerConnection with default STUN config. */
export function createPeerConnection(
  config?: RTCConfiguration,
): RTCPeerConnection {
  return new RTCPeerConnection(config ?? RTC_CONFIG)
}
