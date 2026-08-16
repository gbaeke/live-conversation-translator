# Agent notes

## What is this?

Lingua is a text-only mobile translator for nearby Romanian or Hungarian conversation. The browser sends microphone audio directly to OpenAI over WebRTC and renders English or Dutch captions. No translated audio is played and no transcript is persisted by default.

## Deploy to Vercel

Git integration is already configured for the existing Vercel project. Push the desired commit to the tracked branch:

```bash
git push origin master
```

Vercel builds and deploys automatically. The connected custom domain is configured in Vercel and must be kept in server-side environment variables rather than committed to the repository.

Keep `OPENAI_API_KEY` configured only as a server-side Vercel environment variable. Never commit `.env.local` or expose the key to browser code.
