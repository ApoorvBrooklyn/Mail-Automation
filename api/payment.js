require('dotenv').config();
const googleSheetsService = require('../services/googleSheetsService');
const { v4: uuidv4 } = require('uuid');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Initialize services if not already initialized
    if (!googleSheetsService.isInitialized) {
      await googleSheetsService.initialize();
    }
  } catch (error) {
    console.warn('Service initialization warning:', error.message);
  }

  // Parse the request path to determine the route
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathParts = url.pathname.split('/').filter(Boolean);
  
  // Routes:
  // /api/payment -> payment page redirect
  // /api/payment/process -> payment processing
  // /api/payment/success -> success callback
  // /api/payment/failed -> failure callback

  if (pathParts.length < 2 || pathParts[1] !== 'payment') {
    return res.status(404).json({ error: 'Route not found' });
  }

  const paymentRoute = pathParts[2] || 'index';

  try {
    switch (paymentRoute) {
      case 'index':
        // Handle /api/payment
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        // Extract email and tracking ID from query parameters
        const { email, trackingId } = req.query;
        
        if (!email) {
          return res.status(400).send('Email parameter is required');
        }
        
        // Redirect to the payment page (served from public folder by Vercel)
        res.redirect(`/payment.html?email=${encodeURIComponent(email)}&trackingId=${trackingId || ''}`);
        break;

      case 'process':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        const { email: processEmail, trackingId: processTrackingId, success, amount } = req.body;

        if (!processEmail) {
          return res.status(400).json({
            error: 'Email is required'
          });
        }

        // Check if submission exists
        const submission = await googleSheetsService.getSubmissionByEmail(processEmail);
        if (!submission) {
          return res.status(404).json({
            error: 'Submission not found'
          });
        }

        // Generate a mock transaction ID
        const transactionId = `TXN-${uuidv4().slice(0, 8).toUpperCase()}`;

        if (success) {
          // Simulate successful payment
          await googleSheetsService.updateStatus(processEmail, 'Paid');
          
          console.log(`✅ Payment successful for ${processEmail} - Amount: $${amount}`);
          
          res.json({
            success: true,
            message: 'Payment processed successfully',
            transactionId: transactionId,
            amount: amount,
            status: 'paid'
          });
        } else {
          // Simulate failed payment
          await googleSheetsService.updateStatus(processEmail, 'Payment Failed');
          
          console.log(`❌ Payment failed for ${processEmail} - Amount: $${amount}`);
          
          res.json({
            success: true,
            message: 'Payment simulation completed (failure)',
            reason: 'Card declined - insufficient funds',
            status: 'failed'
          });
        }
        break;

      case 'success':
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        const { email: successEmail, transaction_id } = req.query;
        
        if (successEmail) {
          await googleSheetsService.updateStatus(successEmail, 'Paid');
          console.log(`✅ Payment confirmed via callback for ${successEmail}`);
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
        break;

      case 'failed':
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        const { email: failedEmail, error_message } = req.query;
        
        if (failedEmail) {
          await googleSheetsService.updateStatus(failedEmail, 'Payment Failed');
          console.log(`❌ Payment failed via callback for ${failedEmail}: ${error_message}`);
        }
        
        res.setHeader('Content-Type', 'text/html');
        res.send(`
            <html>
                <head><title>Payment Failed</title></head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1>❌ Payment Failed</h1>
                    <p>Unfortunately, your payment could not be processed.</p>
                    <p>Please try again or contact support for assistance.</p>
                    <p><a href="/payment?email=${failedEmail}" style="color: #667eea;">Try Again</a></p>
                </body>
            </html>
        `);
        break;

      default:
        res.status(404).json({ error: 'Payment route not found' });
    }
  } catch (error) {
    console.error(`❌ Error in payment route ${paymentRoute}:`, error);
    res.status(500).json({
      error: `Failed to process payment request: ${paymentRoute}`,
      message: 'Please try again later'
    });
  }
};