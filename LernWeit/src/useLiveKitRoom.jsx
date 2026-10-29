import { useCallback, useEffect, useRef, useState } from 'react'

const CHAT_TOPIC = 'lernwelt-chat-v1'
const TYPING_EXPIRY_MS = 5000
const LOCAL_TYPING_IDLE_MS = 1800

function getParticipantState(participant, isLocal = false) {
  const microphone = participant.getTrackPublication('microphone')
  const camera = participant.getTrackPublication('camera')
  return {
    identity: participant.identity,
    name: participant.name || participant.identity,
    isLocal,
    isSpeaking: participant.isSpeaking,
    isMicrophoneEnabled: participant.isMicrophoneEnabled && !microphone?.isMuted,
    isCameraEnabled: participant.isCameraEnabled && !camera?.isMuted,
    audioTrack: microphone?.track,
    videoTrack: camera?.track,
  }
}

function getParticipants(room) {
  if (!room) return []
  return [
    getParticipantState(room.localParticipant, true),
    ...[...room.remoteParticipants.values()].map((participant) => getParticipantState(participant)),
  ]
}

function getMicrophoneError(error) {
  if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
    return 'Microphone access was denied. Allow microphone access in your browser settings, then try again.'
  }
  if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
    return 'No microphone was found. Connect a microphone and try again.'
  }
  if (error?.name === 'NotReadableError' || error?.name === 'TrackStartError') {
    return 'Your microphone could not be opened. It may be in use by another app.'
  }
  if (error?.name === 'SecurityError') {
    return 'Microphone access requires a secure connection (HTTPS or localhost).'
  }
  return error instanceof Error ? error.message : 'Could not start your microphone.'
}

