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
    const { email, transaction_id } = req.query;
    
    if (email) {
      await googleSheetsService.updateStatus(email, 'Paid');
      console.log(`✅ Payment confirmed via callback for ${email}`);
    }
    
    res.setHeader('Content-Type', 'text/html');
    res.send(`
        <html>
            <head><title>Payment Successful</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h1>🎉 Payment Successful!</h1>
                <p>Thank you for your payment. Your registration is now complete.</p>
                <p>You should receive a confirmation email shortly.</p>
            </body>
        </html>
    `);
  } catch (error) {
    console.error('❌ Error in payment success callback:', error);
    res.status(500).send('Error processing payment confirmation');
  }
};