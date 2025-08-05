require('dotenv').config();
const schedulerService = require('../../services/schedulerService');

module.exports = async (req, res) => {
  // This is the Vercel Cron endpoint that replaces the traditional cron job
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verify that this is coming from Vercel Cron (optional security measure)
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🕒 Scheduled job triggered via Vercel Cron');
    
    // Run the follow-up check
    await schedulerService.triggerFollowUpCheck();
    
    // Run the final reminder check
    await schedulerService.triggerFinalReminderCheck();
    
    res.json({
      success: true,
      message: 'Scheduled tasks executed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error running scheduled tasks:', error);
    res.status(500).json({
      error: 'Failed to run scheduled tasks',
      message: error.message
    });
  }
};