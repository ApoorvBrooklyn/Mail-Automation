const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const googleSheetsService = require('./googleSheetsService');

class EmailService {
  constructor() {
    this.transporter = null;
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  }

  async initialize() {
    try {
      this.transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // Verify connection
      await this.transporter.verify();
      console.log('✅ Email service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      throw error;
    }
  }

  generateTrackingPixel(email) {
    const trackingId = uuidv4();
    return `${this.baseUrl}/api/tracking/pixel/${trackingId}?email=${encodeURIComponent(email)}`;
  }

  generateTrackingLink(email, originalUrl) {
    const trackingId = uuidv4();
    return `${this.baseUrl}/api/tracking/link/${trackingId}?email=${encodeURIComponent(email)}&url=${encodeURIComponent(originalUrl)}`;
  }

  generateReplyLink(email) {
    const trackingId = uuidv4();
    return `${this.baseUrl}/api/tracking/reply/${trackingId}?email=${encodeURIComponent(email)}`;
  }

  async sendConfirmationEmail(submission) {
    try {
      const trackingPixel = this.generateTrackingPixel(submission.email);
      const paymentLink = this.generateTrackingLink(submission.email, 'https://payment.example.com/consulting-cohort');
      const replyLink = this.generateReplyLink(submission.email);

      const emailContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to Consulting Cohort 101</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
            .tracking-pixel { width: 1px; height: 1px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Consulting Cohort 101!</h1>
            </div>
            <div class="content">
              <h2>Hi ${submission.name},</h2>
              
              <p>Thank you for your interest in our <strong>Consulting Cohort 101</strong> program! We're excited to have you join our community of aspiring consultants.</p>
              
              <p>Your application has been received and we're thrilled to confirm your selection for this exclusive program.</p>
              
              <h3>What's Next?</h3>
              <p>To secure your spot in the cohort, please complete your payment using the link below:</p>
              
              <div style="text-align: center;">
                <a href="${paymentLink}" class="button">💳 Complete Payment</a>
              </div>
              
              <p><strong>Program Details:</strong></p>
              <ul>
                <li>Duration: 8 weeks</li>
                <li>Format: Live online sessions + group projects</li>
                <li>Investment: $997 (one-time payment)</li>
                <li>Start Date: Next cohort begins in 2 weeks</li>
              </ul>
              
              <p>If you have any questions or need assistance, please don't hesitate to reach out by replying to this email.</p>
              
              <p>Best regards,<br>
              The Consulting Cohort 101 Team</p>
            </div>
            <div class="footer">
              <p>Questions? <a href="${replyLink}">Reply to this email</a></p>
              <p>© 2024 Consulting Cohort 101. All rights reserved.</p>
            </div>
          </div>
          <img src="${trackingPixel}" class="tracking-pixel" alt="" />
        </body>
        </html>
      `;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: submission.email,
        subject: 'Welcome to Consulting Cohort 101 - Complete Your Registration',
        html: emailContent,
        text: `
          Hi ${submission.name},
          
          Thank you for your interest in our Consulting Cohort 101 program! We're excited to have you join our community of aspiring consultants.
          
          Your application has been received and we're thrilled to confirm your selection for this exclusive program.
          
          To secure your spot in the cohort, please complete your payment: ${paymentLink}
          
          Program Details:
          - Duration: 8 weeks
          - Format: Live online sessions + group projects
          - Investment: $997 (one-time payment)
          - Start Date: Next cohort begins in 2 weeks
          
          If you have any questions, please reply to this email.
          
          Best regards,
          The Consulting Cohort 101 Team
        `
      };

      await this.transporter.sendMail(mailOptions);
      await googleSheetsService.updateStatus(submission.email, 'Email Sent');
      
      console.log(`✅ Confirmation email sent to ${submission.email}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to send confirmation email:', error);
      throw error;
    }
  }

  async sendReminderEmail1(submission) {
    try {
      const trackingPixel = this.generateTrackingPixel(submission.email);
      const paymentLink = this.generateTrackingLink(submission.email, 'https://payment.example.com/consulting-cohort');
      const replyLink = this.generateReplyLink(submission.email);

      const emailContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Reminder: Complete Your Consulting Cohort Registration</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #ff6b6b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
            .tracking-pixel { width: 1px; height: 1px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Don't Miss Out on Consulting Cohort 101!</h1>
            </div>
            <div class="content">
              <h2>Hi ${submission.name},</h2>
              
              <p>We noticed you haven't completed your registration for <strong>Consulting Cohort 101</strong> yet. Your spot is still reserved, but we want to make sure you don't miss this opportunity!</p>
              
              <p>This program is designed to help you:</p>
              <ul>
                <li>Master the fundamentals of consulting</li>
                <li>Build a strong professional network</li>
                <li>Develop practical skills through real projects</li>
                <li>Launch your consulting career</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${paymentLink}" class="button">🚀 Complete Your Registration</a>
              </div>
              
              <p><strong>Limited Time:</strong> The next cohort starts in just 2 weeks, and spots are filling up quickly!</p>
              
              <p>If you have any questions or need assistance, please reply to this email.</p>
              
              <p>Best regards,<br>
              The Consulting Cohort 101 Team</p>
            </div>
            <div class="footer">
              <p>Questions? <a href="${replyLink}">Reply to this email</a></p>
              <p>© 2024 Consulting Cohort 101. All rights reserved.</p>
            </div>
          </div>
          <img src="${trackingPixel}" class="tracking-pixel" alt="" />
        </body>
        </html>
      `;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: submission.email,
        subject: 'Reminder: Complete Your Consulting Cohort Registration',
        html: emailContent
      };

      await this.transporter.sendMail(mailOptions);
      await googleSheetsService.updateStatus(submission.email, 'Reminder 1 Sent');
      
      console.log(`✅ Reminder 1 email sent to ${submission.email}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to send reminder 1 email:', error);
      throw error;
    }
  }

  async sendReminderEmail2(submission) {
    try {
      const trackingPixel = this.generateTrackingPixel(submission.email);
      const paymentLink = this.generateTrackingLink(submission.email, 'https://payment.example.com/consulting-cohort');
      const replyLink = this.generateReplyLink(submission.email);

      const emailContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Last Chance: Consulting Cohort 101 Benefits You Can't Miss</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4834d4 0%, #686de0 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #4834d4; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
            .tracking-pixel { width: 1px; height: 1px; }
            .benefit { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #4834d4; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💎 Exclusive Benefits Await You!</h1>
            </div>
            <div class="content">
              <h2>Hi ${submission.name},</h2>
              
              <p>We saw you opened our previous email about <strong>Consulting Cohort 101</strong>. Since you're interested, we wanted to share some exclusive benefits that make this program truly special:</p>
              
              <div class="benefit">
                <h3>🎯 Personalized Mentorship</h3>
                <p>Get 1-on-1 sessions with industry experts who've worked with Fortune 500 companies.</p>
              </div>
              
              <div class="benefit">
                <h3>📈 Real Project Experience</h3>
                <p>Work on actual consulting projects and build a portfolio that stands out.</p>
              </div>
              
              <div class="benefit">
                <h3>🤝 Lifetime Network Access</h3>
                <p>Join our exclusive alumni network with 500+ successful consultants.</p>
              </div>
              
              <div class="benefit">
                <h3>💰 ROI Guarantee</h3>
                <p>See a 3x return on your investment within 6 months, or get your money back.</p>
              </div>
              
              <div style="text-align: center;">
                <a href="${paymentLink}" class="button">🎁 Claim Your Spot Now</a>
              </div>
              
              <p><strong>Special Offer:</strong> The first 10 people to complete registration get a bonus 30-minute strategy session!</p>
              
              <p>Questions? Just reply to this email - we're here to help!</p>
              
              <p>Best regards,<br>
              The Consulting Cohort 101 Team</p>
            </div>
            <div class="footer">
              <p>Questions? <a href="${replyLink}">Reply to this email</a></p>
              <p>© 2024 Consulting Cohort 101. All rights reserved.</p>
            </div>
          </div>
          <img src="${trackingPixel}" class="tracking-pixel" alt="" />
        </body>
        </html>
      `;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: submission.email,
        subject: 'Last Chance: Consulting Cohort 101 Benefits You Can\'t Miss',
        html: emailContent
      };

      await this.transporter.sendMail(mailOptions);
      await googleSheetsService.updateStatus(submission.email, 'Reminder 2 Sent');
      
      console.log(`✅ Reminder 2 email sent to ${submission.email}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to send reminder 2 email:', error);
      throw error;
    }
  }

  async sendFinalReminder(submission) {
    try {
      const trackingPixel = this.generateTrackingPixel(submission.email);
      const paymentLink = this.generateTrackingLink(submission.email, 'https://payment.example.com/consulting-cohort');
      const replyLink = this.generateReplyLink(submission.email);

      const emailContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Final Notice: Your Consulting Cohort Spot is Expiring</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #e74c3c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
            .tracking-pixel { width: 1px; height: 1px; }
            .urgent { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Final Notice: Your Spot is Expiring</h1>
            </div>
            <div class="content">
              <h2>Hi ${submission.name},</h2>
              
              <div class="urgent">
                <h3>🚨 URGENT: Your reserved spot expires in 24 hours!</h3>
                <p>We've held your place in Consulting Cohort 101, but we need to release it to the waiting list if you don't complete your registration soon.</p>
              </div>
              
              <p>You've shown interest by clicking our payment link, so we know this program is right for you. Don't let this opportunity slip away!</p>
              
              <p><strong>What happens if you don't act now:</strong></p>
              <ul>
                <li>Your spot goes to someone on the waiting list</li>
                <li>You'll need to reapply for the next cohort</li>
                <li>You'll miss the current special pricing</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${paymentLink}" class="button">⚡ Complete Payment Now</a>
              </div>
              
              <p><strong>Need help?</strong> Reply to this email and we'll assist you immediately.</p>
              
              <p>This is your last chance to join this cohort!</p>
              
              <p>Best regards,<br>
              The Consulting Cohort 101 Team</p>
            </div>
            <div class="footer">
              <p>Questions? <a href="${replyLink}">Reply to this email</a></p>
              <p>© 2024 Consulting Cohort 101. All rights reserved.</p>
            </div>
          </div>
          <img src="${trackingPixel}" class="tracking-pixel" alt="" />
        </body>
        </html>
      `;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: submission.email,
        subject: 'Final Notice: Your Consulting Cohort Spot is Expiring',
        html: emailContent
      };

      await this.transporter.sendMail(mailOptions);
      await googleSheetsService.updateStatus(submission.email, 'Final Reminder Sent');
      
      console.log(`✅ Final reminder email sent to ${submission.email}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to send final reminder email:', error);
      throw error;
    }
  }
}

module.exports = new EmailService(); 