import { randomUUID } from 'node:crypto'
import express from 'express'
import { AccessToken, TrackSource } from 'livekit-server-sdk'

const port = Number(process.env.API_PORT || 3001)
const host = process.env.API_HOST || '127.0.0.1'
const maxBodyBytes = '4kb'
const tokenRequests = new Map()
const tokenWindowMs = 60_000
const maxTokensPerWindow = 20
const app = express()

app.disable('x-powered-by')
app.use(express.json({ limit: maxBodyBytes, strict: true }))

app.get('/api/health', (_request, response) => {
  response.set('Cache-Control', 'no-store').json({ ok: true })
})

app.post('/api/livekit/token', async (request, response) => {
  if (process.env.LIVEKIT_ALLOW_GUEST_TOKENS !== 'true') {
    response.status(403).json({
      error: 'Guest access tokens are disabled. Configure authenticated token issuance before enabling this endpoint.',
    })
    return
  }

  const now = Date.now()
  const clientIp = request.ip || request.socket.remoteAddress || 'unknown'
  if (tokenRequests.size > 1000) {
    for (const [ip, timestamps] of tokenRequests) {
      if (!timestamps.some((timestamp) => now - timestamp < tokenWindowMs)) tokenRequests.delete(ip)
    }
    if (tokenRequests.size > 1000) tokenRequests.delete(tokenRequests.keys().next().value)
  }
  const recentRequests = (tokenRequests.get(clientIp) || []).filter((timestamp) => now - timestamp < tokenWindowMs)
  if (recentRequests.length >= maxTokensPerWindow) {
    response.status(429).json({ error: 'Too many token requests. Wait a minute before trying again.' })
    return
  }
  recentRequests.push(now)
  tokenRequests.set(clientIp, recentRequests)

  if (!request.is('application/json')) {
    response.status(415).json({ error: 'Content-Type must be application/json.' })
    return
  }

  const roomName = typeof request.body?.roomName === 'string' ? request.body.roomName.trim() : ''
  const participantName = typeof request.body?.participantName === 'string' ? request.body.participantName.trim() : ''
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,62}$/.test(roomName)) {
    response.status(400).json({ error: 'Room name must be 1–63 letters, numbers, underscores, or hyphens.' })
    return
  }
  const hasControlCharacters = [...participantName].some((character) => {
    const codePoint = character.codePointAt(0)
    return codePoint < 32 || codePoint === 127
  })
  if (!participantName || participantName.length > 60 || hasControlCharacters) {
    response.status(400).json({ error: 'Participant name must be 1–60 printable characters.' })
    return
  }

  const { LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL } = process.env
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
    response.status(503).json({
      error: 'LiveKit is not configured. Set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET in server/.env.',
    })
    return
  }
  if (!/^wss?:\/\/[^/]+$/i.test(LIVEKIT_URL)) {
    response.status(500).json({ error: 'LIVEKIT_URL must be a ws:// or wss:// server URL.' })
    return
  }

  try {
    const identity = `guest-${randomUUID()}`
    const accessToken = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity,
      name: participantName,
      ttl: '10m',
    })
    accessToken.addGrant({
      roomJoin: true,
      room: roomName,
      canPublishSources: [TrackSource.MICROPHONE, TrackSource.CAMERA],
      canSubscribe: true,
      canPublishData: true,
    })
    response.set('Cache-Control', 'no-store').json({
      token: await accessToken.toJwt(),
      serverUrl: LIVEKIT_URL,
      identity,
      roomName,
    })
  } catch (error) {
    console.error('Could not create a LiveKit access token:', error)
    response.status(500).json({ error: 'Could not create a LiveKit access token.' })
  }
})

app.use((error, _request, response, _next) => {
  if (response.headersSent) return
  if (error?.type === 'entity.too.large') {
    response.status(413).json({ error: 'Request body is too large.' })
    return
  }
  if (error instanceof SyntaxError && 'body' in error) {
    response.status(400).json({ error: 'Request body must be valid JSON.' })
    return
  }
  console.error('LiveKit token API request failed:', error)
  response.status(500).json({ error: 'The LiveKit token service encountered an unexpected error.' })
})

app.listen(port, host, () => {
  console.log(`LernWelt LiveKit token API listening at http://${host}:${port}`)
})
