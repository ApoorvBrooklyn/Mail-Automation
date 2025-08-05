require('dotenv').config();
const googleSheetsService = require('../../services/googleSheetsService');
const { v4: uuidv4 } = require('uuid');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
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
    const { email, trackingId, success, amount } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required'
      });
    }

    // Check if submission exists
    const submission = await googleSheetsService.getSubmissionByEmail(email);
    if (!submission) {
      return res.status(404).json({
        error: 'Submission not found'
      });
    }

    // Generate a mock transaction ID
    const transactionId = `TXN-${uuidv4().slice(0, 8).toUpperCase()}`;

    if (success) {
      // Simulate successful payment
      await googleSheetsService.updateStatus(email, 'Paid');
      
      console.log(`✅ Payment successful for ${email} - Amount: $${amount}`);
      
      res.json({
        success: true,
        message: 'Payment processed successfully',
        transactionId: transactionId,
        amount: amount,
        status: 'paid'
      });
    } else {
      // Simulate failed payment
      await googleSheetsService.updateStatus(email, 'Payment Failed');
      
      console.log(`❌ Payment failed for ${email} - Amount: $${amount}`);
      
      res.json({
        success: true,
        message: 'Payment simulation completed (failure)',
        reason: 'Card declined - insufficient funds',
        status: 'failed'
      });
    }

  } catch (error) {
    console.error('❌ Error processing payment:', error);
    res.status(500).json({
      error: 'Payment processing failed',
      message: 'Please try again later'
    });
  }
};