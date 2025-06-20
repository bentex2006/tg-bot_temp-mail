# Email Domain Setup Guide

## Step 1: Cloudflare DNS Configuration

Login to your Cloudflare dashboard and go to DNS settings for your domain:

### MX Records (Email Routing)
```
Type: MX
Name: @
Mail server: route1.mx.cloudflare.net
Priority: 10
TTL: Auto

Type: MX
Name: @
Mail server: route2.mx.cloudflare.net
Priority: 20
TTL: Auto

Type: MX
Name: @
Mail server: route3.mx.cloudflare.net
Priority: 30
TTL: Auto
```

### SPF Record (Anti-Spam)
```
Type: TXT
Name: @
Content: "v=spf1 include:_spf.mx.cloudflare.net ~all"
TTL: Auto
```

### DMARC Record (Email Security)
```
Type: TXT
Name: _dmarc
Content: "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com; ruf=mailto:dmarc@yourdomain.com; fo=1"
TTL: Auto
```

## Step 2: Enable Cloudflare Email Routing

1. In Cloudflare Dashboard, go to **Email** → **Email Routing**
2. Click **Enable Email Routing**
3. Verify your domain ownership (usually automatic)
4. Wait for DNS propagation (5-10 minutes)

## Step 3: Configure Email Routing Rules

### Catch-All Rule for B3X Mail
1. Go to **Routing Rules** → **Catch-all address**
2. Set action to **Send to a Worker**
3. Create a new Worker with this code:

```javascript
export default {
  async email(message, env, ctx) {
    const webhook_url = "https://your-b3x-server.com/api/webhook/email";
    
    try {
      // Extract email content
      const email_data = {
        to: message.to,
        from: message.from,
        subject: message.headers.get("Subject") || "",
        text: await message.text(),
        html: await message.html() || ""
      };

      // Forward to B3X Mail webhook
      const response = await fetch(webhook_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(email_data)
      });

      if (response.ok) {
        console.log("Email forwarded successfully");
      } else {
        console.error("Failed to forward email:", response.status);
      }
    } catch (error) {
      console.error("Error processing email:", error);
    }
  }
};
```

### Alternative: Direct Webhook (Simpler Setup)
1. Go to **Routing Rules** → **Catch-all address**
2. Set action to **Send to a webhook**
3. Webhook URL: `https://your-b3x-server.com/api/webhook/email`

## Step 4: Update Your Server URL

Replace `your-b3x-server.com` with your actual server URL:
- If using Replit: `https://your-repl-name.your-username.repl.co`
- If using custom domain: `https://yourdomain.com`

## Step 5: Test Email Routing

### Quick Test
1. Send an email to: `test@yourdomain.com`
2. Check your server logs for webhook calls
3. Register a test user and create an email address
4. Send email to that address and verify it appears in Telegram

### Verification Commands
```bash
# Check MX records
dig MX yourdomain.com

# Check SPF record
dig TXT yourdomain.com

# Check DMARC record
dig TXT _dmarc.yourdomain.com

# Test email delivery
curl -X POST https://your-server.com/api/webhook/email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@yourdomain.com",
    "from": "sender@example.com", 
    "subject": "Test Email",
    "text": "This is a test message"
  }'
```

## Step 6: Production Considerations

### Security
- Enable HTTPS for your server (required for webhooks)
- Set up proper firewall rules
- Monitor webhook endpoint for abuse

### Monitoring
- Set up alerts for email delivery failures
- Monitor Cloudflare Email Routing logs
- Track webhook success/failure rates

### Backup Email Handling
Add a fallback rule in Cloudflare:
1. Create rule: If email routing fails
2. Action: Forward to your personal email
3. This ensures no emails are lost

## Common Issues & Solutions

### Emails Not Receiving
- **Check DNS propagation**: Use `dig` commands above
- **Verify webhook URL**: Must be HTTPS and publicly accessible
- **Check Cloudflare logs**: Email Routing section shows delivery attempts

### Webhook Failures
- **Server not responding**: Check if your server is running
- **SSL certificate issues**: Ensure HTTPS is properly configured
- **Rate limiting**: Cloudflare might retry failed webhooks

### SPF/DMARC Failures
- **Wait for propagation**: DNS changes take 24-48 hours to fully propagate
- **Check syntax**: Use online SPF/DMARC validators
- **Monitor reports**: DMARC reports will be sent to specified email

## Step 7: Bot Configuration

Your bot (@akimailb3xbot) is already configured with token:
`7577515733:AAE6ZYNtfSNZNvoNtdYD6Uz5TkCPHZmJpPA`

Bot will automatically:
- Send verification codes during registration
- Forward received emails to users
- Handle admin commands for user management

## Final Checklist

- [ ] DNS records added in Cloudflare
- [ ] Email Routing enabled and verified
- [ ] Webhook/Worker configured with your server URL
- [ ] Test email sent and received
- [ ] Bot responding to commands
- [ ] HTTPS certificate valid
- [ ] Server logs showing webhook calls

Your domain is now ready to handle emails for B3X Mail service!

## Support
- Test with: `test@yourdomain.com`
- Bot: @your_bot_username
- Admin: @your_admin_username