# How the Bot Knows Where to Upload Emails

## Email Flow Connection

```
Incoming Email → Cloudflare Email Routing → Cloudflare Worker → Your Server → Telegram Bot
```

## Configuration Steps

### 1. Get Your Server URL

When you deploy your B3X Mail project, you'll get a server URL:

**Replit:**
```
https://your-repl-name.your-username.repl.co
```

**Other Hosting:**
```
https://your-domain.com
```

### 2. Update Cloudflare Worker

In `cloudflare-worker.js`, update the `SERVER_URL`:

```javascript
const CONFIG = {
  // Update this with your actual server URL
  SERVER_URL: 'https://your-actual-server-url.com',
  WEBHOOK_PATH: '/api/webhook/email',
  WEBHOOK_SECRET: 'your-secret-key', // Optional
  ALLOWED_DOMAINS: ['yourdomain.com']
};
```

### 3. Deploy Cloudflare Worker

1. Go to Cloudflare Dashboard → Workers & Pages
2. Create new Worker named `b3x-mail-router`
3. Paste the updated worker code
4. Deploy the worker

### 4. Configure Email Routing

1. Cloudflare Dashboard → Email → Email Routing
2. Enable for your domain
3. Create catch-all rule:
   - Action: "Send to a Worker"
   - Worker: Select `b3x-mail-router`

## How It Works

1. **Email arrives** at `anything@yourdomain.com`
2. **Cloudflare Email Routing** catches it
3. **Cloudflare Worker** processes the email and sends it to your server:
   ```
   POST https://your-server-url.com/api/webhook/email
   ```
4. **Your server** receives the webhook and:
   - Finds the email address in database
   - Gets the user who owns that email
   - Forwards to their Telegram via bot
5. **Telegram bot** delivers email to user

## Example Configuration

If your server is at `https://myproject.example.repl.co`:

```javascript
// In cloudflare-worker.js
const CONFIG = {
  SERVER_URL: 'https://myproject.example.repl.co',
  WEBHOOK_PATH: '/api/webhook/email',
  ALLOWED_DOMAINS: ['myemail.com']
};
```

Then emails sent to `test@myemail.com` will be:
1. Caught by Cloudflare
2. Sent to: `https://myproject.example.repl.co/api/webhook/email`
3. Processed by your server
4. Forwarded to Telegram

## Testing the Connection

1. **Deploy your server** and note the URL
2. **Update worker** with your server URL
3. **Deploy worker** to Cloudflare
4. **Send test email** to your domain
5. **Check server logs** for webhook calls
6. **Verify** email appears in Telegram

The key is making sure the Cloudflare Worker has your correct server URL so it knows where to send the emails for processing.