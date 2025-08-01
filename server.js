require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import our modules
const googleSheetsService = require('./services/googleSheetsService');
const emailService = require('./services/emailService');
const trackingService = require('./services/trackingService');
const schedulerService = require('./services/schedulerService');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/submissions', require('./routes/submissions'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/payment', require('./routes/payments'));

// Serve the main form page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve the admin dashboard
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Serve the payment page
app.get('/payment', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'payment.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize services and start server
async function startServer() {
  try {
    // Initialize Google Sheets service
    try {
      await googleSheetsService.initialize();
      console.log('✅ Google Sheets service initialized successfully');
    } catch (sheetsError) {
      console.error('⚠️ Google Sheets service failed to initialize:', sheetsError.message);
      console.log('💡 The application will continue without Google Sheets functionality');
      console.log('🔧 Please check your Google Sheets setup and restart the server');
    }
    
    // Initialize email service
    try {
      await emailService.initialize();
      console.log('✅ Email service initialized successfully');
    } catch (emailError) {
      console.error('⚠️ Email service failed to initialize:', emailError.message);
      console.log('💡 The application will continue without email functionality');
      console.log('🔧 Please check your email configuration and restart the server');
    }
    
    // Start the scheduler
    schedulerService.start();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Form available at: http://localhost:${PORT}`);
      console.log(`👨‍💼 Admin dashboard at: http://localhost:${PORT}/admin`);
      
      if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
        console.log('⚠️ Google Sheets not configured - form submissions will not be saved');
      }
      if (!process.env.EMAIL_USER) {
        console.log('⚠️ Email service not configured - emails will not be sent');
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  schedulerService.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  schedulerService.stop();
  process.exit(0);
}); 