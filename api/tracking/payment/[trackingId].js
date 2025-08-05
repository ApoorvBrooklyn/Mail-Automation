require('dotenv').config();

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.query;
    
    if (!email) {
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
};