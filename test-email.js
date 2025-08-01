require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmailService() {
  try {
    console.log('🔍 Testing Email Service...');
    
    // Check environment variables
    console.log('📋 Email Environment Variables:');
    console.log('- EMAIL_HOST:', process.env.EMAIL_HOST || '❌ Missing');
    console.log('- EMAIL_PORT:', process.env.EMAIL_PORT || '❌ Missing');
    console.log('- EMAIL_USER:', process.env.EMAIL_USER || '❌ Missing');
    console.log('- EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set' : '❌ Missing');
    
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('❌ Missing required email environment variables');
      console.log('💡 Please check your .env file and ensure all email variables are set');
      return;
    }

    // Create transporter
    console.log('📧 Creating email transporter...');
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify connection
    console.log('🔐 Verifying email connection...');
    await transporter.verify();
    console.log('✅ Email connection verified successfully!');

    // Test sending email (optional - uncomment to test)
    console.log('📤 Email service is ready to send emails!');
    console.log('💡 To test sending an email, uncomment the test code in this script');
    
    /*
    // Uncomment this section to test sending an email
    console.log('📤 Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'test@example.com', // Change this to your email
      subject: 'Test Email - Consulting Cohort 101',
      text: 'This is a test email from the Consulting Cohort 101 automation system.',
      html: '<h1>Test Email</h1><p>This is a test email from the Consulting Cohort 101 automation system.</p>'
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    */
    
  } catch (error) {
    console.error('❌ Error testing email service:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔧 Authentication Error - Fix Instructions:');
      console.log('1. Check your EMAIL_USER and EMAIL_PASS in .env file');
      console.log('2. Make sure you\'re using an App Password, not your regular Gmail password');
      console.log('3. Enable 2-Factor Authentication on your Gmail account');
      console.log('4. Generate a new App Password in Google Account settings');
    }
    
    if (error.code === 'ECONNECTION') {
      console.log('\n🔧 Connection Error - Fix Instructions:');
      console.log('1. Check your EMAIL_HOST and EMAIL_PORT in .env file');
      console.log('2. For Gmail, use: EMAIL_HOST=smtp.gmail.com, EMAIL_PORT=587');
      console.log('3. Make sure your firewall allows outbound SMTP connections');
    }
    
    if (error.message.includes('createTransporter')) {
      console.log('\n🔧 Nodemailer Error - This should be fixed now!');
    }
  }
}

testEmailService(); 