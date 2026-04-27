# EdgeIQ License Worker — Deployment Guide

Cloudflare Worker for EdgeIQ license key verification and management.

---

## Prerequisites

- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed
- Cloudflare account with Workers enabled
- `CF_API_TOKEN` with `Edit Cloudflare Workers` permission

---

## Local Development

```bash
# Install Wrangler if needed
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Run locally
wrangler dev
```

---

## Deploy

```bash
# Deploy to production
wrangler deploy

# Expected output:
# Worker URL: edgeiq-license-worker.<your-subdomain>.workers.dev
```

---

## Environment Secrets

```bash
# Set required secrets
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put LICENSE_VERIFY_ENDPOINT

# Set config vars
wrangler secret put CF_ACCOUNT_ID
```

---

## Custom Domain Binding

To bind a custom domain (e.g. `license.edgeiqlabs.com`):

1. Go to **Workers & Pages** → your worker → **Triggers** → **Custom Domains**
2. Add `license.edgeiqlabs.com`
3. Route DNS to Cloudflare and enable proxy

---

## Testing

```bash
# Test locally
wrangler dev

# Send test request
curl http://localhost:8787/v1/verify -X POST -H "Content-Type: application/json" -d '{"key":"test-key"}'
```

---

## Architecture

- **Runtime:** Cloudflare Workers (V8 isolate, TypeScript)
- **Storage:** Cloudflare KV for license key storage
- **Payments:** Stripe webhooks for license activation
- **Deployed URL:** `https://edgeiq-license-worker.<username>.workers.dev`

---

*Part of EdgeIQ Labs — [edgeiqlabs.com](https://edgeiqlabs.com)*
