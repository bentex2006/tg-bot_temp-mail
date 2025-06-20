# Cloudflare Auto-Setup for B3X Mail

This setup will automatically handle all email routing through Cloudflare Workers - no manual webhook configuration needed!

## Step 1: Deploy the Worker

1. **Copy the worker code** from `cloudflare-worker.js`

2. **Go to Cloudflare Dashboard**:
   - Navigate to Workers & Pages
   - Click "Create" → "Worker"
   - Name it: `b3x-mail-router`

3. **Update Configuration** in the worker code:
   ```javascript
   const CONFIG = {
     SERVER_URL: 'https://your-repl-name.your-username.repl.co', // Your actual server
     WEBHOOK_PATH: '/api/webhook/email',
     WEBHOOK_SECRET: 'your-secret-key-123', // Optional security
     ALLOWED_DOMAINS: ['kalanaagpur.com'] // Add more domains here
   };
   ```

4. **Deploy the Worker**:
   - Paste the updated code
   - Click "Save and Deploy"
   - Note the worker URL: `https://b3x-mail-router.your-subdomain.workers.dev`

## Step 2: DNS Setup (Same as before)

Add these DNS records to `kalanaagpur.com`:

```
MX  @  route1.mx.cloudflare.net  10
MX  @  route2.mx.cloudflare.net  20  
MX  @  route3.mx.cloudflare.net  30
TXT @  "v=spf1 include:_spf.mx.cloudflare.net ~all"
TXT _dmarc  "v=DMARC1; p=quarantine; rua=mailto:dmarc@kalanaagpur.com"
```

## Step 3: Email Routing Setup

1. **Enable Email Routing**:
   - Cloudflare Dashboard → Email → Email Routing
   - Enable for kalanaagpur.com

2. **Create Catch-All Rule**:
   - Go to Routing Rules
   - Click "Catch-all address"
   - Action: "Send to a Worker"
   - Worker: Select `b3x-mail-router`
   - Save

## Step 4: Test the Setup

1. **Health Check**:
   Visit: `https://b3x-mail-router.your-subdomain.workers.dev/health`

2. **Send Test Email**:
   ```bash
   # Send to any address @kalanaagpur.com
   echo "Test message" | mail -s "Test Subject" test@kalanaagpur.com
   ```

3. **Check Logs**:
   - Cloudflare Dashboard → Workers → b3x-mail-router → Logs
   - Your server logs should show webhook calls

## Benefits of This Setup

✅ **Automatic routing** - No manual webhook configuration
✅ **Error handling** - Built-in retry logic for failed deliveries  
✅ **Security** - Optional HMAC signature verification
✅ **Monitoring** - Health checks and detailed logging
✅ **Scalable** - Handles high email volumes automatically
✅ **Multi-domain** - Easy to add new domains

## Worker Features

- **Health Check**: `GET /health` - Check service status
- **Dashboard**: `GET /` - View configuration and status
- **Email Processing**: Automatic via Cloudflare Email Routing
- **Error Handling**: Automatic retries on server errors
- **Security**: Optional webhook signature verification

## Configuration Options

```javascript
const CONFIG = {
  // Your B3X server URL (required)
  SERVER_URL: 'https://your-server.com',
  
  // Webhook endpoint (default: /api/webhook/email)
  WEBHOOK_PATH: '/api/webhook/email',
  
  // Security key for webhook verification (optional)
  WEBHOOK_SECRET: 'your-secret-key',
  
  // Domains to handle (add new domains here)
  ALLOWED_DOMAINS: ['kalanaagpur.com', 'newdomain.com']
};
```

## Adding New Domains

1. **Add to worker config**:
   ```javascript
   ALLOWED_DOMAINS: ['kalanaagpur.com', 'newdomain.com']
   ```

2. **Deploy updated worker**

3. **Setup DNS for new domain** (same MX/TXT records)

4. **Enable Email Routing** for new domain

5. **No other changes needed!** - Worker handles everything

## Monitoring & Debugging

- **Worker Logs**: Cloudflare Dashboard → Workers → Logs
- **Email Routing Logs**: Cloudflare Dashboard → Email → Analytics
- **Health Endpoint**: Check worker status anytime
- **Server Logs**: Monitor your B3X server for webhook calls

## Troubleshooting

**Emails not forwarding:**
1. Check worker logs for errors
2. Verify SERVER_URL is correct and accessible
3. Test health endpoint: `/health`
4. Check DNS propagation: `dig MX kalanaagpur.com`

**Worker errors:**
1. Check server is running and responding
2. Verify webhook endpoint: `/api/webhook/email`
3. Test manually: `curl -X POST your-server/api/webhook/email`

This setup eliminates all manual configuration - just deploy the worker and everything works automatically!