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

    await trackingService.trackPaymentSuccess(email);

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

  } catch (error) {
    console.error('❌ Error processing payment success:', error);
    res.status(500).send('Error processing payment');
  }
};