export function useLiveKitRoom() {
  const roomRef = useRef(null)
  const generationRef = useRef(0)
  const typingTimersRef = useRef(new Map())
  const localTypingTimerRef = useRef(null)
  const typingSentRef = useRef(false)
  const [status, setStatus] = useState('disconnected')
  const [roomName, setRoomName] = useState('')
  const [identity, setIdentity] = useState('')
  const [participants, setParticipants] = useState([])
  const [typingParticipants, setTypingParticipants] = useState({})
  const [messages, setMessages] = useState([])
  const [error, setError] = useState('')
  const [audioPlaybackBlocked, setAudioPlaybackBlocked] = useState(false)

  const clearTyping = useCallback((participantIdentity) => {
    const timer = typingTimersRef.current.get(participantIdentity)
    if (timer) window.clearTimeout(timer)
    typingTimersRef.current.delete(participantIdentity)
    setTypingParticipants((current) => {
      if (!current[participantIdentity]) return current
      const next = { ...current }
      delete next[participantIdentity]
      return next
    })
  }, [])

  const clearAllTyping = useCallback(() => {
    for (const timer of typingTimersRef.current.values()) window.clearTimeout(timer)
    typingTimersRef.current.clear()
    if (localTypingTimerRef.current) window.clearTimeout(localTypingTimerRef.current)
    localTypingTimerRef.current = null
    setTypingParticipants({})
    typingSentRef.current = false
  }, [])

  const leaveRoom = useCallback(async () => {
    generationRef.current += 1
    const room = roomRef.current
    roomRef.current = null
    typingSentRef.current = false
    if (localTypingTimerRef.current) window.clearTimeout(localTypingTimerRef.current)
    localTypingTimerRef.current = null
    if (room && room.state === 'connected') {
      try {
        await room.localParticipant.publishData(
          new TextEncoder().encode(JSON.stringify({ type: 'typing', isTyping: false })),
          { reliable: true, topic: CHAT_TOPIC },
        )
      } catch {
        // The connection may already be closing; disconnect still clears the server-side presence.
      }
    }
    if (room) room.disconnect(true)
    clearAllTyping()
    setStatus('disconnected')
    setRoomName('')
    setIdentity('')
    setParticipants([])
    setMessages([])
    setError('')
    setAudioPlaybackBlocked(false)
  }, [clearAllTyping])

  const joinRoom = useCallback(async (requestedRoomName, participantName) => {
    if (!requestedRoomName) return
    if (roomRef.current) await leaveRoom()
    const generation = ++generationRef.current
    setStatus('connecting')
    setRoomName(requestedRoomName)
    setIdentity('')
    setParticipants([])
    setTypingParticipants({})
    setMessages([])
    setError('')
    setAudioPlaybackBlocked(false)

    let audioTrack
    let room
    try {
      const { ConnectionState, Room, RoomEvent, createLocalAudioTrack } = await import('livekit-client')
      audioTrack = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      })

      const response = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName: requestedRoomName, participantName }),
      })
      const tokenData = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(tokenData.error || `Could not get a room token (HTTP ${response.status}).`)
      if (!tokenData.token || !tokenData.serverUrl || !tokenData.identity) {
        throw new Error('The LiveKit token service returned an incomplete response.')
      }
      if (generation !== generationRef.current) {
        audioTrack.stop()
        return
      }

      room = new Room({ adaptiveStream: true, dynacast: true })
      roomRef.current = room
      setIdentity(tokenData.identity)

      const syncParticipants = () => {
        setParticipants(getParticipants(room))
      }
      const onDataReceived = (payload, participant, _kind, topic) => {
        if (topic !== CHAT_TOPIC || !participant) return
        let packet
        try {
          packet = JSON.parse(new TextDecoder().decode(payload))
        } catch {
          return
        }
        if (packet?.type === 'typing' && typeof packet.isTyping === 'boolean') {
          if (!packet.isTyping) {
            clearTyping(participant.identity)
            return
          }
          const timer = typingTimersRef.current.get(participant.identity)
          if (timer) window.clearTimeout(timer)
          setTypingParticipants((current) => ({
            ...current,
            [participant.identity]: participant.name || participant.identity,
          }))
          typingTimersRef.current.set(
            participant.identity,
            window.setTimeout(() => clearTyping(participant.identity), TYPING_EXPIRY_MS),
          )
        } else if (packet?.type === 'chat' && typeof packet.text === 'string') {
          const text = packet.text.trim().slice(0, 2000)
          if (!text) return
          clearTyping(participant.identity)
          setMessages((current) => [...current, {
            id: `${participant.identity}-${Date.now()}`,
            identity: participant.identity,
            name: participant.name || participant.identity,
            text,
            sentAt: new Date().toISOString(),
            mine: false,
          }])
        }
      }
      const onDisconnected = () => {
        if (generation !== generationRef.current) return
        roomRef.current = null
        clearAllTyping()
        setStatus('disconnected')
        setParticipants([])
        setIdentity('')
      }
      const onConnectionStateChanged = (state) => {
        if (generation !== generationRef.current) return
        if (state === ConnectionState.Connected) {
          setStatus('connected')
          syncParticipants()
        } else if (state === ConnectionState.Reconnecting || state === ConnectionState.SignalReconnecting) {
          setStatus('reconnecting')
        }
      }

      room
        .on(RoomEvent.ParticipantConnected, syncParticipants)
        .on(RoomEvent.ParticipantDisconnected, (participant) => {
          clearTyping(participant.identity)
          syncParticipants()
        })
        .on(RoomEvent.TrackSubscribed, syncParticipants)
        .on(RoomEvent.TrackUnsubscribed, syncParticipants)
        .on(RoomEvent.TrackMuted, syncParticipants)
        .on(RoomEvent.TrackUnmuted, syncParticipants)
        .on(RoomEvent.LocalTrackPublished, syncParticipants)
        .on(RoomEvent.LocalTrackUnpublished, syncParticipants)
        .on(RoomEvent.ActiveSpeakersChanged, syncParticipants)
        .on(RoomEvent.DataReceived, onDataReceived)
        .on(RoomEvent.ConnectionStateChanged, onConnectionStateChanged)
        .on(RoomEvent.Disconnected, onDisconnected)
        .on(RoomEvent.MediaDevicesError, (deviceError) => setError(getMicrophoneError(deviceError)))

      await room.connect(tokenData.serverUrl, tokenData.token)
      if (generation !== generationRef.current) {
        room.disconnect(true)
        audioTrack.stop()
        return
      }
      await room.localParticipant.publishTrack(audioTrack)
      if (generation !== generationRef.current) {
        room.disconnect(true)
        return
      }
      setStatus('connected')
      setParticipants(getParticipants(room))
    } catch (joinError) {
      if (audioTrack && roomRef.current !== room) audioTrack.stop()
      if (room && roomRef.current === room) {
        roomRef.current = null
        room.disconnect(true)
      }
      if (generation !== generationRef.current) return
      setStatus('error')
      setParticipants([])
      setIdentity('')
      setError(joinError?.name ? getMicrophoneError(joinError) : joinError.message || 'Could not join this room.')
    }
  }, [clearAllTyping, clearTyping, leaveRoom])

  const setTyping = useCallback(async function publishTyping(isTyping) {
    const room = roomRef.current
    if (!room || room.state !== 'connected') return
    if (localTypingTimerRef.current) window.clearTimeout(localTypingTimerRef.current)
    localTypingTimerRef.current = null
    if (isTyping && typingSentRef.current) {
      localTypingTimerRef.current = window.setTimeout(() => {
        localTypingTimerRef.current = null
        void publishTyping(false)
      }, LOCAL_TYPING_IDLE_MS)
      return
    }
    if (!isTyping && !typingSentRef.current) return
    typingSentRef.current = isTyping
    if (isTyping) {
      localTypingTimerRef.current = window.setTimeout(() => {
        localTypingTimerRef.current = null
        void publishTyping(false)
      }, LOCAL_TYPING_IDLE_MS)
    }
    try {
      await room.localParticipant.publishData(
        new TextEncoder().encode(JSON.stringify({ type: 'typing', isTyping })),
        { reliable: true, topic: CHAT_TOPIC },
      )
    } catch (publishError) {
      if (localTypingTimerRef.current) window.clearTimeout(localTypingTimerRef.current)
      localTypingTimerRef.current = null
      typingSentRef.current = false
      setError(publishError instanceof Error ? `Typing status could not be sent: ${publishError.message}` : 'Typing status could not be sent.')
    }
  }, [])

  const sendChat = useCallback(async (text) => {
    const normalizedText = text.trim().slice(0, 2000)
    const room = roomRef.current
    if (!normalizedText || !room || room.state !== ConnectionState.Connected) {
      throw new Error('Join live audio before sending a message to other participants.')
    }
    await room.localParticipant.publishData(
      new TextEncoder().encode(JSON.stringify({ type: 'chat', text: normalizedText })),
      { reliable: true, topic: CHAT_TOPIC },
    )
    await setTyping(false)
    const localParticipant = room.localParticipant
    setMessages((current) => [...current, {
      id: `${localParticipant.identity}-${Date.now()}`,
      identity: localParticipant.identity,
      name: localParticipant.name || localParticipant.identity,
      text: normalizedText,
      sentAt: new Date().toISOString(),
      mine: true,
    }])
  }, [setTyping])

  const setMicrophoneEnabled = useCallback(async (enabled) => {
    const room = roomRef.current
    if (!room || room.state !== 'connected') return
    try {
      await room.localParticipant.setMicrophoneEnabled(enabled)
      setError('')
      setParticipants(getParticipants(room))
    } catch (deviceError) {
      setError(getMicrophoneError(deviceError))
    }
  }, [])

  const setCameraEnabled = useCallback(async (enabled) => {
    const room = roomRef.current
    if (!room || room.state !== 'connected') return
    try {
      await room.localParticipant.setCameraEnabled(enabled)
      setError('')
      setParticipants(getParticipants(room))
    } catch (deviceError) {
      setError(deviceError?.name === 'NotFoundError'
        ? 'No camera was found. Connect a camera and try again.'
        : getMicrophoneError(deviceError))
    }
  }, [])

  const resumeAudioPlayback = useCallback(async () => {
    const room = roomRef.current
    if (!room) return
    try {
      await room.startAudio()
      setAudioPlaybackBlocked(false)
    } catch (playbackError) {
      setError(playbackError instanceof Error
        ? `Remote audio could not start: ${playbackError.message}`
        : 'Remote audio could not start. Check your browser audio settings.')
    }
  }, [])

  useEffect(() => () => {
    generationRef.current += 1
    for (const timer of typingTimersRef.current.values()) window.clearTimeout(timer)
    typingTimersRef.current.clear()
    roomRef.current?.disconnect(true)
    roomRef.current = null
  }, [])

  return {
    status,
    roomName,
    identity,
    participants,
    typingParticipants,
    messages,
    error,
    audioPlaybackBlocked,
    setAudioPlaybackBlocked,
    joinRoom,
    leaveRoom,
    setTyping,
    sendChat,
    setMicrophoneEnabled,
    setCameraEnabled,
    resumeAudioPlayback,
  }
}
