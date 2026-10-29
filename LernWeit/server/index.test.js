import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:net'
import test from 'node:test'
import { TokenVerifier } from 'livekit-server-sdk'

async function getFreePort() {
  const server = createServer()
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const { port } = server.address()
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  return port
}

async function startTokenServer(t, guestTokens = true) {
  const port = await getFreePort()
  const child = spawn(process.execPath, ['server/index.js'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      API_HOST: '127.0.0.1',
      API_PORT: String(port),
      LIVEKIT_URL: 'wss://test.livekit.invalid',
      LIVEKIT_API_KEY: 'test-api-key',
      LIVEKIT_API_SECRET: 'test-api-secret-for-unit-test-only',
      LIVEKIT_ALLOW_GUEST_TOKENS: guestTokens ? 'true' : 'false',
    },
    stdio: 'ignore',
  })
  t.after(() => child.kill())

  const baseUrl = `http://127.0.0.1:${port}`
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Token server exited with code ${child.exitCode}`)
    try {
      const response = await fetch(`${baseUrl}/api/health`)
      if (response.ok) return baseUrl
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
  }
  throw new Error('Token server did not start.')
}

test('LiveKit token endpoint validates room names and issues a room-scoped guest token', async (t) => {
  const baseUrl = await startTokenServer(t)

  const invalidRoom = await fetch(`${baseUrl}/api/livekit/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomName: '../other-room', participantName: 'Learner' }),
  })
  assert.equal(invalidRoom.status, 400)

  const response = await fetch(`${baseUrl}/api/livekit/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomName: 'lernwelt-german', participantName: 'Learner One' }),
  })
  assert.equal(response.status, 200)
  const result = await response.json()
  assert.equal(result.roomName, 'lernwelt-german')
  assert.match(result.identity, /^guest-/)
  assert.equal(result.serverUrl, 'wss://test.livekit.invalid')

  const claims = await new TokenVerifier('test-api-key', 'test-api-secret-for-unit-test-only').verify(result.token)
  assert.equal(claims.name, 'Learner One')
  assert.deepEqual(claims.video, {
    roomJoin: true,
    room: 'lernwelt-german',
    canPublishSources: ['microphone', 'camera'],
    canSubscribe: true,
    canPublishData: true,
  })
  assert.ok(claims.exp - claims.nbf <= 600)
  assert.ok(claims.exp - claims.nbf > 0)

  const secondResponse = await fetch(`${baseUrl}/api/livekit/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomName: 'lernwelt-german', participantName: 'Learner One' }),
  })
  assert.equal(secondResponse.status, 200)
  const secondResult = await secondResponse.json()
  assert.notEqual(secondResult.identity, result.identity)
})

test('LiveKit guest token endpoint refuses requests when guest access is disabled', async (t) => {
  const baseUrl = await startTokenServer(t, false)
  const response = await fetch(`${baseUrl}/api/livekit/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomName: 'lernwelt-german', participantName: 'Learner One' }),
  })
  assert.equal(response.status, 403)
})

test('LiveKit token endpoint rejects malformed JSON and requests that exceed the body limit', async (t) => {
  const baseUrl = await startTokenServer(t)

  const malformedResponse = await fetch(`${baseUrl}/api/livekit/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"roomName":',
  })
  assert.equal(malformedResponse.status, 400)
  assert.deepEqual(await malformedResponse.json(), { error: 'Request body must be valid JSON.' })

  const oversizedResponse = await fetch(`${baseUrl}/api/livekit/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomName: 'room', participantName: 'a'.repeat(5000) }),
  })
  assert.equal(oversizedResponse.status, 413)
  assert.deepEqual(await oversizedResponse.json(), { error: 'Request body is too large.' })
})
