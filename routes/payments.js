const express = require('express');
const router = express.Router();
const path = require('path');
const googleSheetsService = require('../services/googleSheetsService');
const { v4: uuidv4 } = require('uuid');

// Payment page route
router.get('/', (req, res) => {
    // Extract email and tracking ID from query parameters
    const { email, trackingId } = req.query;
    
    if (!email) {
        return res.status(400).send('Email parameter is required');
    }
    
    // Serve the payment page
    res.sendFile(path.join(__dirname, '../public/payment.html'));
});

// Process payment (simulation)
router.post('/process', async (req, res) => {
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
});

// Payment success callback (for external payment processors)
router.get('/success', async (req, res) => {
    try {
        const { email, transaction_id } = req.query;
        
        if (email) {
            await googleSheetsService.updateStatus(email, 'Paid');
            console.log(`✅ Payment confirmed via callback for ${email}`);
        }
        
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
});

// Payment failure callback (for external payment processors)
router.get('/failed', async (req, res) => {
    try {
        const { email, error_message } = req.query;
        
        if (email) {
            await googleSheetsService.updateStatus(email, 'Payment Failed');
            console.log(`❌ Payment failed via callback for ${email}: ${error_message}`);
        }
        
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
});

module.exports = router;