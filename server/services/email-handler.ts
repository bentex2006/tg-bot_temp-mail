import { storage } from '../storage';
import { telegramBot } from './telegram-bot';

interface EmailData {
  to: string;
  from: string;
  subject: string;
  body: string;
}

export class EmailHandler {
  async processIncomingEmail(emailData: EmailData) {
    try {
      // Find the email account
      const emailAccount = await storage.getEmailByAddress(emailData.to);
      if (!emailAccount) {
        console.log(`Email account not found for: ${emailData.to}`);
        return;
      }

      // Get the user
      const user = await storage.getUser(emailAccount.userId);
      if (!user || !user.isActive || user.isBanned) {
        console.log(`User not active or banned for email: ${emailData.to}`);
        return;
      }

      // Save the received email
      const receivedEmail = await storage.saveReceivedEmail({
        emailId: emailAccount.id,
        fromAddress: emailData.from,
        subject: emailData.subject,
        body: emailData.body,
      });

      // Forward to Telegram
      await telegramBot.forwardEmail(
        user.telegramId,
        emailData.from,
        emailData.subject,
        emailData.body,
        emailData.to
      );

      // Mark as forwarded
      await storage.markEmailForwarded(receivedEmail.id);

      console.log(`Email forwarded successfully: ${emailData.to} -> Telegram ${user.telegramId}`);
    } catch (error) {
      console.error('Error processing incoming email:', error);
    }
  }

  // This would be called by your email server/service when emails are received
  // You'll need to integrate this with your actual email infrastructure
  setupEmailReceiver() {
    // TODO: Integrate with your email server (Postfix, etc.)
    // This is where you'd set up the actual email receiving mechanism
    // For now, this is a placeholder for the email processing logic
    console.log('Email receiver setup - integrate with your email server');
  }
}

export const emailHandler = new EmailHandler();
