const express = require('express');
const router = express.Router();
const trackingService = require('../services/trackingService');

// Track email opens via pixel
router.get('/pixel/:trackingId', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      console.error('❌ No email provided for pixel tracking');
      return res.status(400).send('Missing email parameter');
    }

    await trackingService.trackEmailOpen(email);

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

  } catch (error) {
    console.error('❌ Error tracking email open:', error);
    // Still return the pixel even if tracking fails
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length
    });
    res.end(pixel);
  }
});

// Track link clicks and redirect
router.get('/link/:trackingId', async (req, res) => {
  try {
    const { email, url } = req.query;
    
    if (!email || !url) {
      console.error('❌ Missing email or url for link tracking');
      return res.status(400).send('Missing email or url parameter');
    }

    await trackingService.trackLinkClick(email, url);

    // Redirect to the original URL
    res.redirect(url);

  } catch (error) {
    console.error('❌ Error tracking link click:', error);
    // Still redirect even if tracking fails
    const { url } = req.query;
    if (url) {
      res.redirect(url);
    } else {
      res.status(500).send('Tracking error');
    }
  }
});

// Track reply clicks
router.get('/reply/:trackingId', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      console.error('❌ No email provided for reply tracking');
      return res.status(400).send('Missing email parameter');
    }

    await trackingService.trackReplyClick(email);

    // Show a simple reply page
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

  } catch (error) {
    console.error('❌ Error tracking reply click:', error);
    res.status(500).send('Error processing reply');
  }
});

// Payment simulation page
router.get('/payment/:trackingId', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).send('Missing email parameter');
    }

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
              <a href="/api/tracking/payment-success?email=${encodeURIComponent(email)}" class="button success">✅ Confirm Payment</a>
              <a href="/api/tracking/payment-failed?email=${encodeURIComponent(email)}" class="button cancel">❌ Cancel Payment</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('❌ Error showing payment page:', error);
    res.status(500).send('Error loading payment page');
  }
});

// Payment success
router.get('/payment-success', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).send('Missing email parameter');
    }

    await trackingService.trackPaymentSuccess(email);

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

  } catch (error) {
    console.error('❌ Error processing payment success:', error);
    res.status(500).send('Error processing payment');
  }
});

// Payment failed
router.get('/payment-failed', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).send('Missing email parameter');
    }

    await trackingService.trackPaymentFailure(email);

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

  } catch (error) {
    console.error('❌ Error processing payment failure:', error);
    res.status(500).send('Error processing payment');
  }
});

// Track payment page visits (when users click payment links from emails)
router.post('/payment-page-visit', async (req, res) => {
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
});

// Track payment abandonment (users who visited but didn't complete payment)
router.post('/payment-abandonment', async (req, res) => {
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
});

module.exports = router; 