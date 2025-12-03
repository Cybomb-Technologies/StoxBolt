const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const {
  bulkUpload,
  downloadTemplate
} = require('../controllers/bulkUploadController');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// All routes are protected
router.use(protect);

router.route('/template')
  .get(downloadTemplate);

router.route('/')
  .post(authorize('admin', 'superadmin', 'editor'), upload.single('file'), bulkUpload);

module.exports = router;