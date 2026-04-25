/**
 * EdgeIQ License + Email Worker
 * 
 * Receives Stripe webhook → generates license key → emails customer via Resend
 * 
 * Deploy: npx wrangler deploy
 * Test: stripe listen --forward-to localhost:8787
 */

import { Resend } from 'resend';

interface Env {
  STRIPE_WEBHOOK_SECRET: string;
  RESEND_API_KEY: string;
}

// Product ID → product name mapping
// Update these with your actual Stripe price IDs from your dashboard
const PRICE_TO_PRODUCT: Record<string, { name: string; slug: string }> = {
  // === SCREENSHOT API ===
  'price_screenshot_pro_monthly': { name: 'screenshot API Pro', slug: 'screenshot_api' },
  
  // === SUB.ALERTS ===
  'price_sub_alerts_pro': { name: 'sub.alerts Pro', slug: 'sub_alerts' },
  
  // === LEAK.SCAN ===
  'price_leak_scan_pro': { name: 'leak.scan Pro', slug: 'leak_scan' },
  
  // === DOMAIN EXPIRY ===
  'price_domain_expiry_pro': { name: 'domain-expiry Pro', slug: 'domain_expiry' },
  
  // === DATA ENRICHMENT ===
  'price_data_enrichment_pro': { name: 'data-enrichment API Pro', slug: 'data_enrichment' },
  
  // === BUNDLE ===
  'price_bundle': { name: 'EdgeIQ All-Access Bundle', slug: 'bundle' },
};

// Pro tier monthly limits
const PRO_LIMITS: Record<string, number> = {
  screenshot_api: 2000,
  sub_alerts: 10,
  leak_scan: 100,
  domain_expiry: 20,
  data_enrichment: 1000,
  bundle: 999999,
};

// Free tier limits
const FREE_LIMITS: Record<string, number> = {
  screenshot_api: 100,
  sub_alerts: 1,
  leak_scan: 3,
  domain_expiry: 1,
  data_enrichment: 50,
  bundle: 0,
};

const FROM_EMAIL = 'EdgeIQ <licenses@edgeiqlabs.com>';
const SUPPORT_EMAIL = 'support@edgeiqlabs.com';
const COMPANY_NAME = 'EdgeIQ Labs';

/**
 * Generate a unique license key
 * Format: EDGEIQ-XXXX-XXXX-XXXX-XXXX
 */
function generateLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = [];
  for (let s = 0; s < 4; s++) {
    let segment = '';
    for (let i = 0; i < 4; i++) {
      segment += chars[Math.floor(Math.random() * chars.length)];
    }
    segments.push(segment);
  }
  return `EDGEIQ-${segments.join('-')}`;
}

/**
 * Verify Stripe webhook signature using Web Crypto API
 */
