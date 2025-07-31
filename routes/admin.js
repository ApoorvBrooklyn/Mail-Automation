const express = require('express');
const router = express.Router();
const googleSheetsService = require('../services/googleSheetsService');
const schedulerService = require('../services/schedulerService');
const trackingService = require('../services/trackingService');

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const allSubmissions = await googleSheetsService.getAllSubmissions();
    
    // Calculate statistics
    const stats = {
      total: allSubmissions.length,
      byStatus: {},
      conversionRate: 0,
      recentActivity: []
    };

    // Count by status
    allSubmissions.forEach(submission => {
      const status = submission.status || 'Unknown';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
    });

    // Calculate conversion rate (Paid / Total)
    const paidCount = stats.byStatus['Paid'] || 0;
    stats.conversionRate = allSubmissions.length > 0 ? 
      Math.round((paidCount / allSubmissions.length) * 100) : 0;

    // Get recent activity (last 10 submissions)
    stats.recentActivity = allSubmissions
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Error fetching admin stats:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics'
    });
  }
});

// Get all submissions with filtering
router.get('/submissions', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    let allSubmissions = await googleSheetsService.getAllSubmissions();

    // Filter by status if provided
    if (status) {
      allSubmissions = allSubmissions.filter(sub => sub.status === status);
    }

    // Apply pagination
    const paginatedSubmissions = allSubmissions.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      data: {
        submissions: paginatedSubmissions,
        total: allSubmissions.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching admin submissions:', error);
    res.status(500).json({
      error: 'Failed to fetch submissions'
    });
  }
});

// Get users eligible for follow-ups
router.get('/follow-ups', async (req, res) => {
  try {
    const reminder1Users = await trackingService.getUsersForReminder1();
    const reminder2Users = await trackingService.getUsersForReminder2();
    const finalReminderUsers = await trackingService.getUsersForFinalReminder();

    res.json({
      success: true,
      data: {
        reminder1: {
          count: reminder1Users.length,
          users: reminder1Users
        },
        reminder2: {
          count: reminder2Users.length,
          users: reminder2Users
        },
        finalReminder: {
          count: finalReminderUsers.length,
          users: finalReminderUsers
        }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching follow-up data:', error);
    res.status(500).json({
      error: 'Failed to fetch follow-up data'
    });
  }
});

// Manual trigger for follow-up emails (for testing)
router.post('/trigger-follow-ups', async (req, res) => {
  try {
    await schedulerService.triggerFollowUpCheck();
    
    res.json({
      success: true,
      message: 'Follow-up check triggered successfully'
    });
  } catch (error) {
    console.error('❌ Error triggering follow-ups:', error);
    res.status(500).json({
      error: 'Failed to trigger follow-ups'
    });
  }
});

// Manual trigger for final reminders (for testing)
router.post('/trigger-final-reminders', async (req, res) => {
  try {
    await schedulerService.triggerFinalReminderCheck();
    
    res.json({
      success: true,
      message: 'Final reminder check triggered successfully'
    });
  } catch (error) {
    console.error('❌ Error triggering final reminders:', error);
    res.status(500).json({
      error: 'Failed to trigger final reminders'
    });
  }
});

// Send manual email to specific user
router.post('/send-email', async (req, res) => {
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

    const emailService = require('../services/emailService');
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
});

// Get system health
router.get('/health', async (req, res) => {
  try {
    const health = {
      timestamp: new Date().toISOString(),
      services: {
        googleSheets: 'unknown',
        email: 'unknown',
        scheduler: 'unknown'
      }
    };

    // Check Google Sheets
    try {
      await googleSheetsService.getAllSubmissions();
      health.services.googleSheets = 'healthy';
    } catch (error) {
      health.services.googleSheets = 'error';
    }

    // Check email service
    try {
      const emailService = require('../services/emailService');
      await emailService.transporter.verify();
      health.services.email = 'healthy';
    } catch (error) {
      health.services.email = 'error';
    }

    // Check scheduler
    health.services.scheduler = 'running';

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('❌ Error checking system health:', error);
    res.status(500).json({
      error: 'Failed to check system health'
    });
  }
});

module.exports = router; 