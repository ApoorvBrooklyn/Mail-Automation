require('dotenv').config();
const trackingService = require('../services/trackingService');

module.exports = async (req, res) => {
  // Enable CORS for POST requests
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
  // /api/tracking/pixel/[trackingId]
  // /api/tracking/link/[trackingId]
  // /api/tracking/reply/[trackingId]
  // /api/tracking/payment/[trackingId]
  // /api/tracking/payment-success
  // /api/tracking/payment-failed
  // /api/tracking/payment-page-visit
  // /api/tracking/payment-abandonment

  if (pathParts.length < 3 || pathParts[1] !== 'tracking') {
    return res.status(404).json({ error: 'Route not found' });
  }

  const trackingRoute = pathParts[2];

  try {
    switch (trackingRoute) {
      case 'pixel':
        // Handle /api/tracking/pixel/[trackingId]
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        const { email: pixelEmail } = req.query;
        
        if (!pixelEmail) {
          console.error('❌ No email provided for pixel tracking');
          const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
          res.writeHead(400, {
            'Content-Type': 'image/gif',
            'Content-Length': pixel.length
          });
          return res.end(pixel);
        }

        await trackingService.trackEmailOpen(pixelEmail);

        // Return a 1x1 transparent GIF
        const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
        res.writeHead(200, {
          'Content-Type': 'image/gif',
          'Content-Length': pixel.length,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        });
        res.end(pixel);
        break;

      case 'link':
        // Handle /api/tracking/link/[trackingId]
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        const { email: linkEmail, url: linkUrl } = req.query;
        
        if (!linkEmail || !linkUrl) {
          console.error('❌ Missing email or url for link tracking');
          return res.status(400).send('Missing email or url parameter');
        }

        await trackingService.trackLinkClick(linkEmail, linkUrl);

        // Redirect to the original URL
        res.redirect(linkUrl);
        break;

      case 'reply':
        // Handle /api/tracking/reply/[trackingId]
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        const { email: replyEmail } = req.query;
        
        if (!replyEmail) {
          console.error('❌ No email provided for reply tracking');
          return res.status(400).send('Missing email parameter');
        }

        await trackingService.trackReplyClick(replyEmail);

        // Show a simple reply page
        res.setHeader('Content-Type', 'text/html');
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Reply to Consulting Cohort 101</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
              .container { background: #f9f9f9; padding: 30px; border-radius: 10px; }
              .success { color: #28a745; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>📧 Reply Sent Successfully!</h1>
              <p class="success">Your reply has been recorded and our team will get back to you soon.</p>
              <p>Thank you for your interest in Consulting Cohort 101!</p>
              <p><a href="mailto:${process.env.EMAIL_USER}">Click here to send an email directly</a></p>
            </div>
          </body>
          </html>
        `);
        break;

      case 'payment':
        // Handle /api/tracking/payment/[trackingId]
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        const { email: paymentEmail } = req.query;
        
        if (!paymentEmail) {
          return res.status(400).send('Missing email parameter');
        }

        res.setHeader('Content-Type', 'text/html');
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Complete Payment - Consulting Cohort 101</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
              .container { background: #f9f9f9; padding: 30px; border-radius: 10px; }
              .payment-form { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
              .button { display: inline-block; padding: 15px 30px; margin: 10px; text-decoration: none; border-radius: 5px; font-weight: bold; }
              .success { background: #28a745; color: white; }
              .cancel { background: #dc3545; color: white; }
              .amount { font-size: 24px; font-weight: bold; color: #28a745; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>💳 Complete Your Payment</h1>
              <p>You're almost there! Complete your payment to secure your spot in Consulting Cohort 101.</p>
              
              <div class="payment-form">
                <h2>Payment Summary</h2>
                <p><strong>Program:</strong> Consulting Cohort 101</p>
                <p><strong>Duration:</strong> 8 weeks</p>
                <p><strong>Amount:</strong> <span class="amount">$997</span></p>
                
                <p><em>This is a simulation. Click the buttons below to test the payment flow.</em></p>
                
                <div style="text-align: center;">
                  <a href="/api/tracking/payment-success?email=${encodeURIComponent(paymentEmail)}" class="button success">✅ Confirm Payment</a>
                  <a href="/api/tracking/payment-failed?email=${encodeURIComponent(paymentEmail)}" class="button cancel">❌ Cancel Payment</a>
                </div>
              </div>
            </div>
          </body>
          </html>
        `);
        break;

      case 'payment-success':
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        const { email: successEmail } = req.query;
        
        if (!successEmail) {
          return res.status(400).send('Missing email parameter');
        }

        await trackingService.trackPaymentSuccess(successEmail);

        res.setHeader('Content-Type', 'text/html');
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Payment Successful - Consulting Cohort 101</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
              .container { background: #f9f9f9; padding: 30px; border-radius: 10px; text-align: center; }
              .success { color: #28a745; font-size: 24px; font-weight: bold; }
              .checkmark { font-size: 48px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="checkmark">✅</div>
              <h1 class="success">Payment Successful!</h1>
              <h2>Welcome to Consulting Cohort 101!</h2>
              <p>Your payment has been processed successfully. You're now officially enrolled in our program!</p>
              <p>You'll receive a welcome email with program details and next steps within the next 24 hours.</p>
              <p><strong>Thank you for choosing Consulting Cohort 101!</strong></p>
            </div>
          </body>
          </html>
        `);
        break;

      case 'payment-failed':
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        const { email: failedEmail } = req.query;
        
        if (!failedEmail) {
          return res.status(400).send('Missing email parameter');
        }

        await trackingService.trackPaymentFailure(failedEmail);

        res.setHeader('Content-Type', 'text/html');
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Payment Failed - Consulting Cohort 101</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
              .container { background: #f9f9f9; padding: 30px; border-radius: 10px; text-align: center; }
              .error { color: #dc3545; font-size: 24px; font-weight: bold; }
              .x-mark { font-size: 48px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="x-mark">❌</div>
              <h1 class="error">Payment Failed</h1>
              <p>We're sorry, but your payment could not be processed at this time.</p>
              <p>This could be due to:</p>
              <ul style="text-align: left; max-width: 400px; margin: 20px auto;">
                <li>Insufficient funds</li>
                <li>Card declined</li>
                <li>Network issues</li>
                <li>Invalid payment information</li>
              </ul>
              <p>Please try again or contact our support team for assistance.</p>
              <p><a href="mailto:${process.env.EMAIL_USER}">Contact Support</a></p>
            </div>
          </body>
          </html>
        `);
        break;

      case 'payment-page-visit':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        const { email: visitEmail, trackingId, timestamp, userAgent, referrer } = req.body;
        
        if (!visitEmail) {
          return res.status(400).json({ error: 'Email is required' });
        }

        // Update status to indicate user clicked payment link
        await trackingService.trackPaymentPageVisit(visitEmail, {
          trackingId,
          timestamp,
          userAgent,
          referrer
        });

        console.log(`💳 Payment page visit tracked for ${visitEmail}`);
        
        res.json({
          success: true,
          message: 'Payment page visit tracked'
        });
        break;

      case 'payment-abandonment':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        const { email: abandonEmail, timestamp: abandonTimestamp, timeOnPage } = req.body;
        
        if (!abandonEmail) {
          return res.status(400).json({ error: 'Email is required' });
        }

        // Check if payment was completed during the session
        const submission = await trackingService.checkSubmissionStatus(abandonEmail);
        if (submission && submission.status === 'Paid') {
          console.log(`⏭️ Skipping abandonment tracking for ${abandonEmail} - payment completed`);
          return res.json({
            success: true,
            message: 'Payment completed, abandonment not tracked'
          });
        }

        // Track abandonment
        await trackingService.trackPaymentAbandonment(abandonEmail, {
          timestamp: abandonTimestamp,
          timeOnPage
        });

        console.log(`🚪 Payment abandonment tracked for ${abandonEmail} (${timeOnPage}s on page)`);
        
        res.json({
          success: true,
          message: 'Payment abandonment tracked'
        });
        break;

      default:
        res.status(404).json({ error: 'Tracking route not found' });
    }
  } catch (error) {
    console.error(`❌ Error in tracking route ${trackingRoute}:`, error);
    
    // For pixel tracking, still return a pixel on error
    if (trackingRoute === 'pixel') {
      const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      res.writeHead(200, {
        'Content-Type': 'image/gif',
        'Content-Length': pixel.length
      });
      res.end(pixel);
    } else if (trackingRoute === 'link') {
      // For link tracking, still try to redirect
      const { url: linkUrl } = req.query;
      if (linkUrl) {
        res.redirect(linkUrl);
      } else {
        res.status(500).send('Tracking error');
      }
    } else {
      res.status(500).json({
        error: `Failed to process tracking request: ${trackingRoute}`
      });
    }
  }
};