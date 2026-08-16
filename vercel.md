# Vercel protection

On the Hobby plan, use **Standard Protection** with **Vercel Authentication** to protect preview and generated deployment hostnames.

The production custom hostname is protected separately by Cloudflare Access. Vercel's **All Deployments** protection is not required for this setup.

## Environment variable

Set `APP_HOSTNAME` as a sensitive **Production** environment variable in Vercel. Do not commit its value to Git. The `/api/session` function rejects Vercel requests with another hostname and fails closed if the variable is missing.

After changing the variable, create a new production deployment.

## Verify

- An unauthenticated request to a generated Vercel deployment hostname returns `401 Protected deployment`.
- An unauthenticated request through the custom hostname is handled by Cloudflare Access.
- The app can call `/api/session` after authentication.