async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const parts = signature.split(',');
  const timestampPart = parts.find(p => p.startsWith('t='));
  const sigPart = parts.find(p => p.startsWith('v1='));
  
  if (!timestampPart || !sigPart) return false;
  
  const timestamp = timestampPart.slice(2);
  const signatureHex = sigPart.slice(3);
  
  const signedPayload = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();
  
  const keyData = encoder.encode(secret);
  const signingKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    signingKey,
    encoder.encode(signedPayload)
  );
  
  const signatureArray = new Uint8Array(signatureBuffer);
  const computedHex = Array.from(signatureArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Constant-time comparison
  if (computedHex.length !== signatureHex.length) return false;
  let result = 0;
  for (let i = 0; i < computedHex.length; i++) {
    result |= computedHex.charCodeAt(i) ^ signatureHex.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Send license email via Resend
 */
async function sendLicenseEmail(
  resend: Resend,
  toEmail: string,
  productName: string,
  licenseKey: string,
  slug: string
) {
  const proLimit = PRO_LIMITS[slug] || 0;
  const freeLimit = FREE_LIMITS[slug] || 0;

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [toEmail],
    subject: `Your ${productName} license key is ready 🔐`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #e0e0e0; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #111827; border-radius: 12px; padding: 40px; border: 1px solid #1f2937; }
    .logo { font-size: 24px; font-weight: bold; color: #60a5fa; margin-bottom: 30px; }
    .title { font-size: 22px; font-weight: 600; color: #ffffff; margin-bottom: 20px; }
    .subtitle { color: #9ca3af; font-size: 15px; margin-bottom: 24px; }
    .license-box { background: #1f2937; border-radius: 8px; padding: 16px 24px; margin: 24px 0; font-family: monospace; font-size: 16px; color: #60a5fa; letter-spacing: 2px; word-break: break-all; }
    .label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
    .features { margin: 20px 0; }
    .feature { padding: 8px 0; color: #d1d5db; font-size: 14px; }
    .feature strong { color: #10b981; }
    .code { background: #1f2937; padding: 8px 12px; border-radius: 4px; font-family: monospace; color: #fbbf24; font-size: 13px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #374151; font-size: 12px; color: #6b7280; }
    a { color: #60a5fa; text-decoration: none; }
    hr { border: none; border-top: 1px solid #374151; margin: 24px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🔐 EdgeIQ</div>
    <div class="title">Your license key is ready!</div>
    <div class="subtitle">
      Thanks for purchasing <strong style="color:#fff">${productName}</strong>. Here's everything you need to get started.
    </div>
    
    <div class="label">YOUR LICENSE KEY</div>
    <div class="license-box">${licenseKey}</div>
    
    <hr>
    
    <div class="title" style="font-size:16px;">What's included</div>
    <div class="features">
      <div class="feature">✅ <strong>${proLimit.toLocaleString()}</strong> API calls/month (your plan)</div>
      <div class="feature">✅ <strong>${freeLimit.toLocaleString()}</strong> free API calls/month (always free)</div>
      <div class="feature">✅ License valid for 1 month — auto-renews with payment</div>
      <div class="feature">✅ Email support: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></div>
    </div>
    
    <hr>
    
    <div class="title" style="font-size:16px;">Activate your license</div>
    <div class="subtitle" style="margin-bottom:12px;">Run this command with your tool:</div>
    <div class="code">python your-tool.py --register ${licenseKey}</div>
    
    <hr>
    
    <div class="subtitle">
      Questions? Reply to this email or visit <a href="https://edgeiqlabs.com">edgeiqlabs.com</a>
    </div>
    
    <div class="footer">
      © 2026 ${COMPANY_NAME} · <a href="https://edgeiqlabs.com">edgeiqlabs.com</a><br>
      This license was issued to ${toEmail}
    </div>
  </div>
</body>
</html>
    `.trim(),
    text: `
🔐 EdgeIQ License Key Ready

Thanks for purchasing ${productName}!

══════════════════════════════════════
YOUR LICENSE KEY
${licenseKey}
══════════════════════════════════════

INCLUDED WITH YOUR PURCHASE:
• ${proLimit.toLocaleString()} API calls/month (Pro tier)
• ${freeLimit.toLocaleString()} free API calls/month (always free)
• License valid for 1 month — auto-renews
• Email support: ${SUPPORT_EMAIL}

ACTIVATE YOUR LICENSE:
Run: python your-tool.py --register ${licenseKey}

---
Questions? Reply to this email or visit https://edgeiqlabs.com

© 2026 ${COMPANY_NAME} · edgeiqlabs.com
This license was issued to ${toEmail}
    `.trim(),
  });

  if (error) {
    console.error('Resend error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, stripe-signature',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const signature = request.headers.get('stripe-signature');
      if (!signature) {
        return new Response('Missing stripe-signature header', { status: 400 });
      }

      const payload = await request.text();
      let event: any;

      // Verify webhook signature
      if (env.STRIPE_WEBHOOK_SECRET) {
        const isValid = await verifyStripeSignature(payload, signature, env.STRIPE_WEBHOOK_SECRET);
        if (!isValid) {
          console.error('Invalid Stripe signature');
          return new Response('Invalid signature', { status: 400 });
        }
        event = JSON.parse(payload);
      } else {
        // Dev mode — skip verification
        console.warn('⚠️ STRIPE_WEBHOOK_SECRET not set — skipping verification');
        event = JSON.parse(payload);
      }

      // Handle checkout.session.completed
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as any;
        const customerEmail = session.customer_details?.email;
        const priceId = session.line_items?.data?.[0]?.price?.id;

        if (!customerEmail) {
          console.error('No customer email in session:', session.id);
          return new Response('Missing customer email', { status: 400 });
        }

        const productInfo = PRICE_TO_PRODUCT[priceId as string];
        if (!productInfo) {
          console.log('Unknown price ID, skipping:', priceId);
          return new Response(JSON.stringify({ skipped: true, reason: 'unknown_price' }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const licenseKey = generateLicenseKey();
        const resend = new Resend(env.RESEND_API_KEY);
        
        await sendLicenseEmail(resend, customerEmail, productInfo.name, licenseKey, productInfo.slug);

        console.log(`✅ License sent: ${licenseKey} → ${customerEmail} (${productInfo.name})`);

        return new Response(JSON.stringify({
          success: true,
          licenseKey,
          email: customerEmail,
          product: productInfo.name,
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Ignore other event types
      return new Response(JSON.stringify({ received: true }), {
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (error: any) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
