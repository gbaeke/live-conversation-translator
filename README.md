# Lingua — live conversation translator

Mobile-browser prototype for placing a phone near Romanian or Hungarian conversation and reading live English or Dutch translation captions.

## Local development

```bash
npm install
cp .env.example .env.local
# Add OPENAI_API_KEY to .env.local (the app still runs without it, and explains the missing configuration)
npm run dev
```

The local Vite server exposes the same `/api/session` contract as the Vercel function, so browser testing works before deployment. The browser connects directly to OpenAI over WebRTC. `api/session.js` creates the short-lived Realtime Translate client secret with the server-only `OPENAI_API_KEY`; the standard key is never sent to the browser.

## Deploy to Vercel

```bash
npm install
vercel --yes
vercel env add OPENAI_API_KEY production
vercel --prod
```

When prompted for the secret, paste the key into Vercel’s secure environment-variable flow. The app intentionally shows a clear configuration message if `OPENAI_API_KEY` is missing.
