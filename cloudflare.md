# Cloudflare Access

Protect the app's custom hostname with Cloudflare Access.

## DNS

In Cloudflare DNS, ensure the app's hostname points to the Vercel CNAME shown in Vercel's domain settings and is **Proxied** (orange cloud).

## Access application

1. Open **Cloudflare Zero Trust → Access controls → Applications**.
2. Select **Create new application → Self-hosted**.
3. Add the app's public hostname and protect the entire hostname.
4. Set a session duration, for example **1 day**.
5. Add an **Allow** policy for your exact email address.
6. Enable Cloudflare login or **One-time PIN** as the identity provider.

Do not allow **Everyone**, and do not use One-time PIN without restricting the email address.

No Cloudflare Tunnel is needed; Vercel is the public origin.

## Verify

Open the site in an incognito window and confirm Cloudflare requests authentication. After signing in, confirm the app can still call `/api/session`.

Keep the DNS record proxied; a DNS-only record bypasses Access.
