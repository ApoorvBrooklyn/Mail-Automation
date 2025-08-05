require('dotenv').config();
const googleSheetsService = require('../../services/googleSheetsService');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize services if not already initialized
    if (!googleSheetsService.isInitialized) {
      await googleSheetsService.initialize();
    }
  } catch (error) {
    console.warn('Service initialization warning:', error.message);
  }

  try {
    const { email, error_message } = req.query;
    
    if (email) {
      await googleSheetsService.updateStatus(email, 'Payment Failed');
      console.log(`❌ Payment failed via callback for ${email}: ${error_message}`);
    }
    
    res.setHeader('Content-Type', 'text/html');
    res.send(`
        <html>
            <head><title>Payment Failed</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h1>❌ Payment Failed</h1>
                <p>Unfortunately, your payment could not be processed.</p>
                <p>Please try again or contact support for assistance.</p>
                <p><a href="/payment?email=${email}" style="color: #667eea;">Try Again</a></p>
            </body>
        </html>
    `);
  } catch (error) {
    console.error('❌ Error in payment failure callback:', error);
    res.status(500).send('Error processing payment failure');
  }
};