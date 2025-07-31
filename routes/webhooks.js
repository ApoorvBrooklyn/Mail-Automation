const express = require('express');
const router = express.Router();
const trackingService = require('../services/trackingService');

// Simulate payment webhook from third-party payment gateway
router.post('/payment-confirmation', async (req, res) => {
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
});

// Simulate email service webhook for email events
router.post('/email-events', async (req, res) => {
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
});

// Test webhook endpoint
router.post('/test', async (req, res) => {
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
});

// Webhook signature verification (placeholder)
function verifyWebhookSignature(payload, signature) {
  // In a real implementation, you would verify the signature
  // using your payment gateway's public key and the payload
  console.log('🔐 Webhook signature verification (placeholder)');
  return true; // For demo purposes, always return true
}

module.exports = router; 