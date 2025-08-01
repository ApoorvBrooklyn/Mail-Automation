// Get URL parameters
function getUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        email: urlParams.get('email'),
        trackingId: urlParams.get('trackingId')
    };
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    const params = getUrlParams();
    
    if (params.email) {
        document.getElementById('userEmail').textContent = params.email;
        document.getElementById('registrationId').textContent = params.trackingId || 'N/A';
        
        // Track that user visited the payment page (clicked payment link)
        trackPaymentPageVisit(params.email, params.trackingId);
    } else {
        document.getElementById('userEmail').textContent = 'Unknown';
        document.getElementById('registrationId').textContent = 'N/A';
    }

    // Add event listeners to payment buttons
    const successBtn = document.getElementById('successBtn');
    const failureBtn = document.getElementById('failureBtn');
    
    if (successBtn) {
        successBtn.addEventListener('click', function() {
            console.log('Success button clicked');
            processPayment(true);
        });
    }
    
    if (failureBtn) {
        failureBtn.addEventListener('click', function() {
            console.log('Failure button clicked');
            processPayment(false);
        });
    }
    
    // Track payment abandonment after 5 minutes of inactivity
    if (params.email) {
        setTimeout(() => {
            trackPaymentAbandonment(params.email);
        }, 5 * 60 * 1000); // 5 minutes
    }
    
    console.log('Payment page initialized');
});

// Track payment page visit (when user clicks payment link from email)
async function trackPaymentPageVisit(email, trackingId) {
    try {
        console.log('Tracking payment page visit for:', email);
        
        const response = await fetch('/api/tracking/payment-page-visit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                trackingId: trackingId,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                referrer: document.referrer
            })
        });
        
        if (response.ok) {
            console.log('✅ Payment page visit tracked');
        } else {
            console.warn('⚠️ Failed to track payment page visit');
        }
    } catch (error) {
        console.error('❌ Error tracking payment page visit:', error);
    }
}

// Track payment abandonment (user visited but didn't complete payment)
async function trackPaymentAbandonment(email) {
    try {
        // Check if payment was already completed
        const currentStatus = await checkPaymentStatus(email);
        if (currentStatus === 'Paid') {
            console.log('Payment already completed, not tracking abandonment');
            return;
        }
        
        console.log('Tracking payment abandonment for:', email);
        
        const response = await fetch('/api/tracking/payment-abandonment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                timestamp: new Date().toISOString(),
                timeOnPage: 5 * 60 // 5 minutes in seconds
            })
        });
        
        if (response.ok) {
            console.log('✅ Payment abandonment tracked');
        }
    } catch (error) {
        console.error('❌ Error tracking payment abandonment:', error);
    }
}

// Check current payment status
async function checkPaymentStatus(email) {
    try {
        const response = await fetch(`/api/submissions/${encodeURIComponent(email)}`);
        if (response.ok) {
            const result = await response.json();
            return result.data.status;
        }
    } catch (error) {
        console.error('Error checking payment status:', error);
    }
    return null;
}

async function processPayment(isSuccess) {
    console.log('processPayment called with:', isSuccess);
    const params = getUrlParams();
    console.log('URL params:', params);
    
    if (!params.email) {
        console.error('No email found in URL parameters');
        alert('Error: No email found in URL parameters. Please access this page through a payment link from your email.');
        return;
    }

    console.log('Starting payment process...');
    // Show loading
    showLoading();

    try {
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        const response = await fetch('/api/payment/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: params.email,
                trackingId: params.trackingId,
                success: isSuccess,
                amount: 997
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            if (isSuccess) {
                showSuccess(result);
            } else {
                showFailure(result);
            }
        } else {
            showError(result.error || 'Payment processing failed');
        }
    } catch (error) {
        console.error('Payment error:', error);
        showError('Network error. Please try again.');
    }
}

function showLoading() {
    document.querySelector('.payment-section').style.display = 'none';
    document.getElementById('loading').style.display = 'block';
    document.getElementById('resultMessage').style.display = 'none';
}

function showSuccess(result) {
    document.getElementById('loading').style.display = 'none';
    const resultDiv = document.getElementById('resultMessage');
    const titleEl = document.getElementById('resultTitle');
    const textEl = document.getElementById('resultText');
    
    resultDiv.className = 'result-message success';
    titleEl.textContent = '🎉 Payment Successful!';
    textEl.innerHTML = `
        <p><strong>Thank you for your payment!</strong></p>
        <p>Your spot in Consulting Cohort 101 is now secured.</p>
        <p><strong>Transaction ID:</strong> ${result.transactionId}</p>
        <p><strong>Amount:</strong> $997</p>
        <p>You will receive a confirmation email shortly with program details and next steps.</p>
        <p>Welcome to the cohort! 🚀</p>
    `;
    
    resultDiv.style.display = 'block';
    
    // Add event listener to try again button
    const tryAgainBtn = resultDiv.querySelector('.try-again-btn');
    if (tryAgainBtn) {
        tryAgainBtn.addEventListener('click', function() {
            location.reload();
        });
    }
}

function showFailure(result) {
    document.getElementById('loading').style.display = 'none';
    const resultDiv = document.getElementById('resultMessage');
    const titleEl = document.getElementById('resultTitle');
    const textEl = document.getElementById('resultText');
    
    resultDiv.className = 'result-message error';
    titleEl.textContent = '❌ Payment Failed';
    textEl.innerHTML = `
        <p><strong>Payment could not be processed.</strong></p>
        <p><strong>Reason:</strong> ${result.reason || 'Payment declined'}</p>
        <p>Your spot is still reserved for 24 hours.</p>
        <p>Please try again or contact support if you continue experiencing issues.</p>
        <button class="payment-btn try-again-btn" style="margin-top: 20px;">
            🔄 Try Again
        </button>
    `;
    
    resultDiv.style.display = 'block';
    
    // Add event listener to try again button
    const tryAgainBtn = resultDiv.querySelector('.try-again-btn');
    if (tryAgainBtn) {
        tryAgainBtn.addEventListener('click', function() {
            location.reload();
        });
    }
}

function showError(message) {
    document.getElementById('loading').style.display = 'none';
    const resultDiv = document.getElementById('resultMessage');
    const titleEl = document.getElementById('resultTitle');
    const textEl = document.getElementById('resultText');
    
    resultDiv.className = 'result-message error';
    titleEl.textContent = '⚠️ Error';
    textEl.innerHTML = `
        <p>${message}</p>
        <button class="payment-btn try-again-btn" style="margin-top: 20px;">
            🔄 Try Again
        </button>
    `;
    
    resultDiv.style.display = 'block';
    
    // Add event listener to try again button
    const tryAgainBtn = resultDiv.querySelector('.try-again-btn');
    if (tryAgainBtn) {
        tryAgainBtn.addEventListener('click', function() {
            location.reload();
        });
    }
}