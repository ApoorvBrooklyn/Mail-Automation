# Vercel Deployment Guide

This guide will help you deploy your Consulting Cohort 101 automation project to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI** (optional): `npm i -g vercel`
3. **GitHub Repository**: Your code should be in a GitHub repository

## Environment Variables

You need to configure these environment variables in your Vercel dashboard:

### Required Environment Variables

```bash
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
NODE_ENV=production
BASE_URL="https://your-app.vercel.app"

# Tracking Configuration
TRACKING_SECRET="your-tracking-secret-key"

# Optional: Cron Secret (for scheduled functions)
CRON_SECRET="your-cron-secret"
```

### Setting Environment Variables in Vercel

1. Go to your project dashboard on Vercel
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable with its corresponding value
4. Make sure to select the appropriate environments (Production, Preview, Development)

## Deployment Steps

### Option 1: Deploy via GitHub (Recommended)

1. **Connect Repository**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Vercel will automatically detect it as a Node.js project

2. **Configure Project**:
   - Framework Preset: **Other**
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (optional)
   - Output Directory: Leave empty
   - Install Command: `npm install`

3. **Add Environment Variables**: Configure all the environment variables listed above

4. **Deploy**: Click "Deploy" and wait for the build to complete

### Option 2: Deploy via CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. Follow the prompts and configure your environment variables when prompted

## File Structure Changes Made

Your project has been converted from a traditional Express.js server to Vercel serverless functions. **The API functions have been consolidated to stay within Vercel's Hobby plan limit of 12 functions:**

```
gradNext/
├── api/                          # Vercel API functions (6 total)
│   ├── admin.js                  # Admin dashboard, stats, email triggers
│   ├── health.js                 # Health check endpoint
│   ├── payment.js                # Payment processing and callbacks
│   ├── submissions.js            # Form submissions and user management
│   ├── tracking.js               # Email tracking, clicks, payment flows
│   └── webhooks.js               # External webhooks and scheduled tasks
├── public/                       # Static files (served by Vercel)
├── services/                     # Unchanged
├── routes/                       # Legacy (can be removed after testing)
├── server.js                     # Legacy (for local development)
├── vercel.json                   # Vercel configuration
└── package.json                  # Updated scripts
```

Each consolidated function handles multiple routes based on the request path and method.

## API Endpoints

After deployment, your API endpoints will be available at:

- **Submissions**: 
  - POST `https://your-app.vercel.app/api/submissions` (submit form)
  - GET `https://your-app.vercel.app/api/submissions` (get all submissions)
  - GET `https://your-app.vercel.app/api/submissions/[email]` (get specific submission)
  - PATCH `https://your-app.vercel.app/api/submissions/[email]` (update status)

- **Admin**: 
  - GET `https://your-app.vercel.app/api/admin/stats` (dashboard statistics)
  - GET `https://your-app.vercel.app/api/admin/submissions` (filtered submissions)
  - GET `https://your-app.vercel.app/api/admin/follow-ups` (users for follow-up)
  - POST `https://your-app.vercel.app/api/admin/trigger-follow-ups` (trigger emails)
  - POST `https://your-app.vercel.app/api/admin/send-email` (send manual email)
  - GET `https://your-app.vercel.app/api/admin/health` (service health check)

- **Tracking**: 
  - GET `https://your-app.vercel.app/api/tracking/pixel/[trackingId]` (email open tracking)
  - GET `https://your-app.vercel.app/api/tracking/link/[trackingId]` (link click tracking)
  - GET `https://your-app.vercel.app/api/tracking/reply/[trackingId]` (reply tracking)
  - GET `https://your-app.vercel.app/api/tracking/payment/[trackingId]` (payment page)
  - GET `https://your-app.vercel.app/api/tracking/payment-success` (payment success)
  - GET `https://your-app.vercel.app/api/tracking/payment-failed` (payment failure)
  - POST `https://your-app.vercel.app/api/tracking/payment-page-visit` (track visits)
  - POST `https://your-app.vercel.app/api/tracking/payment-abandonment` (track abandonment)

