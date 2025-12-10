const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const {
  bulkUpload,
  downloadTemplate,
  validateCsv
} = require('../controllers/bulkUploadController');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    console.log('=== MULTER FILE FILTER ===');
    console.log('File name:', file.originalname);
    console.log('MIME type:', file.mimetype);
    console.log('File size:', file.size || 'unknown', 'bytes');
    
    // Accept CSV files or files with .csv extension
    const isCSV = file.mimetype === 'text/csv' || 
                  file.mimetype === 'application/vnd.ms-excel' ||
                  file.mimetype === 'application/csv' ||
                  file.mimetype === 'text/plain' ||
                  file.mimetype === 'application/octet-stream' ||
                  file.originalname.toLowerCase().match(/\.(csv)$/i);
    
    if (isCSV) {
      console.log('✓ File accepted as CSV');
      cb(null, true);
    } else {
      console.log('✗ File rejected - not CSV. MIME type:', file.mimetype);
      cb(new Error('Only CSV files are allowed. Received MIME type: ' + file.mimetype), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Apply protect middleware to all routes
router.use(protect);

// Download template route
router.get('/template', downloadTemplate);

// Bulk upload route
router.post('/', 
  authorize('admin', 'superadmin', 'editor'),
  (req, res, next) => {
    console.log('=== BULK UPLOAD ROUTE ENTRY ===');
    console.log('User authenticated:', req.user ? 'Yes - ' + req.user.email : 'No');
    console.log('User role:', req.user?.role);
    next();
  },
  upload.single('file'), // Multer middleware for file upload
  (req, res, next) => {
    console.log('=== AFTER FILE UPLOAD ===');
    console.log('File uploaded:', req.file ? 'Yes' : 'No');
    
    if (req.file) {
      console.log('File details:', {
        name: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        encoding: req.file.encoding,
        bufferLength: req.file.buffer.length
      });
      
      // Log first 200 chars of file content
      const preview = req.file.buffer.toString('utf8', 0, 200);
      console.log('File preview (first 200 chars):', preview);
    }
    
    if (!req.file) {
      console.log('ERROR: No file in request');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please select a CSV file.'
      });
    }
    
    next();
  },
  bulkUpload
);

// CSV validation route
router.post('/validate', 
  authorize('admin', 'superadmin', 'editor'),
  upload.single('file'), // Same multer middleware
  validateCsv
);
// Add this route for quick testing
router.post('/debug-csv', 
  protect,
  upload.single('file'),
  async (req, res) => {
    try {
      console.log('=== DEBUG CSV PARSING ===');
      
      if (!req.file) {
        return res.status(400).json({ message: 'No file' });
      }

      const csv = require('csv-parser');
      const stream = require('stream');
      
      // Get raw text
      const rawText = req.file.buffer.toString('utf8');
      const lines = rawText.split(/\r\n|\n|\r/);
      
      // Try different parsing methods
      const results = [];
      
      // Method 1: Manual parsing
      console.log('\n=== MANUAL PARSING ===');
      console.log('Total lines:', lines.length);
      console.log('Line 1 (headers):', lines[0]);
      console.log('Line 2 (first data):', lines[1]);
      
      if (lines.length > 1) {
        const headers = lines[0].split(',');
        const firstRow = lines[1].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/); // Split by comma outside quotes
        console.log('Headers count:', headers.length);
        console.log('First row parts:', firstRow.length);
        
        const rowObj = {};
        headers.forEach((header, index) => {
          let value = firstRow[index] || '';
          // Remove surrounding quotes
          value = value.replace(/^"|"$/g, '').trim();
          rowObj[header.trim()] = value;
        });
        console.log('Manual parsed row:', rowObj);
        console.log('Title exists?', 'title' in rowObj);
        console.log('Title value:', rowObj.title);
        console.log('Title length:', rowObj.title?.length);
        console.log('Title trimmed empty?', rowObj.title?.trim() === '');
      }
      
      // Method 2: csv-parser
      console.log('\n=== CSV-PARSER ===');
      const bufferStream = new stream.PassThrough();
      
      // Try with normalized line endings
      const normalizedText = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      bufferStream.end(Buffer.from(normalizedText, 'utf8'));
      
      bufferStream
        .pipe(csv())
        .on('headers', (headers) => {
          console.log('CSV-Parser headers:', headers);
        })
        .on('data', (data) => {
          console.log('\nCSV-Parser row:', data);
          console.log('Row keys:', Object.keys(data));
          console.log('title field:', data.title);
          console.log('title type:', typeof data.title);
          console.log('title length:', data.title?.length);
          results.push(data);
        })
        .on('end', () => {
          console.log('\nTotal parsed rows:', results.length);
          
          if (results.length > 0) {
            // Check if fields are being parsed correctly
            const sample = results[0];
            console.log('\n=== FIELD ANALYSIS ===');
            console.log('Has title field?', 'title' in sample);
            console.log('Title value:', sample.title);
            console.log('Title trimmed:', sample.title?.trim());
            console.log('Title === ""?', sample.title === '');
            console.log('Title === undefined?', sample.title === undefined);
            console.log('Title === null?', sample.title === null);
            
            // Check all required fields
            const required = ['title', 'shortTitle', 'body', 'author'];
            required.forEach(field => {
              console.log(`${field}: "${sample[field]}" (exists: ${field in sample}, truthy: ${!!sample[field]}, trimmed empty: ${!sample[field] || sample[field].trim() === ''})`);
            });
          }
          
          res.status(200).json({
            success: true,
            message: `Parsed ${results.length} rows`,
            rawLines: lines.length,
            parsedRows: results.length,
            sampleRow: results[0],
            allRows: results,
            rawTextPreview: rawText.substring(0, 500)
          });
        })
        .on('error', (error) => {
          console.error('CSV parse error:', error);
          res.status(400).json({
            success: false,
            message: 'CSV parse error',
            error: error.message
          });
        });
      
    } catch (error) {
      console.error('Debug error:', error);
      res.status(500).json({
        success: false,
        message: 'Debug error',
        error: error.message
      });
    }
  }
);
// Error handling middleware for multer errors
router.use((error, req, res, next) => {
  console.error('=== ROUTE ERROR HANDLER ===');
  console.error('Error:', error.message);
  console.error('Error code:', error.code);
  console.error('Stack:', error.stack);
  
  if (error instanceof multer.MulterError) {
    console.error('Multer error type:', error.code);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB',
        code: 'FILE_TOO_LARGE'
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'File upload error',
      error: error.message,
      code: error.code
    });
  }
  
  if (error.message && error.message.includes('Only CSV files are allowed')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      code: 'INVALID_FILE_TYPE'
    });
  }
  
  // Handle authentication errors
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Please login again.',
      code: 'AUTH_ERROR'
    });
  }
  
  next(error);
});

module.exports = router;