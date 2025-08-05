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
    const { email, event, timestamp, messageId } = req.body;

    // Validate required fields
    if (!email || !event) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['email', 'event']
      });
    }

    console.log(`📧 Received email event for ${email}: ${event}`);

    // Process email events
    switch (event) {
      case 'delivered':
        console.log(`✅ Email delivered to ${email}`);
        break;
      case 'opened':
        await trackingService.trackEmailOpen(email);
        console.log(`👁️ Email opened by ${email}`);
        break;
      case 'clicked':
        // This would typically include the clicked URL
        console.log(`🔗 Email link clicked by ${email}`);
        break;
      case 'bounced':
        console.log(`❌ Email bounced for ${email}`);
        break;
      case 'complained':
        console.log(`🚫 Email complaint from ${email}`);
        break;
      default:
        console.log(`ℹ️ Unknown email event for ${email}: ${event}`);
    }

    res.json({
      success: true,
      message: `Email event processed: ${event}`,
      data: {
        email,
        event,
        timestamp,
        messageId,
        processedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error processing email webhook:', error);
    res.status(500).json({
      error: 'Failed to process email webhook'
    });
  }
};