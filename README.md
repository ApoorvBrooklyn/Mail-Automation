# Consulting Cohort 101 - Automation Workflow

A comprehensive automation system for managing cohort interest forms and automated email follow-up sequences. This system handles form submissions, email tracking, payment simulation, and intelligent follow-up scheduling.

## 🚀 Features

### Core Functionality
- **Web Form**: Beautiful, responsive interest form for "Consulting Cohort 101"
- **Data Storage**: Google Sheets integration for storing submissions
- **Email Automation**: Automated email sequences with tracking
- **User Interaction Tracking**: Email opens, link clicks, and reply tracking
- **Payment Simulation**: Complete payment flow simulation
- **Smart Follow-ups**: Automated reminder emails based on user behavior
- **Admin Dashboard**: Real-time monitoring and management tools

### Email Sequence Logic
1. **Initial Confirmation**: Sent immediately after form submission
2. **Reminder 1**: Sent if email unread for 2+ days
3. **Reminder 2**: Sent if email opened but payment link not clicked
4. **Final Reminder**: Sent if payment link clicked but payment not completed within 2 days
5. **Completion**: Stops all follow-ups when user pays or replies

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google Cloud Platform account
- Gmail account with App Password

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd consulting-cohort-automation
npm install
```

### 2. Google Sheets Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sheets API
4. Create a Service Account:
   - Go to "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Download the JSON key file
5. Create a Google Sheet and share it with the service account email
6. Copy the Spreadsheet ID from the URL

### 3. Gmail Setup

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security > 2-Step Verification > App passwords
   - Generate password for "Mail"
3. Use this password in your environment variables

### 4. Environment Configuration

1. Copy the example environment file:
```bash
cp env.example .env
```

2. Fill in your configuration:
```env
# Google Sheets API Configuration
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Private Key Here\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_CLIENT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
GOOGLE_SHEETS_SPREADSHEET_ID="your-spreadsheet-id-here"

# Email Configuration (Gmail SMTP)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# Application Configuration
PORT=3000
NODE_ENV=development
BASE_URL="http://localhost:3000"

# Tracking Configuration
TRACKING_SECRET="your-tracking-secret-key"
```

### 5. Start the Application

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The application will be available at:
- **Main Form**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin
- **Health Check**: http://localhost:3000/health

## 📧 Email Templates

### 1. Initial Confirmation Email
- **Trigger**: Immediately after form submission
- **Content**: Welcome message, program details, payment link
- **Status Update**: "Email Sent"

### 2. Reminder Email 1
- **Trigger**: Email unread for 2+ days
- **Content**: Urgency messaging, program benefits
- **Status Update**: "Reminder 1 Sent"

### 3. Reminder Email 2
- **Trigger**: Email opened but payment link not clicked
- **Content**: Detailed benefits, exclusive offers
- **Status Update**: "Reminder 2 Sent"

### 4. Final Reminder
- **Trigger**: Payment link clicked but payment not completed within 2 days
- **Content**: Last chance messaging, urgency
- **Status Update**: "Final Reminder Sent"

## 🔗 API Endpoints

### Submissions
- `POST /api/submissions` - Submit interest form
- `GET /api/submissions` - Get all submissions (admin)
- `GET /api/submissions/:email` - Get submission by email
- `PATCH /api/submissions/:email/status` - Update submission status

### Tracking
- `GET /api/tracking/pixel/:trackingId` - Track email opens
- `GET /api/tracking/link/:trackingId` - Track link clicks
- `GET /api/tracking/reply/:trackingId` - Track reply clicks
- `GET /api/tracking/payment/:trackingId` - Payment simulation page
- `GET /api/tracking/payment-success` - Payment success
- `GET /api/tracking/payment-failed` - Payment failure

### Admin
- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/submissions` - Get submissions with filtering
- `GET /api/admin/follow-ups` - Get follow-up eligibility
- `POST /api/admin/trigger-follow-ups` - Manual trigger follow-ups
- `POST /api/admin/trigger-final-reminders` - Manual trigger final reminders
- `POST /api/admin/send-email` - Send manual test email
- `GET /api/admin/health` - System health check

