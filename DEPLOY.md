# EdgeIQ License Worker — Deployment Guide

## Prerequisites
- Node.js 18+ installed
- `wrangler` CLI: `npm install -g wrangler`
- Cloudflare account with `edgeiqlabs.com` zone added
- Resend account (resend.com) — free signup
- Stripe account with webhook endpoint configured

## Step 1: Install Dependencies

```bash
cd /home/guy/.openclaw/workspace/apps/edgeiq-license-worker
npm install
```

## Step 2: Create KV Namespace

```bash
npx wrangler kv:namespace create "LICENSE_KV"
```

This outputs something like:
```
{ binding = "LICENSE_KV", id = "2b56....." }
```

Copy the `id` value and paste it into `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "LICENSE_KV"
id = "2b56...."   # ← paste your KV namespace ID here
```

## Step 3: Get Resend API Key

1. Go to https://resend.com and create an account
2. API Keys → Create API Key → copy the key (starts with `re_`)
3. Run: `npx wrangler secret put RESEND_API_KEY` → paste key

## Step 4: Configure Stripe Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: add your Worker URL (you'll get this after first deploy)
3. Select event: `checkout.session.completed`
4. Copy the webhook signing secret (starts with `whsec_`)
5. Run: `npx wrangler secret put STRIPE_WEBHOOK_SECRET` → paste secret

## Step 5: Update Price IDs

Edit `src/index.ts` — replace the `PRICE_TO_PRODUCT` entries with your actual Stripe price IDs:

```javascript
const PRICE_TO_PRODUCT: Record<string, { name: string; slug: string }> = {
  'price_xxxxxxxxxxxx': { name: 'screenshot API Pro', slug: 'screenshot_api' },
  'price_yyyyyyyyyyyy': { name: 'sub.alerts Pro', slug: 'sub_alerts' },
  // ... etc
};
```

Find price IDs: Stripe Dashboard → Products → click product → Prices tab → copy Price ID

## Step 6: Deploy

```bash
npx wrangler deploy
```

Copy the Worker URL it outputs — you'll need this for Stripe.

## Step 7: Configure Stripe Webhook URL

Back in Stripe Dashboard → Webhooks → your endpoint:
- URL: `https://edgeiq-license-worker.<your-account>.workers.dev`

## Step 8: Verify the Setup

Test locally with Stripe CLI:
```bash
stripe listen --forward-to localhost:8787
```

Trigger a test event:
```bash
stripe trigger checkout.session.completed
```

View live logs:
```bash
npx wrangler tail
```

## Viewing All Issued Licenses

The worker stores every license in Cloudflare KV. To view them:

**Via the worker itself** (GET request — add auth in production):
```
GET https://edgeiq-license-worker.<username>.workers.dev/
```
Returns: `{ total: N, records: [{key, email, product, issuedAt, ...}, ...] }`

**Via wrangler CLI:**
```bash
# List all license keys
npx wrangler kv:key list --namespace-id YOUR_KV_NAMESPACE_ID

# Read a specific license
npx wrangler kv:key get "license:EDGEIQ-XXXX-XXXX-XXXX-XXXX" --namespace-id YOUR_KV_NAMESPACE_ID
```

## Architecture

- **No database needed** — Cloudflare KV stores all license records (free: 1GB storage)
- **Stateless worker** — each webhook invocation is independent
- **Resend free tier** — 3,000 emails/day first month, then 100/day free
- **CF Workers free tier** — 100K requests/day

## Troubleshooting

**Email not sending?**
- Verify RESEND_API_KEY: `npx wrangler secret list`
- Check Resend dashboard for sent emails

**Webhook not hitting worker?**
- Check Stripe webhook delivery logs: Stripe Dashboard → Webhooks → endpoint → "Sent events"
- Run `npx wrangler tail` for live logs

**KV not storing?**
- Verify KV namespace ID is correctly set in wrangler.toml
- Make sure you created the KV namespace first: `npx wrangler kv:namespace create "LICENSE_KV"`

**Invalid signature?**
- Make sure STRIPE_WEBHOOK_SECRET matches exactly from Stripe webhook settings
