# Lingua — live conversation translator

Lingua is a text-first mobile-browser prototype for placing a phone near a Romanian or Hungarian conversation and reading the gist in English or Dutch. It is silent by design: microphone input is sent for translation, but translated audio is never played through the device speaker.

## How it works

```text
                         short-lived client secret
  Browser  ---------------------------------------------->  /api/session
     |                                                       (Vercel function)
     |  POST /api/session                                    |
     |                                                       | server-only
     |                                                       | OPENAI_API_KEY
     |                                                       v
     |                                              OpenAI client-secrets API
     |
     | microphone audio                         ephemeral secret
     +---------------- WebRTC ---------------------------> OpenAI
     |                                                       gpt-realtime-translate
     |<------------- WebRTC data-channel transcript events -+
     |
     +--> rolling translated captions
          optional source transcript
          no audio playback and no persistence by default
```

The standard OpenAI API key stays on the server. The browser receives only a short-lived client secret and then connects directly to OpenAI over browser WebRTC; the server does not relay microphone audio.

## Repository layout

```text
translator/
├── api/session.js             Secure server endpoint for ephemeral secrets
├── public/
│   ├── manifest.webmanifest   PWA metadata
│   ├── sw.js                  Service worker and cache updates
│   └── icon.svg               App icon
├── src/
│   ├── main.js                UI, WebRTC session, captions, controls
│   └── style.css              Responsive mobile-first styling
├── index.html                 Browser entry point
├── vite.config.js             Vite plus local /api/session middleware
├── .env.example               Safe configuration template
└── package.json               Commands and dependencies
```

## Run locally

Requirements: Node.js and an OpenAI API key with access to the Realtime Translate endpoint.

```bash
npm install
cp .env.example .env.local
```

Edit `.env.local` and set the server-only key:

```dotenv
OPENAI_API_KEY=sk-...
```

Never commit `.env.local`. It is ignored by Git, and the key must not be prefixed with `VITE_`.

Start the development server:

```bash
npm run dev
```

Open the printed localhost URL in Chrome or another supported browser. Allow microphone access, choose the source and target languages, and press **Start listening**. While connected, **Pause** mutes microphone capture without ending the WebRTC session, and **Stop** ends the session. Captions scroll independently and do not jump while the user is reading older text.

Useful checks:

```bash
npm run check     # Syntax checks for the API and browser code
npm run build     # Production build
npm run preview   # Preview the production build locally
```

For phone testing, use the deployed HTTPS URL or another HTTPS-capable local tunnel. Browsers commonly block microphone access from a plain HTTP LAN address.

## Deploy to Vercel

Link this folder to the intended existing Vercel project, then configure the server variable in the Vercel dashboard or CLI:

```bash
vercel link
vercel env add OPENAI_API_KEY production
vercel --prod
```

The deployment must contain `OPENAI_API_KEY` as a server-side Production environment variable. Do not expose or log its value. If it is missing, `/api/session` returns a clear configuration error instead of attempting a session.

Set `APP_HOSTNAME` as a server-side Production environment variable to the protected custom hostname. The API rejects Vercel-hosted requests whose hostname does not match it; if the variable is missing in Vercel, the API fails closed.

## Privacy and behavior

- No transcript or audio is persisted by the app by default.
- Translated audio is intentionally disabled; there is no speaker-audio output.
- The app supports Romanian, Hungarian, or automatic source detection, with English or Dutch output.
- The rolling caption feed is bounded so it does not grow indefinitely.
