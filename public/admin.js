// Load data on page load
document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    loadSubmissions();
    
    // Add event listeners to buttons
    const refreshBtn = document.getElementById('refreshBtn');
    const triggerFollowUpsBtn = document.getElementById('triggerFollowUpsBtn');
    const sendTestEmailBtn = document.getElementById('sendTestEmailBtn');
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            console.log('Refresh button clicked');
            loadSubmissions();
        });
    }
    
    if (triggerFollowUpsBtn) {
        triggerFollowUpsBtn.addEventListener('click', function() {
            console.log('Trigger follow-ups button clicked');
            triggerFollowUps();
        });
    }
    
    if (sendTestEmailBtn) {
        sendTestEmailBtn.addEventListener('click', function() {
            console.log('Send test email button clicked');
            sendTestEmail();
        });
    }
    
    console.log('Admin dashboard initialized');
});

async function loadStats() {
    try {
        const response = await fetch('/api/admin/stats');
        const result = await response.json();
        
        if (result.success) {
            const data = result.data;
            
            // Basic stats
            document.getElementById('totalSubmissions').textContent = data.total || 0;
            document.getElementById('conversionRate').textContent = (data.conversionRate || 0) + '%';
            document.getElementById('paidCount').textContent = data.byStatus['Paid'] || 0;
            document.getElementById('emailsSent').textContent = data.byStatus['Email Sent'] || 0;
            
            // Payment analytics
            if (data.paymentAnalytics) {
                const analytics = data.paymentAnalytics;
                document.getElementById('paymentLinksClicked').textContent = analytics.paymentLinksClicked || 0;
                document.getElementById('clickThroughRate').textContent = (analytics.clickThroughRate || 0) + '%';
                document.getElementById('paymentConversionRate').textContent = (analytics.conversionRate || 0) + '%';
                document.getElementById('abandonmentRate').textContent = (analytics.abandonmentRate || 0) + '%';
                document.getElementById('paymentsAbandoned').textContent = analytics.paymentsAbandoned || 0;
                document.getElementById('paymentsFailed').textContent = analytics.paymentsFailed || 0;
            }
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadSubmissions() {
    try {
        const response = await fetch('/api/admin/submissions');
        const result = await response.json();
        
        if (result.success) {
            const submissions = result.data.submissions;
            displaySubmissions(submissions);
        }
    } catch (error) {
        console.error('Error loading submissions:', error);
    }
}

function displaySubmissions(submissions) {
    const tableDiv = document.getElementById('submissionsTable');
    
    if (submissions.length === 0) {
        tableDiv.innerHTML = '<p>No submissions found</p>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Timestamp</th>
                </tr>
            </thead>
            <tbody>
    `;

    submissions.forEach(sub => {
        const statusClass = 'status-' + sub.status.toLowerCase().replace(/\s+/g, '-');
        html += `
            <tr>
                <td>${sub.name}</td>
                <td>${sub.email}</td>
                <td>${sub.phone}</td>
                <td><span class="status ${statusClass}">${sub.status}</span></td>
                <td>${new Date(sub.timestamp).toLocaleString()}</td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    tableDiv.innerHTML = html;
}

async function triggerFollowUps() {
    try {
        const response = await fetch('/api/admin/trigger-follow-ups', { method: 'POST' });
        const result = await response.json();
        
        if (result.success) {
            alert('Follow-ups triggered successfully!');
            loadStats();
            loadSubmissions();
        }
    } catch (error) {
        alert('Failed to trigger follow-ups');
    }
}

async function sendTestEmail() {
    const email = document.getElementById('testEmail').value;
    const emailType = document.getElementById('emailType').value;
    
    if (!email) {
        alert('Please enter an email address');
        return;
    }
    
    try {
        const response = await fetch('/api/admin/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, emailType })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(result.message);
        } else {
            alert(result.error);
        }
    } catch (error) {
        alert('Failed to send test email');
    }
}