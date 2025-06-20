<div align="center">
  <img src="attached_assets/Black and White  X Letter Digital Company Logo (1)_1750395530039.jpg" alt="B3X Logo" width="200" height="200">
  
  # B3X Mail - Temporary Email Service
  
  A modern, secure temporary email service that forwards emails directly to your Telegram account. Built with React, Node.js, PostgreSQL, and Cloudflare Workers.
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
  [![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)
</div>

## 🚀 Features

- **Temporary & Permanent Emails**: Create disposable emails that expire in 24 hours or permanent ones
- **Telegram Integration**: Receive all emails directly in your Telegram chat
- **Anti-Spam Protection**: Built-in rate limiting and security measures
- **Multi-Domain Support**: Easy to add new domains (currently supports one domain)
- **User Tiers**: Free and PRO plans with different limits
- **Real-time Dashboard**: Manage your emails through a modern web interface
- **Cloudflare Integration**: Automatic email routing through Cloudflare Workers

## 📋 User Limits

### Free Plan
- 2 Permanent emails
- 5 Temporary emails per day
- Single domain access

### PRO Plan
- 20 Permanent emails
- Unlimited temporary emails
- Priority support
- Early access to new domains

## 🛠 Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Email Routing**: Cloudflare Workers + Email Routing
- **Security**: bcrypt, helmet, rate limiting, input validation
- **Bot**: Telegram Bot API

## 🏃 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Cloudflare account
- Telegram Bot Token ([create here](https://t.me/botfather))
- Domain name

### Installation

1. **Clone and install dependencies**:
```bash
git clone https://github.com/yourusername/b3x-mail.git
cd b3x-mail
npm install
```

2. **Set up environment variables**:
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your values
DATABASE_URL=postgresql://username:password@localhost:5432/dbname
BOT_TOKEN=your_telegram_bot_token_here
ENCRYPTION_KEY=your_32_character_encryption_key_here
NODE_ENV=development
```

3. **Set up database**:
```bash
npm run db:push
```

4. **Start development server**:
```bash
npm run dev
```

Visit `http://localhost:5000` to see the application.

## 📧 Email Setup

### 1. Cloudflare DNS Configuration

Add these DNS records to your domain:

```
Type: MX  | Name: @  | Value: route1.mx.cloudflare.net | Priority: 10
Type: MX  | Name: @  | Value: route2.mx.cloudflare.net | Priority: 20
Type: MX  | Name: @  | Value: route3.mx.cloudflare.net | Priority: 30
Type: TXT | Name: @  | Value: "v=spf1 include:_spf.mx.cloudflare.net ~all"
Type: TXT | Name: _dmarc | Value: "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com"
```

### 2. Deploy Cloudflare Worker

1. Copy code from `cloudflare-worker.js`
2. Create new Worker in Cloudflare Dashboard
3. Update `SERVER_URL` in worker config
4. Deploy worker

### 3. Enable Email Routing

1. Cloudflare Dashboard → Email → Email Routing
2. Enable for your domain
3. Create catch-all rule → Send to Worker
4. Select your deployed worker

## 🤖 Telegram Bot Commands

### User Commands
- `/start` - Welcome message and setup
- `/createtemp` - Generate temporary email
- `/myemails` - View all active emails
- `/usage` - Check usage statistics
- `/help` - Command help

### Admin Commands
- `/userp @username` - Promote user to PRO
- `/userinfo @username` - Get user statistics
- `/ban @username` - Ban user account
- `/deleteuser @username` - Delete user account
- `/stats` - Service statistics

## 🔒 Security Features

- **Rate Limiting**: 3 registrations per hour per IP
- **Input Validation**: SQL injection prevention
- **Encrypted Verification**: BCrypt hashed codes with 10-minute expiry
- **Security Headers**: Helmet.js with CSP policies
- **Database Constraints**: Unique usernames and Telegram IDs
- **Anti-Spam**: Multiple layers of protection

## 📁 Project Structure

```
├── client/src/           # React frontend
│   ├── components/       # UI components
│   ├── pages/           # Application pages
│   └── lib/             # Utilities and API client
├── server/              # Node.js backend
│   ├── services/        # Telegram bot and email handler
│   ├── utils/           # Crypto and utility functions
│   └── routes.ts        # API routes
├── shared/              # Shared types and schemas
└── cloudflare-worker.js # Email routing worker
```

## 🚀 Deployment

### Option 1: Replit (Easiest)
1. Import repository to Replit
2. Set environment variables in Secrets
3. Run the project
4. Use the provided URL for Cloudflare worker config

### Option 2: Traditional Hosting
1. Build the project: `npm run build`
2. Deploy to your hosting provider
3. Set up environment variables
4. Configure Cloudflare worker with your domain

## 🔧 Configuration

### Adding New Domains

1. **Update allowed domains** in:
   - `server/storage.ts` - Add domain to database
   - `cloudflare-worker.js` - Add to `ALLOWED_DOMAINS` array

2. **Set up DNS** for new domain (same MX/TXT records)

3. **Enable Email Routing** in Cloudflare for new domain

### Customizing Limits

Edit limits in `server/routes.ts`:
```javascript
const maxPermanent = user.isPro ? 20 : 2;  // PRO : Free
const maxTemp = user.isPro ? Infinity : 5; // PRO : Free
```

### Bot Customization

Edit responses and commands in `server/services/telegram-bot.ts`

## 📊 Monitoring

- **Application Logs**: Check server console for errors
- **Cloudflare Logs**: Workers → Your Worker → Logs
- **Email Analytics**: Cloudflare → Email → Analytics
- **Database**: Monitor connection pool and query performance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit: `git commit -m "Add feature"`
5. Push: `git push origin feature-name`
6. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/b3x-mail/issues)
- **Documentation**: Check the `docs/` folder for detailed guides
- **Community**: Join our Telegram group for support

## 🙏 Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/) components
- Email routing powered by [Cloudflare](https://cloudflare.com/)
- Icons by [Lucide](https://lucide.dev/)

---

<div align="center">
  <img src="attached_assets/Black and White  X Letter Digital Company Logo (1)_1750395530039.jpg" alt="B3X Logo" width="100" height="100">
  
  **B3X Mail** - Secure temporary email service
  
  **Note**: Replace placeholder values (like `yourusername`, `your_telegram_bot_token_here`, etc.) with your actual values before deployment.
</div>