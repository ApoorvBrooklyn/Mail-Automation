require('dotenv').config();
const googleSheetsService = require('../services/googleSheetsService');
const emailService = require('../services/emailService');
const trackingService = require('../services/trackingService');
const schedulerService = require('../services/schedulerService');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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

  // Parse the request path to determine the route
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathParts = url.pathname.split('/').filter(Boolean);
  
  // Routes:
  // /api/admin/stats
  // /api/admin/submissions
  // /api/admin/follow-ups
  // /api/admin/trigger-follow-ups
  // /api/admin/send-email
  // /api/admin/health

  if (pathParts.length !== 3 || pathParts[1] !== 'admin') {
    return res.status(404).json({ error: 'Route not found' });
  }

  const adminRoute = pathParts[2];

  try {
    switch (adminRoute) {
      case 'stats':
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        const allSubmissions = await googleSheetsService.getAllSubmissions();
        
        // Calculate basic statistics
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

        // Get payment analytics
        try {
          const paymentAnalytics = await trackingService.getPaymentAnalytics();
          if (paymentAnalytics) {
            stats.paymentAnalytics = paymentAnalytics;
          }
        } catch (error) {
          console.warn('Payment analytics warning:', error.message);
        }

        res.json({
          success: true,
          data: stats
        });
        break;

      case 'submissions':
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        const { status, limit = 50, offset = 0 } = req.query;
        let adminSubmissions = await googleSheetsService.getAllSubmissions();

        // Filter by status if provided
        if (status) {
          adminSubmissions = adminSubmissions.filter(sub => sub.status === status);
        }

        // Apply pagination
        const paginatedSubmissions = adminSubmissions.slice(offset, offset + parseInt(limit));

        res.json({
          success: true,
          data: {
            submissions: paginatedSubmissions,
            total: adminSubmissions.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
          }
        });
        break;

      case 'follow-ups':
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

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
        break;

      case 'trigger-follow-ups':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        await schedulerService.triggerFollowUpCheck();
        
        res.json({
          success: true,
          message: 'Follow-up check triggered successfully'
        });
        break;

      case 'send-email':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

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
        break;

      case 'health':
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

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
          await emailService.transporter.verify();
          health.services.email = 'healthy';
        } catch (error) {
          health.services.email = 'error';
        }

        // Check scheduler (always running in serverless)
        health.services.scheduler = 'running';

        res.json({
          success: true,
          data: health
        });
        break;

      default:
        res.status(404).json({ error: 'Admin route not found' });
    }
  } catch (error) {
    console.error(`❌ Error in admin route ${adminRoute}:`, error);
    res.status(500).json({
      error: `Failed to process admin request: ${adminRoute}`
    });
  }
};