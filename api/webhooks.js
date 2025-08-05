require('dotenv').config();
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

  // Parse the request path to determine the route
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathParts = url.pathname.split('/').filter(Boolean);
  
  // Routes:
  // /api/webhooks/payment-confirmation
  // /api/webhooks/email-events
  // /api/webhooks/test
  // /api/webhooks/scheduler

  if (pathParts.length !== 3 || pathParts[1] !== 'webhooks') {
    return res.status(404).json({ error: 'Route not found' });
  }

  const webhookRoute = pathParts[2];

  try {
    switch (webhookRoute) {
      case 'payment-confirmation':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

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
        break;

      case 'email-events':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        const { email: eventEmail, event, timestamp, messageId } = req.body;

        // Validate required fields
        if (!eventEmail || !event) {
          return res.status(400).json({
            error: 'Missing required fields',
            required: ['email', 'event']
          });
        }

        console.log(`📧 Received email event for ${eventEmail}: ${event}`);

        // Process email events
        switch (event) {
          case 'delivered':
            console.log(`✅ Email delivered to ${eventEmail}`);
            break;
          case 'opened':
            await trackingService.trackEmailOpen(eventEmail);
            console.log(`👁️ Email opened by ${eventEmail}`);
            break;
          case 'clicked':
            // This would typically include the clicked URL
            console.log(`🔗 Email link clicked by ${eventEmail}`);
            break;
          case 'bounced':
            console.log(`❌ Email bounced for ${eventEmail}`);
            break;
          case 'complained':
            console.log(`🚫 Email complaint from ${eventEmail}`);
            break;
          default:
            console.log(`ℹ️ Unknown email event for ${eventEmail}: ${event}`);
        }

        res.json({
          success: true,
          message: `Email event processed: ${event}`,
          data: {
            email: eventEmail,
            event,
            timestamp,
            messageId,
            processedAt: new Date().toISOString()
          }
        });
        break;

      case 'test':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

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
        break;

      case 'scheduler':
        // This is the Vercel Cron endpoint that replaces the traditional cron job
        if (req.method !== 'GET' && req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        // Verify that this is coming from Vercel Cron (optional security measure)
        const authHeader = req.headers.authorization;
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

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
        break;

      default:
        res.status(404).json({ error: 'Webhook route not found' });
    }
  } catch (error) {
    console.error(`❌ Error in webhook route ${webhookRoute}:`, error);
    res.status(500).json({
      error: `Failed to process webhook request: ${webhookRoute}`,
      message: error.message
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