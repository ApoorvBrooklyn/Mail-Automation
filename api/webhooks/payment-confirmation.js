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
    const { email, paymentId, amount, status, signature } = req.body;

    // Validate required fields
    if (!email || !paymentId || !status) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['email', 'paymentId', 'status']
      });
    }

    // In a real implementation, you would verify the webhook signature
    // to ensure it's coming from your payment gateway
    if (signature && !verifyWebhookSignature(req.body, signature)) {
      return res.status(401).json({
        error: 'Invalid webhook signature'
      });
    }

    console.log(`📦 Received payment webhook for ${email}: ${status}`);

    // Process the payment status
    if (status === 'succeeded' || status === 'completed') {
      await trackingService.trackPaymentSuccess(email);
      console.log(`✅ Payment confirmed for ${email}`);
    } else if (status === 'failed' || status === 'cancelled') {
      await trackingService.trackPaymentFailure(email);
      console.log(`❌ Payment failed for ${email}`);
    } else {
      console.log(`⚠️ Unknown payment status for ${email}: ${status}`);
    }

    res.json({
      success: true,
      message: `Payment status processed: ${status}`,
      data: {
        email,
        paymentId,
        status,
        processedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error processing payment webhook:', error);
    res.status(500).json({
      error: 'Failed to process payment webhook'
    });
  }
};

// Webhook signature verification (placeholder)
function verifyWebhookSignature(payload, signature) {
  // In a real implementation, you would verify the signature
  // using your payment gateway's public key and the payload
  console.log('🔐 Webhook signature verification (placeholder)');
  return true; // For demo purposes, always return true
}