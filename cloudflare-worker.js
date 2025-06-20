/**
 * Cloudflare Worker for B3X Mail - Automatic Email Routing
 * Deploy this to Cloudflare Workers and configure email routing to use this worker
 */

// Configuration - Update these with your actual values
const CONFIG = {
  // Your B3X Mail server URL (update this)
  SERVER_URL: 'https://your-repl-name.your-username.repl.co',
  
  // Webhook endpoint
  WEBHOOK_PATH: '/api/webhook/email',
  
  // Security (optional) - add a secret for webhook verification
  WEBHOOK_SECRET: 'your-webhook-secret-key',
  
  // Allowed domains for email forwarding
  ALLOWED_DOMAINS: ['kalanaagpur.com']
};

export default {
  async email(message, env, ctx) {
    try {
      console.log(`[WORKER] Processing email: ${message.from} -> ${message.to}`);
      
      // Extract domain from recipient email
      const recipientDomain = message.to.split('@')[1];
      
      // Check if domain is allowed
      if (!CONFIG.ALLOWED_DOMAINS.includes(recipientDomain)) {
        console.log(`[WORKER] Domain not allowed: ${recipientDomain}`);
        return; // Silently drop emails for unauthorized domains
      }
      
      // Extract email content
      const emailData = {
        to: message.to,
        from: message.from,
        subject: message.headers.get("Subject") || "(No Subject)",
        text: await message.text(),
        html: await message.html() || "",
        timestamp: new Date().toISOString(),
        messageId: message.headers.get("Message-ID") || `generated-${Date.now()}`,
        // Add security header if configured
        ...(CONFIG.WEBHOOK_SECRET && { 
          signature: await this.generateSignature(JSON.stringify({
            to: message.to,
            from: message.from,
            subject: message.headers.get("Subject") || "(No Subject)"
          }), CONFIG.WEBHOOK_SECRET)
        })
      };

      // Forward to B3X Mail server
      const webhookUrl = `${CONFIG.SERVER_URL}${CONFIG.WEBHOOK_PATH}`;
      
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Cloudflare-Worker-B3X-Mail/1.0",
          // Add custom headers for identification
          "X-Forwarded-By": "cloudflare-worker",
          "X-Original-Domain": recipientDomain
        },
        body: JSON.stringify(emailData)
      });

      if (response.ok) {
        console.log(`[WORKER] Email forwarded successfully: ${message.to}`);
        
        // Log successful forwarding (optional)
        const result = await response.json();
        console.log(`[WORKER] Server response:`, result);
      } else {
        console.error(`[WORKER] Failed to forward email: ${response.status} ${response.statusText}`);
        
        // Retry logic for failed requests
        if (response.status >= 500) {
          console.log(`[WORKER] Scheduling retry for email: ${message.to}`);
          // Cloudflare will automatically retry on 5xx errors
          throw new Error(`Server error: ${response.status}`);
        }
      }
    } catch (error) {
      console.error(`[WORKER] Error processing email:`, error);
      
      // For critical errors, you might want to send to a fallback
      // await this.sendToFallback(message, error);
    }
  },

  // Generate HMAC signature for webhook security (optional)
  async generateSignature(payload, secret) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );
    
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
};

// Optional: Handle HTTP requests for health checks
export async function fetch(request, env) {
  const url = new URL(request.url);
  
  if (url.pathname === '/health') {
    return new Response(JSON.stringify({
      status: 'healthy',
      service: 'B3X Mail Email Router',
      timestamp: new Date().toISOString(),
      configuration: {
        serverUrl: CONFIG.SERVER_URL,
        allowedDomains: CONFIG.ALLOWED_DOMAINS,
        hasSecret: !!CONFIG.WEBHOOK_SECRET
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (url.pathname === '/') {
    return new Response(`
<!DOCTYPE html>
<html>
<head>
    <title>B3X Mail Email Router</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .status { background: #e8f5e8; padding: 15px; border-radius: 5px; }
        .config { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 20px; }
        code { background: #f0f0f0; padding: 2px 5px; border-radius: 3px; }
    </style>
</head>
<body>
    <h1>🤖 B3X Mail Email Router</h1>
    <div class="status">
        <h3>✅ Service Status: Active</h3>
        <p>This Cloudflare Worker is routing emails for B3X Mail service.</p>
    </div>
    
    <div class="config">
        <h3>Configuration</h3>
        <p><strong>Server URL:</strong> <code>${CONFIG.SERVER_URL}</code></p>
        <p><strong>Allowed Domains:</strong> <code>${CONFIG.ALLOWED_DOMAINS.join(', ')}</code></p>
        <p><strong>Security:</strong> ${CONFIG.WEBHOOK_SECRET ? '🔒 Enabled' : '⚠️ Disabled'}</p>
    </div>
    
    <h3>Setup Instructions</h3>
    <ol>
        <li>Update <code>SERVER_URL</code> in the worker code</li>
        <li>Configure Cloudflare Email Routing to use this worker</li>
        <li>Add domains to <code>ALLOWED_DOMAINS</code> array</li>
        <li>Test with health check: <code>/health</code></li>
    </ol>
    
    <p><small>Powered by Cloudflare Workers | B3X Mail Service</small></p>
</body>
</html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
  
  return new Response('Not Found', { status: 404 });
}