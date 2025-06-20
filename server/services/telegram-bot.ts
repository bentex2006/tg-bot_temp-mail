import TelegramBot from 'node-telegram-bot-api';
import type { IStorage } from '../storage';

const BOT_TOKEN = process.env.BOT_TOKEN || '7577515733:AAE6ZYNtfSNZNvoNtdYD6Uz5TkCPHZmJpPA';
const ADMIN_IDS = ['skittle_gg']; // Add admin usernames here

class TelegramBotService {
  private bot: TelegramBot;
  private storage: IStorage | null = null;

  constructor() {
    this.bot = new TelegramBot(BOT_TOKEN, { polling: true });
    this.setupHandlers();
  }

  initialize(storage: IStorage) {
    this.storage = storage;
  }

  private setupHandlers() {
    // Start command
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const username = msg.from?.username;
      
      const startGif = 'https://i.pinimg.com/originals/a6/85/85/a685853533e35688cbe68853eb085a65.gif';
      
      const welcomeMessage = `
🤖 Welcome to AKI - KalanaAgpur Mail Service

📧 Get temporary and permanent email addresses delivered directly to your Telegram!

🚀 Getting Started:
1. Register at our website: kalanaagpur.com
2. Connect your Telegram account
3. Start receiving emails here!

📱 Available Commands:
/createtemp - Generate temporary email
/myemails - View your active emails
/usage - Check usage limits
/help - Get help and support

💎 Free Plan Limits:
• 2 Permanent emails
• 5 Temporary emails per day
• 24-hour temp email duration

⭐ PRO Plan Benefits:
• 20 Permanent emails
• Unlimited temporary emails
• Priority support

Your Telegram ID: ${chatId}
${username ? `Username: @${username}` : ''}

Get started now! 🎉`;

      try {
        await this.bot.sendAnimation(chatId, startGif, {
          caption: welcomeMessage,
          parse_mode: 'Markdown'
        });
      } catch (error) {
        await this.bot.sendMessage(chatId, welcomeMessage);
      }
    });

    // Create temporary email
    this.bot.onText(/\/createtemp/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = chatId.toString();

      if (!this.storage) {
        return this.bot.sendMessage(chatId, "Service temporarily unavailable. Please try again later.");
      }

      try {
        const user = await this.storage.getUserByTelegramId(telegramId);
        if (!user || !user.isVerified) {
          return this.bot.sendMessage(chatId, "Please register and verify your account first at kalanaagpur.com");
        }

        if (user.isBanned) {
          return this.bot.sendMessage(chatId, "Your account has been banned. Contact support for assistance.");
        }

        // Check limits
        const todayUsage = await this.storage.getTodayUsage(user.id);
        const currentTemp = todayUsage?.tempEmailsCreated || 0;
        const maxTemp = user.isPro ? Infinity : 5;

        if (currentTemp >= maxTemp) {
          return this.bot.sendMessage(chatId, `Temporary email limit reached (${maxTemp}/day). Upgrade to PRO for unlimited emails!`);
        }

        // Generate temp email
        const prefix = `temp_${Math.random().toString(36).substring(2, 8)}`;
        const emailAddress = `${prefix}@kalanaagpur.com`;
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const email = await this.storage.createEmail({
          userId: user.id,
          email: emailAddress,
          type: 'temporary',
          expiresAt,
        });

        await this.storage.incrementUsage(user.id, 'temp');

        const successGif = 'https://i.pinimg.com/originals/7b/b9/ed/7bb9ed00d54da2404408d685534a36d4.gif';
        const message = `
✅ Temporary Email Created!

📧 Email: ${emailAddress}
⏰ Expires: ${expiresAt.toLocaleString()}
📊 Usage: ${currentTemp + 1}/${maxTemp === Infinity ? '∞' : maxTemp}

All emails sent to this address will be forwarded to this chat.`;

        try {
          await this.bot.sendAnimation(chatId, successGif, {
            caption: message,
            parse_mode: 'Markdown'
          });
        } catch (error) {
          await this.bot.sendMessage(chatId, message);
        }
      } catch (error) {
        console.error('Create temp email error:', error);
        this.bot.sendMessage(chatId, "Failed to create temporary email. Please try again.");
      }
    });

    // View emails
    this.bot.onText(/\/myemails/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = chatId.toString();

      if (!this.storage) {
        return this.bot.sendMessage(chatId, "Service temporarily unavailable. Please try again later.");
      }

      try {
        const user = await this.storage.getUserByTelegramId(telegramId);
        if (!user || !user.isVerified) {
          return this.bot.sendMessage(chatId, "Please register and verify your account first at kalanaagpur.com");
        }

        const emails = await this.storage.getUserEmails(user.id);
        
        if (emails.length === 0) {
          return this.bot.sendMessage(chatId, "You don't have any active emails. Create some at kalanaagpur.com or use /createtemp");
        }

        let message = `📧 Your Active Emails (${emails.length}):\n\n`;
        
        emails.forEach((email, index) => {
          const status = email.type === 'temporary' ? '⏰ Temporary' : '💎 Permanent';
          const expiry = email.expiresAt ? `\nExpires: ${new Date(email.expiresAt).toLocaleString()}` : '';
          message += `${index + 1}. ${email.email}\n${status}${expiry}\n\n`;
        });

        this.bot.sendMessage(chatId, message);
      } catch (error) {
        console.error('View emails error:', error);
        this.bot.sendMessage(chatId, "Failed to retrieve emails. Please try again.");
      }
    });

    // Usage stats
    this.bot.onText(/\/usage/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = chatId.toString();

      if (!this.storage) {
        return this.bot.sendMessage(chatId, "Service temporarily unavailable. Please try again later.");
      }

      try {
        const user = await this.storage.getUserByTelegramId(telegramId);
        if (!user || !user.isVerified) {
          return this.bot.sendMessage(chatId, "Please register and verify your account first at kalanaagpur.com");
        }

        const todayUsage = await this.storage.getTodayUsage(user.id);
        const allEmails = await this.storage.getUserEmails(user.id);
        
        const permCount = allEmails.filter(e => e.type === 'permanent').length;
        const tempCount = todayUsage?.tempEmailsCreated || 0;
        
        const maxPerm = user.isPro ? 20 : 2;
        const maxTemp = user.isPro ? '∞' : 5;

        const message = `
📊 Usage Statistics

👤 Account: ${user.isPro ? '⭐ PRO' : '🆓 Free'}

📧 Permanent Emails: ${permCount}/${maxPerm}
⏰ Temporary (Today): ${tempCount}/${maxTemp}

${user.isPro ? '' : '\n💎 Upgrade to PRO for more emails!\nContact admin for upgrade.'}`;

        this.bot.sendMessage(chatId, message);
      } catch (error) {
        console.error('Usage error:', error);
        this.bot.sendMessage(chatId, "Failed to get usage stats. Please try again.");
      }
    });

    // Help command
    this.bot.onText(/\/help/, async (msg) => {
      const chatId = msg.chat.id;
      
      const helpMessage = `
🤖 AKI Bot Help

📱 User Commands:
/start - Welcome & setup guide
/createtemp - Generate temporary email
/myemails - View your active emails
/usage - Check usage limits
/help - This help message

🌐 Website Features:
• Create permanent emails
• Manage your account
• View detailed statistics

💬 Support:
Contact @skittle_gg for help

📧 Email Management:
All emails are forwarded to this chat automatically. Temporary emails expire after 24 hours.

🔗 Website: kalanaagpur.com`;

      this.bot.sendMessage(chatId, helpMessage);
    });

    // Admin commands
    this.bot.onText(/\/userp (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const username = msg.from?.username;
      
      if (!username || !ADMIN_IDS.includes(username)) {
        return this.bot.sendMessage(chatId, "Access denied. Admin only command.");
      }

      if (!this.storage || !match) {
        return this.bot.sendMessage(chatId, "Invalid command usage.");
      }

      const targetUsername = match[1].replace('@', '');
      
      try {
        const promoted = await this.storage.promoteUser(targetUsername);
        if (promoted) {
          this.bot.sendMessage(chatId, `✅ User @${targetUsername} promoted to PRO plan.`);
        } else {
          this.bot.sendMessage(chatId, `❌ User @${targetUsername} not found.`);
        }
      } catch (error) {
        console.error('Promote user error:', error);
        this.bot.sendMessage(chatId, "Failed to promote user.");
      }
    });

    this.bot.onText(/\/userinfo (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const username = msg.from?.username;
      
      if (!username || !ADMIN_IDS.includes(username)) {
        return this.bot.sendMessage(chatId, "Access denied. Admin only command.");
      }

      if (!this.storage || !match) {
        return this.bot.sendMessage(chatId, "Invalid command usage.");
      }

      const targetUsername = match[1].replace('@', '');
      
      try {
        const userStats = await this.storage.getUserStats(targetUsername);
        if (userStats) {
          const { user, emailCount, todayUsage } = userStats;
          const message = `
👤 User Information: @${user.telegramUsername}

📊 Details:
• Full Name: ${user.fullName}
• Telegram ID: ${user.telegramId}
• Account Type: ${user.isPro ? '⭐ PRO' : '🆓 Free'}
• Status: ${user.isActive ? (user.isBanned ? '🚫 Banned' : '✅ Active') : '❌ Inactive'}
• Verified: ${user.isVerified ? '✅' : '❌'}
• Joined: ${new Date(user.createdAt).toLocaleDateString()}

📧 Email Statistics:
• Total Active Emails: ${emailCount}
• Today's Temp Emails: ${todayUsage?.tempEmailsCreated || 0}
• Today's Perm Emails: ${todayUsage?.permanentEmailsCreated || 0}

🔧 Admin Actions:
/ban @${user.telegramUsername} - Ban user
/deleteuser @${user.telegramUsername} - Delete account`;

          this.bot.sendMessage(chatId, message);
        } else {
          this.bot.sendMessage(chatId, `❌ User @${targetUsername} not found.`);
        }
      } catch (error) {
        console.error('User info error:', error);
        this.bot.sendMessage(chatId, "Failed to get user info.");
      }
    });

    this.bot.onText(/\/ban (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const username = msg.from?.username;
      
      if (!username || !ADMIN_IDS.includes(username)) {
        return this.bot.sendMessage(chatId, "Access denied. Admin only command.");
      }

      if (!this.storage || !match) {
        return this.bot.sendMessage(chatId, "Invalid command usage.");
      }

      const targetUsername = match[1].replace('@', '');
      
      try {
        const banned = await this.storage.banUser(targetUsername);
        if (banned) {
          this.bot.sendMessage(chatId, `🚫 User @${targetUsername} has been banned.`);
        } else {
          this.bot.sendMessage(chatId, `❌ User @${targetUsername} not found.`);
        }
      } catch (error) {
        console.error('Ban user error:', error);
        this.bot.sendMessage(chatId, "Failed to ban user.");
      }
    });

    this.bot.onText(/\/deleteuser (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const username = msg.from?.username;
      
      if (!username || !ADMIN_IDS.includes(username)) {
        return this.bot.sendMessage(chatId, "Access denied. Admin only command.");
      }

      if (!this.storage || !match) {
        return this.bot.sendMessage(chatId, "Invalid command usage.");
      }

      const targetUsername = match[1].replace('@', '');
      
      try {
        const deleted = await this.storage.deleteUserAccount(targetUsername);
        if (deleted) {
          this.bot.sendMessage(chatId, `❌ User @${targetUsername} account has been deleted.`);
        } else {
          this.bot.sendMessage(chatId, `❌ User @${targetUsername} not found.`);
        }
      } catch (error) {
        console.error('Delete user error:', error);
        this.bot.sendMessage(chatId, "Failed to delete user.");
      }
    });

    this.bot.onText(/\/stats/, async (msg) => {
      const chatId = msg.chat.id;
      const username = msg.from?.username;
      
      if (!username || !ADMIN_IDS.includes(username)) {
        return this.bot.sendMessage(chatId, "Access denied. Admin only command.");
      }

      if (!this.storage) {
        return this.bot.sendMessage(chatId, "Service temporarily unavailable.");
      }

      try {
        const allUsers = await this.storage.getAllUsers();
        const activeUsers = allUsers.filter(u => u.isActive && !u.isBanned);
        const proUsers = allUsers.filter(u => u.isPro);
        const bannedUsers = allUsers.filter(u => u.isBanned);

        const message = `
📊 Service Statistics

👥 Users:
• Total Registered: ${allUsers.length}
• Active Users: ${activeUsers.length}
• PRO Users: ${proUsers.length}
• Banned Users: ${bannedUsers.length}

📈 Growth:
• Today: ${allUsers.filter(u => new Date(u.createdAt).toDateString() === new Date().toDateString()).length}
• This Week: ${allUsers.filter(u => (Date.now() - new Date(u.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000).length}

🤖 Bot Status: ✅ Online
📧 Email Service: ✅ Active`;

        this.bot.sendMessage(chatId, message);
      } catch (error) {
        console.error('Stats error:', error);
        this.bot.sendMessage(chatId, "Failed to get statistics.");
      }
    });

    // Error handling
    this.bot.on('polling_error', (error) => {
      console.error('Telegram polling error:', error);
    });
  }

  async sendVerificationCode(telegramId: string, code: string) {
    try {
      const message = `
🔐 Verification Code

Your verification code is: ${code}

Enter this code on the website to complete your registration.

⚠️ This code will expire in 10 minutes.
🔒 Keep this code private and secure.`;

      await this.bot.sendMessage(telegramId, message);
    } catch (error) {
      console.error('Failed to send verification code:', error);
      throw error;
    }
  }

  async forwardEmail(telegramId: string, from: string, subject: string, body: string, toEmail: string) {
    try {
      const message = `
📧 New Email Received

📬 To: ${toEmail}
👤 From: ${from}
📋 Subject: ${subject}

📄 Message:
${body}

---
Powered by KalanaAgpur Mail`;

      await this.bot.sendMessage(telegramId, message, {
        parse_mode: 'Markdown'
      });
    } catch (error) {
      console.error('Failed to forward email:', error);
      throw error;
    }
  }
}

export const telegramBot = new TelegramBotService();
