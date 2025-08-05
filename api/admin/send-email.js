require('dotenv').config();
const googleSheetsService = require('../../services/googleSheetsService');
const emailService = require('../../services/emailService');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize services if not already initialized
    if (!googleSheetsService.isInitialized) {
      await googleSheetsService.initialize();
    }
    if (!emailService.isInitialized) {
      await emailService.initialize();
    }
  } catch (error) {
    console.warn('Service initialization warning:', error.message);
  }

  try {
    const { email, emailType } = req.body;

    if (!email || !emailType) {
      return res.status(400).json({
        error: 'Email and emailType are required'
      });
    }

    const submission = await googleSheetsService.getSubmissionByEmail(email);
    if (!submission) {
      return res.status(404).json({
        error: 'Submission not found'
      });
    }

    let result;

    switch (emailType) {
      case 'confirmation':
        result = await emailService.sendConfirmationEmail(submission);
        break;
      case 'reminder1':
        result = await emailService.sendReminderEmail1(submission);
        break;
      case 'reminder2':
        result = await emailService.sendReminderEmail2(submission);
        break;
      case 'final':
        result = await emailService.sendFinalReminder(submission);
        break;
      default:
        return res.status(400).json({
          error: 'Invalid email type. Must be: confirmation, reminder1, reminder2, or final'
        });
    }

    res.json({
      success: true,
      message: `${emailType} email sent successfully to ${email}`
    });
  } catch (error) {
    console.error('❌ Error sending manual email:', error);
    res.status(500).json({
      error: 'Failed to send email'
    });
  }
};