- **Payments**: 
  - GET `https://your-app.vercel.app/api/payment` (payment page redirect)
  - POST `https://your-app.vercel.app/api/payment/process` (process payment)
  - GET `https://your-app.vercel.app/api/payment/success` (success callback)
  - GET `https://your-app.vercel.app/api/payment/failed` (failure callback)

- **Webhooks**: 
  - POST `https://your-app.vercel.app/api/webhooks/payment-confirmation` (payment gateway webhook)
  - POST `https://your-app.vercel.app/api/webhooks/email-events` (email service webhook)
  - POST `https://your-app.vercel.app/api/webhooks/test` (test webhook)
  - GET/POST `https://your-app.vercel.app/api/webhooks/scheduler` (Vercel Cron endpoint)

- **Health**: `https://your-app.vercel.app/api/health` (general health check)

## Static Files

Your static files in the `public/` folder will be served directly:

- **Form**: `https://your-app.vercel.app/` (redirects to index.html)
- **Admin**: `https://your-app.vercel.app/admin.html`
- **Payment**: `https://your-app.vercel.app/payment.html`

## Scheduled Functions (Cron Jobs)

The original cron job has been replaced with Vercel Cron:

- **Endpoint**: `/api/webhooks/scheduler`
- **Schedule**: Daily at 9 AM UTC (configured in `vercel.json`)
- **Manual Trigger**: You can also trigger it manually via POST request

To secure the cron endpoint, set the `CRON_SECRET` environment variable and include it in the Authorization header:

```bash
curl -X POST https://your-app.vercel.app/api/webhooks/scheduler \
  -H "Authorization: Bearer your-cron-secret"
```

## Testing Your Deployment

1. **Health Check**: Visit `https://your-app.vercel.app/api/health`
2. **Form**: Visit `https://your-app.vercel.app/`
3. **Admin Dashboard**: Visit `https://your-app.vercel.app/admin.html`

## Troubleshooting

### Common Issues

1. **Environment Variables Not Working**:
   - Ensure all environment variables are set in Vercel dashboard
   - Redeploy after adding environment variables

2. **Google Sheets Connection Issues**:
   - Check that `GOOGLE_SHEETS_PRIVATE_KEY` includes proper newlines (`\n`)
   - Verify service account has access to the spreadsheet

3. **Email Not Sending**:
   - Use App Passwords for Gmail (not your regular password)
   - Ensure 2FA is enabled on your Gmail account

4. **Function Timeouts**:
   - Vercel functions have a 10-second timeout on Hobby plan
   - Optimize your functions or upgrade to Pro plan (30 seconds)

5. **CORS Issues**:
   - All API functions include CORS headers
   - If you still have issues, check the browser console for specific errors

### Monitoring

- **Function Logs**: Available in Vercel dashboard under "Functions" tab
- **Real-time Logs**: Use `vercel logs` CLI command
- **Analytics**: Available in Vercel dashboard for performance monitoring

## Local Development

You can still run the project locally for development:

```bash
npm run dev
```

This will use the original `server.js` file. For testing Vercel functions locally:

```bash
vercel dev
```

## Migration Notes

- **Database**: No changes needed - Google Sheets integration remains the same
- **Email Service**: No changes needed - Nodemailer configuration remains the same
- **Static Files**: Moved from Express static serving to Vercel's CDN
- **Scheduled Tasks**: Converted from node-cron to Vercel Cron
- **API Routes**: Converted from Express routes to Vercel functions

## Support

If you encounter issues:

1. Check Vercel function logs in the dashboard
2. Verify all environment variables are correctly set
3. Test individual API endpoints
4. Check the GitHub repository for any deployment errors

## Cost Considerations

- **Hobby Plan**: Free tier includes 100GB bandwidth, 100 serverless function invocations
- **Pro Plan**: $20/month for higher limits and better performance
- **Function Duration**: Hobby has 10s timeout, Pro has 30s timeout

Your current application should work fine on the Hobby plan for moderate usage.