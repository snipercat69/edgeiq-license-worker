# 🔑 EdgeIQ License Worker

**Cloudflare Worker for EdgeIQ license key verification and management.**

Stripe-powered license activation and verification via Cloudflare Workers — serverless, fast, globally distributed.

[![Project Stage](https://img.shields.io/badge/Stage-Beta-blue)](https://edgeiqlabs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-orange)](LICENSE)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange)](https://workers.cloudflare.com)

---

## What It Does

A serverless license verification endpoint built on Cloudflare Workers. Handles:
- Stripe webhook events (payment success → activate license)
- License key validation API
- Pro/Free tier enforcement

---

## Key Features

- **Stripe integration** — automatic license activation on payment
- **Serverless** — runs at the edge, globally distributed
- **KV storage** — durable license key state
- **Rate limiting** — built-in abuse protection
- **Webhook signature verification** — secure Stripe event handling

---

## Architecture

- **Runtime:** Cloudflare Workers (TypeScript)
- **Storage:** Cloudflare KV namespace
- **Payments:** Stripe webhook processing

---

## Quick Start

See [DEPLOY.md](DEPLOY.md) for full deployment instructions.

```bash
wrangler login
wrangler dev       # local development
wrangler deploy    # production deploy
```

---

## API Reference

```
POST /v1/verify
Body: {"key": "LICENSE_KEY"}
Response: {"valid": true, "tier": "pro"}

POST /webhook/stripe
Headers: Stripe-Signature
Body: Stripe event payload
```

---

## Pricing

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | Basic license check, Free tier |
| **Pro** | $19/mo | Stripe-powered activation |
| **Lifetime** | $80 one-time | Lifetime license verification |

---

*Part of EdgeIQ Labs — [edgeiqlabs.com](https://edgeiqlabs.com)*
