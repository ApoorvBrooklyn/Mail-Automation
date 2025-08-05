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
    const { type, data } = req.body;

    console.log(`🧪 Test webhook received: ${type}`);

    switch (type) {
      case 'payment_success':
        if (data.email) {
          await trackingService.trackPaymentSuccess(data.email);
        }
        break;
      case 'payment_failure':
        if (data.email) {
          await trackingService.trackPaymentFailure(data.email);
        }
        break;
      case 'email_open':
        if (data.email) {
          await trackingService.trackEmailOpen(data.email);
        }
        break;
      case 'link_click':
        if (data.email && data.url) {
          await trackingService.trackLinkClick(data.email, data.url);
        }
        break;
      case 'reply':
        if (data.email) {
          await trackingService.trackReplyClick(data.email);
        }
        break;
      default:
        console.log(`⚠️ Unknown test webhook type: ${type}`);
    }

    res.json({
      success: true,
      message: `Test webhook processed: ${type}`,
      data: {
        type,
        data,
        processedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error processing test webhook:', error);
    res.status(500).json({
      error: 'Failed to process test webhook'
    });
  }
};