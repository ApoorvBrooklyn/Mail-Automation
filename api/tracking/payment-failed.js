require('dotenv').config();
const trackingService = require('../../services/trackingService');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).send('Missing email parameter');
    }

    await trackingService.trackPaymentFailure(email);

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

  } catch (error) {
    console.error('❌ Error processing payment failure:', error);
    res.status(500).send('Error processing payment');
  }
};