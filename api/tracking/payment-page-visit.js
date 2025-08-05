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
    const { email, trackingId, timestamp, userAgent, referrer } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Update status to indicate user clicked payment link
    await trackingService.trackPaymentPageVisit(email, {
      trackingId,
      timestamp,
      userAgent,
      referrer
    });

    console.log(`💳 Payment page visit tracked for ${email}`);
    
    res.json({
      success: true,
      message: 'Payment page visit tracked'
    });

  } catch (error) {
    console.error('❌ Error tracking payment page visit:', error);
    res.status(500).json({
      error: 'Failed to track payment page visit'
    });
  }
};