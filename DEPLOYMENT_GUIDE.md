# B3X Mail - Complete Deployment Guide

This guide covers everything needed to deploy your B3X Mail service with anti-spam protection and email domain setup.

## 🚀 Quick Setup Summary

### 1. Bot Configuration
- **Bot Username**: @your_bot_username (create with @BotFather)
- **Bot Token**: Get from @BotFather on Telegram
- **Domain**: yourdomain.com (configure for emails)

### 2. Security Features Implemented
- ✅ IP-based rate limiting (max 3 registrations per hour per IP)
- ✅ Anti-SQL injection protection with input validation
- ✅ Encrypted verification codes with bcrypt hashing
- ✅ 10-minute expiry on verification codes
- ✅ Unique username and Telegram ID constraints
- ✅ Helmet security headers
- ✅ Express rate limiting (100 requests per 15 minutes)
- ✅ Input sanitization and validation

### 3. Current Features
- **Free Plan**: 2 permanent emails + 5 temporary emails/day
- **PRO Plan**: 20 permanent emails + unlimited temporary emails
- **Domain**: Single domain support (easily expandable)
- **Telegram Integration**: Full bot management with admin commands

## 📧 Email Domain Setup (Cloudflare)

### Step 1: DNS Records
Add these records in Cloudflare DNS:

```
Type: MX
Name: @
Mail server: mail.kalanaagpur.com
Priority: 10

Type: A
Name: mail
IPv4: YOUR_SERVER_IP
Proxy: Off (DNS Only)

Type: TXT
Name: @
Content: "v=spf1 ip4:YOUR_SERVER_IP ~all"

Type: TXT
Name: _dmarc
Content: "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com"
```

### Step 2: Cloudflare Email Routing
1. Go to Cloudflare Dashboard → Email → Email Routing
2. Enable Email Routing for yourdomain.com
3. Add catch-all rule:
   - Match: All emails
   - Action: Send to webhook
   - Webhook URL: `https://your-server.com/api/webhook/email`

### Step 3: Webhook Verification
The webhook endpoint `/api/webhook/email` is already implemented and will:
- Receive emails from Cloudflare
- Find the target email in database
- Forward to user's Telegram via bot
- Log all email processing

## 🤖 Bot Commands

### User Commands
- `/start` - Welcome message with user manual
- `/createtemp` - Generate temporary email (24h expiry)
- `/myemails` - View all active emails
- `/usage` - Check usage statistics
- `/help` - Command help

### Admin Commands (configure admin username in .env)
- `/userp @username` - Promote user to PRO
- `/userinfo @username` - Get user statistics
- `/ban @username` - Ban user account
- `/deleteuser @username` - Delete user account
- `/stats` - Service statistics

## 🔒 Security Implementation

### Anti-Spam Measures
```javascript
// IP-based registration limiting
- Max 3 registrations per hour per IP
- Max 5 registration attempts per hour per IP
- Global rate limit: 100 requests per 15 minutes

// Input validation
- SQL injection pattern detection
- Character sanitization
- Regex validation for usernames and IDs
- Express-validator middleware
```

### Encryption & Security
```javascript
// Verification codes
- BCrypt hashing with salt rounds: 12
- 10-minute expiry automatic cleanup
- Secure random code generation

// Headers & Protection
- Helmet.js security headers
- CSP policies configured
- XSS protection enabled
```

## 🌐 Environment Variables

Set these in your deployment:

```bash
DATABASE_URL=your_postgres_connection_string
BOT_TOKEN=your_telegram_bot_token
ENCRYPTION_KEY=your-32-character-encryption-key
ADMIN_USERNAME=your_telegram_username
NODE_ENV=production
```

## 📱 Frontend Features

### User Registration
- Real-time validation
- Telegram ID verification
- Secure OTP via Telegram bot
- Auto-redirect to dashboard

### Dashboard
- Email management (create/delete)
- Usage statistics display
- Domain selection (configured domain + expandable)
- Account type indicator (Free/PRO)

## 🔧 Testing Your Setup

### 1. Registration Flow
1. Visit your website
2. Fill registration form
3. Check Telegram for verification code
4. Enter code to verify account

### 2. Email Creation
1. Access dashboard
2. Create temporary email (via bot or website)
3. Create permanent email (website only)
4. Verify emails appear in dashboard

### 3. Email Forwarding
1. Send test email to created address
2. Check Telegram for forwarded message
3. Verify email appears in logs

### 4. Admin Functions
1. Use admin commands in Telegram
2. Test user promotion to PRO
3. Verify statistics reporting

## 🚨 Troubleshooting

### Common Issues

**Bot not responding:**
- Verify bot token is correct
- Check bot permissions in Telegram
- Ensure bot is started (not stopped)

**Emails not forwarding:**
- Check Cloudflare Email Routing setup
- Verify webhook URL is accessible
- Check server logs for webhook errors

**Registration failing:**
- Verify database connection
- Check rate limiting (wait 1 hour if hit)
- Ensure Telegram ID is numeric

**Verification codes not working:**
- Codes expire in 10 minutes
- Check bot can send messages to user
- Verify user started bot conversation

### Security Monitoring

Monitor these metrics:
- Failed registration attempts per IP
- Invalid verification code attempts
- SQL injection attempt logs
- Rate limit violations

## 📊 Production Deployment

### Server Requirements
- Node.js 20+
- PostgreSQL database
- SSL certificate for webhook
- Minimum 1GB RAM

### Scaling Considerations
- Database connection pooling configured
- Rate limiting prevents abuse
- Email cleanup runs hourly
- Telegram bot handles concurrent users

### Monitoring Setup
- Log all email webhook calls
- Monitor registration success rates
- Track bot command usage
- Alert on high error rates

---

## Support & Contact

- **Developer**: Configure your username
- **Bot**: Configure your bot username  
- **Service**: B3X Mail powered by your domain

Your B3X Mail service is now production-ready with enterprise-grade security features!