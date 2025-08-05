require('dotenv').config();
const trackingService = require('../../services/trackingService');

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
    const { email, timestamp, timeOnPage } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if payment was completed during the session
    const submission = await trackingService.checkSubmissionStatus(email);
    if (submission && submission.status === 'Paid') {
      console.log(`⏭️ Skipping abandonment tracking for ${email} - payment completed`);
      return res.json({
        success: true,
        message: 'Payment completed, abandonment not tracked'
      });
    }

    // Track abandonment
    await trackingService.trackPaymentAbandonment(email, {
      timestamp,
      timeOnPage
    });

    console.log(`🚪 Payment abandonment tracked for ${email} (${timeOnPage}s on page)`);
    
    res.json({
      success: true,
      message: 'Payment abandonment tracked'
    });

  } catch (error) {
    console.error('❌ Error tracking payment abandonment:', error);
    res.status(500).json({
      error: 'Failed to track payment abandonment'
    });
  }
};