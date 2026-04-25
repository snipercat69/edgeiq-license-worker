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

## Step 2: Get Resend API Key

1. Go to https://resend.com and create an account
2. Go to API Keys → Create API Key
3. Copy the key (starts with `re_`)
4. Run: `npx wrangler secret put RESEND_API_KEY`
   - Paste your Resend API key when prompted

## Step 3: Configure Stripe Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://edgeiq-license-worker.<your-subdomain>.workers.dev/stripe-webhook`
   - Or use a custom route like `https://api.edgeiqlabs.com/stripe-webhook`
3. Select events: `checkout.session.completed`
4. Copy the webhook signing secret (starts with `whsec_`)
5. Run: `npx wrangler secret put STRIPE_WEBHOOK_SECRET`
   - Paste your Stripe webhook secret when prompted

## Step 4: Update Price IDs

Edit `src/index.ts` and replace the price IDs in `getProductSlug()` with your actual Stripe price IDs:

```javascript
// Get these from your Stripe Dashboard → Products → Price → ID
const priceToProduct: Record<string, string> = {
  'price_xxxxxxxxxxxx': 'screenshot_api',
  'price_yyyyyyyyyyyy': 'sub_alerts',
  // ... etc
};
```

To find price IDs: Stripe Dashboard → Products → click product → Prices tab → copy Price ID

## Step 5: Deploy

```bash
cd /home/guy/.openclaw/workspace/apps/edgeiq-license-worker
npx wrangler deploy
```

This outputs your Worker URL, e.g.:
`https://edgeiq-license-worker.<username>.workers.dev`

## Step 6: Configure Stripe Webhook URL

1. Go to https://dashboard.stripe.com/webhooks
2. Click the endpoint you created
3. Update the URL to use your deployed Worker URL:
   `https://edgeiq-license-worker.<username>.workers.dev`

## Step 7: Verify the Setup

Test locally with Stripe CLI:
```bash
stripe listen --forward-to localhost:8787
# Then trigger a test checkout in Stripe dashboard
```

Deploy a test event:
```bash
stripe trigger checkout.session.completed
```

Check worker logs:
```bash
npx wrangler tail
```

## Troubleshooting

**Email not sending?**
- Verify RESEND_API_KEY is set: `npx wrangler secret list`
- Check Resend dashboard for sent emails
- Verify the API key has permission to send

**Webhook not hitting worker?**
- Check Stripe webhook delivery logs in Stripe Dashboard → Webhooks → endpoint → "Sent events"
- Verify the worker URL is accessible from the internet
- Check `npx wrangler tail` for incoming requests

**Invalid signature error?**
- Make sure STRIPE_WEBHOOK_SECRET is set correctly
- The secret should match exactly from Stripe webhook settings

## Architecture Notes

- **No database needed**: License keys are stored in Stripe payment metadata and emailed to customers
- **Stateless**: Each webhook invocation is independent
- **Resend free tier**: 3,000 emails/day first month, then 100/day free
- **CF Workers free tier**: 100K requests/day

## Updating the Worker

Edit `src/index.ts`, then redeploy:
```bash
npx wrangler deploy
```

## Monitoring

View live logs:
```bash
npx wrangler tail
```

View all deployments:
```bash
npx wrangler deployments list
```
