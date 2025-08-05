require('dotenv').config();
const schedulerService = require('../../services/schedulerService');

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
};