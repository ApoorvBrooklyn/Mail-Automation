require('dotenv').config();
const { google } = require('googleapis');

async function testGoogleSheets() {
  try {
    console.log('🔍 Testing Google Sheets connection...');
    
    // Check environment variables
    console.log('📋 Environment Variables:');
    console.log('- Client Email:', process.env.GOOGLE_SHEETS_CLIENT_EMAIL ? '✅ Set' : '❌ Missing');
    console.log('- Spreadsheet ID:', process.env.GOOGLE_SHEETS_SPREADSHEET_ID ? '✅ Set' : '❌ Missing');
    console.log('- Private Key:', process.env.GOOGLE_SHEETS_PRIVATE_KEY ? '✅ Set' : '❌ Missing');
    
    if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL || 
        !process.env.GOOGLE_SHEETS_SPREADSHEET_ID || 
        !process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
      console.log('❌ Missing required environment variables');
      return;
    }

    // Initialize auth
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Test reading the sheet
    console.log('📊 Testing sheet access...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      range: 'Sheet1!A1:E1',
    });

    console.log('✅ Successfully connected to Google Sheets!');
    console.log('📄 Sheet data:', response.data.values);
    
    // Test writing to the sheet
    console.log('✍️ Testing write access...');
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      range: 'Sheet1!A1:E1',
      valueInputOption: 'RAW',
      resource: {
        values: [['Submission Timestamp', 'Name', 'Email', 'Phone Number', 'Status']]
      }
    });
    
    console.log('✅ Successfully wrote to Google Sheets!');
    console.log('🎉 All tests passed! Your Google Sheets setup is working correctly.');
    
  } catch (error) {
    console.error('❌ Error testing Google Sheets:', error.message);
    
    if (error.code === 403) {
      console.log('\n🔧 Fix Instructions:');
      console.log('1. Make sure you shared the Google Sheet with your service account email');
      console.log('2. Give the service account "Editor" permissions');
      console.log('3. Verify the spreadsheet ID is correct');
      console.log('4. Check that your service account credentials are correct');
    }
    
    if (error.code === 404) {
      console.log('\n🔧 Fix Instructions:');
      console.log('1. Verify the spreadsheet ID is correct');
      console.log('2. Make sure the Google Sheet exists and is accessible');
    }
  }
}

testGoogleSheets(); 