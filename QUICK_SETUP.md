# B3X Mail - Quick Setup (5 Minutes)

## 1. Cloudflare DNS (2 minutes)
Add these records to kalanaagpur.com in Cloudflare:

```
MX  @  route1.mx.cloudflare.net  10
MX  @  route2.mx.cloudflare.net  20  
MX  @  route3.mx.cloudflare.net  30
TXT @  "v=spf1 include:_spf.mx.cloudflare.net ~all"
TXT _dmarc  "v=DMARC1; p=quarantine; rua=mailto:dmarc@kalanaagpur.com"
```

## 2. Enable Email Routing (1 minute)
- Cloudflare Dashboard → Email → Email Routing
- Click "Enable Email Routing"
- Wait for verification

## 3. Set Catch-All Rule (1 minute)
- Routing Rules → Catch-all address
- Action: Send to webhook
- URL: `https://YOUR_SERVER_URL/api/webhook/email`

## 4. Test (1 minute)
Send email to: `test@kalanaagpur.com`
Check server logs for webhook calls

## Done! 
Your domain is ready for B3X Mail service.

Bot: @akimailb3xbot
Website: YOUR_SERVER_URL