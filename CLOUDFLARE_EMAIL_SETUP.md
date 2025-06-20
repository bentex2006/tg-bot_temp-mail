# Cloudflare Email Domain Setup for B3X Mail

This guide will help you configure your domain `kalanaagpur.com` to receive emails and forward them to your B3X Mail service.

## Prerequisites
- Domain managed by Cloudflare
- Access to Cloudflare Dashboard
- A server to receive email webhooks (your B3X Mail server)

## Step 1: DNS Configuration

### Add MX Records
1. Go to Cloudflare Dashboard → DNS → Records
2. Add these MX records:

```
Type: MX
Name: @
Mail server: mail.kalanaagpur.com
Priority: 10
TTL: Auto
```

```
Type: MX  
Name: @
Mail server: mail2.kalanaagpur.com
Priority: 20
TTL: Auto
```

### Add A Records for Mail Servers
```
Type: A
Name: mail
IPv4: YOUR_SERVER_IP
TTL: Auto
Proxy: Off (DNS Only)
```

```
Type: A
Name: mail2  
IPv4: YOUR_SERVER_IP
TTL: Auto
Proxy: Off (DNS Only)
```

### Add SPF Record
```
Type: TXT
Name: @
Content: "v=spf1 ip4:YOUR_SERVER_IP ~all"
TTL: Auto
```

### Add DMARC Record
```
Type: TXT
Name: _dmarc
Content: "v=DMARC1; p=quarantine; rua=mailto:dmarc@kalanaagpur.com"
TTL: Auto
```

## Step 2: Email Routing Setup

### Option A: Cloudflare Email Routing (Recommended)
1. Go to Cloudflare Dashboard → Email → Email Routing
2. Enable Email Routing for your domain
3. Add catch-all rule:
   - Match: All emails
   - Action: Send to webhook
   - Webhook URL: `https://your-b3x-server.com/api/webhook/email`

### Option B: Traditional Mail Server
If you prefer setting up your own mail server:

1. Install Postfix on your server
2. Configure Postfix to forward emails to your webhook
3. Set up SSL certificates for mail servers

## Step 3: Webhook Endpoint

Add this endpoint to your B3X Mail server (`server/routes.ts`):

```javascript
// Email webhook endpoint
app.post("/api/webhook/email", async (req, res) => {
  try {
    const { to, from, subject, text, html } = req.body;
    
    await emailHandler.processIncomingEmail({
      to,
      from,
      subject,
      body: text || html || '',
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Email webhook error:", error);
    res.status(500).json({ error: "Failed to process email" });
  }
});
```

## Step 4: Testing

### Test DNS Configuration
```bash
# Check MX records
dig MX kalanaagpur.com

# Check SPF record  
dig TXT kalanaagpur.com

# Check DMARC record
dig TXT _dmarc.kalanaagpur.com
```

### Test Email Delivery
1. Send a test email to `test@kalanaagpur.com`
2. Check your server logs for webhook calls
3. Verify the email appears in Telegram

## Step 5: Security Considerations

### Rate Limiting
- Implement rate limiting on your webhook endpoint
- Block suspicious IP addresses
- Monitor for spam patterns

### Email Validation
- Validate sender domains
- Check for malicious content
- Implement virus scanning if needed

### Webhook Security
- Use HTTPS for webhook URLs
- Implement webhook signature verification
- Add IP allowlisting for Cloudflare IPs

## Cloudflare Email Routing IPs
If using IP allowlisting, these are Cloudflare's email routing IPs:
```
173.245.48.0/20
103.21.244.0/22
103.22.200.0/22
103.31.4.0/22
141.101.64.0/18
108.162.192.0/18
190.93.240.0/20
188.114.96.0/20
197.234.240.0/22
198.41.128.0/17
162.158.0.0/15
172.64.0.0/13
131.0.72.0/22
104.16.0.0/13
104.24.0.0/14
```

## Troubleshooting

### Common Issues
1. **Emails not receiving**: Check MX records and webhook URL
2. **SPF failures**: Verify SPF record includes your server IP
3. **DMARC failures**: Ensure DKIM and SPF are properly configured
4. **Webhook timeouts**: Optimize your email processing code

### Testing Tools
- [MXToolbox](https://mxtoolbox.com/) - DNS and email testing
- [Mail-tester](https://www.mail-tester.com/) - Email deliverability testing
- Cloudflare Email Routing logs in dashboard

## Advanced Configuration

### Custom Email Processing Rules
You can add custom rules in Cloudflare Email Routing:
- Forward specific emails to different webhooks
- Block emails from certain domains
- Add custom headers for processing

### Email Templates
Create email templates for:
- Welcome emails
- Verification codes
- Service notifications

### Monitoring
Set up monitoring for:
- Email delivery success rates
- Webhook response times
- Failed email processing

---

## Support
For issues with this setup:
1. Check Cloudflare Email Routing documentation
2. Review server logs for webhook errors
3. Contact @skittle_gg for B3X Mail specific issues