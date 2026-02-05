export function storageKey(roomId: string) {
  return `nc:participant:${roomId}`
}

export function getStoredParticipantId(roomId: string) {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(storageKey(roomId))
}

export function setStoredParticipantId(roomId: string, participantId: string) {
  window.localStorage.setItem(storageKey(roomId), participantId)
}

