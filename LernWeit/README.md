# LernWelt

LernWelt is a React 19 and Vite single-page language-learning experience. Its views are switched with React state in `src/App.jsx`; it does not use a routing library, authentication service, or database. A small Express API issues LiveKit room tokens. Shared visual styles and responsive layouts are in `src/App.css`, with the global reset in `src/index.css`.

## Run locally

```sh
npm install
npm run dev
```

Use `npm run lint` and `npm run build` to validate changes.

## Live audio/video development

The React/Vite interface connects to LiveKit for real audio, optional video, participant state, and in-room chat. Express issues short-lived tokens from the server; the API secret is never sent to the browser. The development server proxies `/api` to the loopback-only API on port 3001.

1. In the project root, copy the template without replacing any existing credentials: `cp -n server/.env.example server/.env`.
2. Set `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` in `server/.env` using the server credentials shown in your LiveKit project. Use the WebSocket server URL (usually `wss://...`), not an API key in the frontend.
3. Keep `LIVEKIT_ALLOW_GUEST_TOKENS=true` only for local testing. The server binds to `127.0.0.1`; guest token issuance is rate-limited but does not authenticate users. `.env` files are ignored by Git.
4. Open two terminals in this project directory:

   ```sh
   npm run dev:api
   ```

   ```sh
   npm run dev
   ```

5. Open the Vite URL (normally `http://localhost:5173`) in two separate browser profiles or on two devices. In each, open the same room and choose **Join live audio**. The microphone starts on join; the camera remains off until enabled. Use headphones to avoid feedback.

Use the **Leave audio** control to disconnect. If microphone access is denied or no device is available, the room displays an error instead of faking a connection. A missing or invalid LiveKit configuration is reported by the API.

Do not expose guest token issuance in production. Add application authentication and room authorization, production-grade rate limiting, and deployment-appropriate origin/network controls before public deployment. Revoke any credentials that have accidentally been exposed.

## Prototype boundaries

Room listings and their displayed counts, starting messages, teacher profiles, progress figures, and availability examples are sample data. The voice-room participant count is taken from the connected LiveKit room and is shown separately. When LiveKit is configured, audio/video tracks, participant/speaking state, live chat, and typing-start/stop events use the LiveKit room. When disconnected, chat stays local and is labeled demo-only. AI replies and friend invitations remain local prototypes. Teacher booking, user accounts, and safety reports are not connected. Sample values should not be presented as real learner activity, teacher reviews, prices, or schedules.

## Additional backend needed for production

- **Accounts and profiles:** authentication, authorization, persisted learner preferences, and consent controls.
- **Rooms and messaging:** server-verified membership and participant counts, durable chat if required, moderation/report workflows, and retention controls. The current LiveKit chat and typing indicators are ephemeral data-channel events.
- **Live audio/video:** a LiveKit project (managed or self-hosted), production authenticated token issuance, its WebRTC media infrastructure, and moderation controls.
- **Teachers and bookings:** a verified teacher catalogue with supported levels, specialties, genuine reviews, explicit prices, and live schedules, plus booking, payment, calendar, cancellation, and confirmation services.
- **AI assistance:** a server-side model integration for translation, language feedback, and prompts. Keep credentials server-side and disclose transcript handling and retention.
- **Learning progress:** persisted activity events and documented metric definitions. Keep self-reported or estimated values distinct from assessed proficiency.
