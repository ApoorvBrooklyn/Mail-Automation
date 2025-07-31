const { google } = require('googleapis');

class GoogleSheetsService {
  constructor() {
    this.sheets = null;
    this.spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    this.range = 'Sheet1!A:E'; // Timestamp, Name, Email, Phone, Status
  }

  async initialize() {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      
      // Initialize the sheet with headers if it doesn't exist
      await this.initializeSheet();
      
      console.log('✅ Google Sheets service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Google Sheets service:', error);
      throw error;
    }
  }

  async initializeSheet() {
    try {
      // Check if headers exist
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A1:E1',
      });

      if (!response.data.values || response.data.values.length === 0) {
        // Add headers
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: 'Sheet1!A1:E1',
          valueInputOption: 'RAW',
          resource: {
            values: [['Submission Timestamp', 'Name', 'Email', 'Phone Number', 'Status']]
          }
        });
        console.log('📊 Sheet headers initialized');
      }
    } catch (error) {
      console.error('❌ Failed to initialize sheet:', error);
      throw error;
    }
  }

  async addSubmission(submission) {
    try {
      const timestamp = new Date().toISOString();
      const values = [
        [
          timestamp,
          submission.name,
          submission.email,
          submission.phone,
          'Form Submitted'
        ]
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: this.range,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: { values }
      });

      console.log(`✅ Submission added for ${submission.email}`);
      return { success: true, timestamp };
    } catch (error) {
      console.error('❌ Failed to add submission:', error);
      throw error;
    }
  }

  async updateStatus(email, newStatus) {
    try {
      // Find the row with the email
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A:E',
      });

      const rows = response.data.values;
      let rowIndex = -1;

      for (let i = 1; i < rows.length; i++) { // Skip header row
        if (rows[i][2] === email) { // Email is in column C (index 2)
          rowIndex = i + 1; // Convert to 1-based index
          break;
        }
      }

      if (rowIndex === -1) {
        throw new Error(`Email ${email} not found`);
      }

      // Update the status in column E
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `Sheet1!E${rowIndex}`,
        valueInputOption: 'RAW',
        resource: {
          values: [[newStatus]]
        }
      });

      console.log(`✅ Status updated for ${email}: ${newStatus}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to update status:', error);
      throw error;
    }
  }

  async getAllSubmissions() {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A:E',
      });

      const rows = response.data.values;
      if (!rows || rows.length <= 1) {
        return [];
      }

      // Convert to objects, skipping header row
      const submissions = rows.slice(1).map(row => ({
        timestamp: row[0],
        name: row[1],
        email: row[2],
        phone: row[3],
        status: row[4]
      }));

      return submissions;
    } catch (error) {
      console.error('❌ Failed to get submissions:', error);
      throw error;
    }
  }

  async getSubmissionsByStatus(status) {
    try {
      const allSubmissions = await this.getAllSubmissions();
      return allSubmissions.filter(submission => submission.status === status);
    } catch (error) {
      console.error('❌ Failed to get submissions by status:', error);
      throw error;
    }
  }

  async getSubmissionByEmail(email) {
    try {
      const allSubmissions = await this.getAllSubmissions();
      return allSubmissions.find(submission => submission.email === email);
    } catch (error) {
      console.error('❌ Failed to get submission by email:', error);
      throw error;
    }
  }
}

module.exports = new GoogleSheetsService(); 