### Webhooks
- `POST /api/webhooks/payment-confirmation` - Payment webhook simulation
- `POST /api/webhooks/email-events` - Email events webhook
- `POST /api/webhooks/test` - Test webhook endpoint

## 📊 Admin Dashboard

The admin dashboard provides:

### Statistics
- Total submissions
- Conversion rate
- Paid vs unpaid breakdown
- Email delivery statistics

### User Management
- View all submissions
- Filter by status
- Manual status updates
- Export data

### Testing Tools
- Send test emails
- Trigger follow-ups manually
- Test webhook endpoints
- System health monitoring

## 🔄 Automation Flow

```mermaid
graph TD
    A[Form Submission] --> B[Store in Google Sheets]
    B --> C[Send Confirmation Email]
    C --> D[Track Email Opens]
    D --> E{Email Opened?}
    E -->|No| F[Wait 2 Days]
    F --> G[Send Reminder 1]
    E -->|Yes| H[Track Link Clicks]
    H --> I{Payment Link Clicked?}
    I -->|No| J[Send Reminder 2]
    I -->|Yes| K[Track Payment]
    K --> L{Payment Completed?}
    L -->|No| M[Wait 2 Days]
    M --> N[Send Final Reminder]
    L -->|Yes| O[Mark as Paid]
    O --> P[Stop Follow-ups]
    N --> Q{User Replies?}
    Q -->|Yes| R[Mark as Replied]
    R --> P
```

## 🧪 Testing

### Manual Testing
1. Submit a test form at http://localhost:3000
2. Check the admin dashboard for the new submission
3. Use the testing tools to simulate email interactions
4. Test the payment flow using the simulation buttons

### Webhook Testing
```bash
# Test payment success
curl -X POST http://localhost:3000/api/webhooks/test \
  -H "Content-Type: application/json" \
  -d '{"type": "payment_success", "data": {"email": "test@example.com"}}'

# Test email open
curl -X POST http://localhost:3000/api/webhooks/test \
  -H "Content-Type: application/json" \
  -d '{"type": "email_open", "data": {"email": "test@example.com"}}'
```

## 📈 Monitoring

### Logs
The application provides detailed console logging:
- ✅ Success operations
- ❌ Error operations
- 📧 Email operations
- 🔗 Tracking operations
- ⏰ Scheduler operations

### Health Check
Monitor system health at `/health` endpoint:
- Google Sheets connectivity
- Email service status
- Scheduler status

## 🔧 Configuration Options

### Email Scheduling
- Follow-up checks: Every hour
- Final reminder checks: Every 6 hours
- Customizable via cron expressions in `schedulerService.js`

### Status Tracking
- Form Submitted
- Email Sent
- Email Opened
- Link Clicked
- Paid
- Replied
- Payment Failed
- Reminder X Sent/Opened

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
BASE_URL="https://your-domain.com"
PORT=3000
```

### Recommended Hosting
- **Heroku**: Easy deployment with environment variables
- **DigitalOcean**: App Platform or Droplet
- **AWS**: EC2 or Elastic Beanstalk
- **Google Cloud**: App Engine or Compute Engine

### SSL/HTTPS
For production, ensure SSL is configured for secure email tracking and webhook endpoints.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check the logs for error messages
2. Verify environment variables are correct
3. Test individual components using the admin dashboard
4. Create an issue with detailed error information

## 🔮 Future Enhancements

- [ ] Email template customization
- [ ] Advanced analytics and reporting
- [ ] Multi-cohort support
- [ ] Integration with payment gateways
- [ ] SMS notifications
- [ ] Advanced segmentation
- [ ] A/B testing for email content
- [ ] Webhook signature verification
- [ ] Rate limiting and security enhancements 