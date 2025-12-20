const Post = require('../models/Post');
const Category = require('../models/Category');
const Activity = require('../models/Activity');
const csv = require('csv-parser');
const stream = require('stream');

// Helper function to process CSV rows
const processCSVRow = async (row, user, rowIndex) => {
  const errors = [];

  console.log(`Processing row ${rowIndex}:`, Object.keys(row).length, 'columns');

  // Log all column values for debugging
  for (const [key, value] of Object.entries(row)) {
    console.log(`  ${key}: "${value}"`);
  }

  // Validate required fields
  if (!row.title || row.title.trim() === '') errors.push('Missing or empty title');
  if (!row.shortTitle || row.shortTitle.trim() === '') errors.push('Missing or empty shortTitle');
  if (!row.body || row.body.trim() === '') errors.push('Missing or empty body');
  if (!row.author || row.author.trim() === '') errors.push('Missing or empty author');

  if (errors.length > 0) {
    console.log(`Row ${rowIndex} validation errors:`, errors);
    return { errors, postData: null };
  }

  // Check if admin is trying to publish posts
  if (user.role === 'admin' && row.status === 'published') {
    errors.push('Admin cannot upload published posts. Status changed to draft.');
    row.status = 'draft';
  }

  // Process tags
  let tags = [];
  if (row.tags && row.tags.trim() !== '') {
    tags = row.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
  }

  // Handle category - find or create
  let categoryId;
  let categoryName = 'Indian'; // Default

  try {
    if (row.category && row.category.trim() !== '') {
      categoryName = row.category.trim();
    }
    console.log(`Row ${rowIndex} - Category: "${categoryName}"`);

    // Check if category exists (case-insensitive)
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${categoryName}$`, 'i') }
    });

    if (existingCategory) {
      categoryId = existingCategory._id;
      console.log(`Row ${rowIndex} - Found existing category: ${existingCategory.name}`);
    } else {
      // Create new category
      console.log(`Row ${rowIndex} - Creating new category: ${categoryName}`);
      const newCategory = await Category.create({
        name: categoryName,
        description: `Category created via bulk upload - ${categoryName}`,
        createdBy: user._id,
        isActive: true
      });
      categoryId = newCategory._id;
    }
  } catch (categoryError) {
    console.error(`Row ${rowIndex} - Category error:`, categoryError);
    errors.push(`Category error: ${categoryError.message}`);
    return { errors, postData: null };
  }

  // Process publishDateTime
  let publishDateTime;
  if (row.publishDateTime && row.publishDateTime.trim() !== '') {
    console.log(`Row ${rowIndex} - publishDateTime raw: "${row.publishDateTime}"`);
    const date = new Date(row.publishDateTime);
    if (isNaN(date.getTime())) {
      errors.push(`Invalid publishDateTime format: "${row.publishDateTime}". Using current date.`);
      publishDateTime = new Date();
    } else {
      publishDateTime = date;
    }
  } else {
    publishDateTime = new Date();
  }

  // Determine status based on role and publishDateTime
  let status = (row.status || 'draft').toLowerCase();
  if (user.role === 'admin' && status === 'published') {
    status = 'draft';
  }

  // Validate status - using Post model's allowed statuses
  const validStatuses = ['draft', 'scheduled', 'pending_approval', 'published', 'archived'];
  if (!validStatuses.includes(status)) {
    errors.push(`Invalid status: "${status}". Must be one of: ${validStatuses.join(', ')}`);
    status = 'draft';
  }

  // Check if post is scheduled
  const now = new Date();
  const isScheduled = publishDateTime > now;

  // Handle schedule approval based on user role
  let scheduleApproved = false;
  let scheduleApprovedBy = null;
  let scheduleApprovedAt = null;

  if (isScheduled) {
    // Superadmin can auto-approve scheduled posts
    if (user.role === 'superadmin') {
      scheduleApproved = true;
      scheduleApprovedBy = user._id;
      scheduleApprovedAt = new Date();
      status = 'scheduled';
    } else {
      status = 'pending_approval';
    }
  }

  // Handle isSponsored conversion - FIXED VARIABLE NAME
  let isSponsoredValue = false;
  if (row.isSponsored) {
    const sponsoredValue = row.isSponsored.toString().toLowerCase().trim();
    isSponsoredValue = sponsoredValue === 'true' || sponsoredValue === '1' || sponsoredValue === 'yes';
  }

  // Create post object
  const postData = {
    title: row.title.trim(),
    shortTitle: (row.shortTitle || row.title.substring(0, 100)).trim(),
    body: row.body.trim(),
    category: categoryId,
    tags: tags,
    region: (row.region || 'India').trim(),
    author: row.author.trim(),
    authorId: user._id,
    publishDateTime: publishDateTime,
    status: status,
    isSponsored: isSponsoredValue,  // Use the correct variable name
    metaTitle: (row.metaTitle || row.title).trim(),
    metaDescription: (row.metaDescription || (row.body ? row.body.substring(0, 150) + '...' : '')).trim(),
    imageUrl: row.imageUrl ? row.imageUrl.trim() : '',
    isScheduled: isScheduled,
    scheduleApproved: scheduleApproved,
    scheduleApprovedBy: scheduleApprovedBy,
    scheduleApprovedAt: scheduleApprovedAt,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  console.log(`Row ${rowIndex} - Processed successfully:`, {
    title: postData.title.substring(0, 50),
    categoryId: categoryId,
    status: postData.status,
    isScheduled: postData.isScheduled,
    scheduleApproved: postData.scheduleApproved
  });

  return { errors, postData };
};

// @desc    Bulk upload posts from CSV
// @route   POST /api/bulk-upload
// @access  Private (Admin, Superadmin, Editor)
exports.bulkUpload = async (req, res) => {
  try {
    console.log('=== BULK UPLOAD STARTED ===');
    console.log('User:', req.user?.email, 'Role:', req.user?.role);
    console.log('User ID:', req.user?._id);
    console.log('File received:', req.file?.originalname, 'Size:', req.file?.size, 'bytes');

    if (!req.file) {
      console.log('ERROR: No file provided');
      return res.status(400).json({
        success: false,
        message: 'Please upload a CSV file'
      });
    }

    // Check if user is authenticated
    if (!req.user) {
      console.log('ERROR: User not authenticated');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    console.log('File buffer length:', req.file.buffer.length);
    console.log('File content (first 1000 chars):');
    console.log(req.file.buffer.toString('utf8', 0, 1000));

    const posts = [];
    const errors = [];
    let rowIndex = 0;

    // Parse CSV - Fixed version with proper async handling
    const parseCSV = () => {
      return new Promise((resolve, reject) => {
        const csvText = req.file.buffer.toString('utf8');
        console.log('Raw CSV text length:', csvText.length);

        // Normalize line endings to Unix style
        const normalizedText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        console.log('After normalization, lines:', normalizedText.split('\n').length);

        const bufferStream = new stream.PassThrough();
        bufferStream.end(Buffer.from(normalizedText, 'utf8'));

        const rows = [];

        bufferStream
          .pipe(csv())
          .on('headers', (headers) => {
            console.log('CSV Headers found:', headers);
            console.log('Number of headers:', headers.length);
          })
          .on('data', async (row) => {
            rows.push(row);

            // Process row
            rowIndex++;
            console.log(`\n--- Processing CSV Row ${rowIndex} ---`);

            try {
              const result = await processCSVRow(row, req.user, rowIndex);
              if (result.errors && result.errors.length > 0) {
                console.log(`Row ${rowIndex} has errors:`, result.errors);
                errors.push({
                  row: rowIndex,
                  data: row,
                  errors: result.errors
                });
              } else if (result.postData) {
                console.log(`Row ${rowIndex} is valid - adding to posts array`);
                posts.push(result.postData);
              }
            } catch (error) {
              console.error(`Row ${rowIndex} processing error:`, error);
              errors.push({
                row: rowIndex,
                data: row,
                errors: [`Processing error: ${error.message}`]
              });
            }
          })
          .on('end', async () => {
            console.log(`\n=== CSV PARSING COMPLETED ===`);
            console.log(`Total rows processed: ${rowIndex}`);
            console.log(`Valid posts found: ${posts.length}`);
            console.log(`Errors found: ${errors.length}`);

            if (rows.length > 0) {
              console.log('Sample of first row:', {
                title: rows[0].title,
                status: rows[0].status,
                author: rows[0].author
              });
            }

            // Wait a moment to ensure all async operations are complete
            await new Promise(resolve => setTimeout(resolve, 100));

            resolve({ posts, errors });
          })
          .on('error', (error) => {
            console.error('CSV parsing stream error:', error);
            reject(error);
          });
      });
    };

    const { posts: validPosts, errors: parsingErrors } = await parseCSV();

    // Check if we have any valid posts
    if (validPosts.length === 0) {
      console.log('ERROR: No valid posts found after validation');

      const csvText = req.file.buffer.toString('utf8');
      const lines = csvText.split('\n');

      return res.status(400).json({
        success: false,
        message: 'No valid posts found. Check CSV format and data.',
        errors: errors,
        debug: {
          totalRowsProcessed: rowIndex,
          validationErrors: errors.map(e => ({ row: e.row, errors: e.errors })),
          fileFirstLine: lines[0],
          sampleRowData: lines.length > 1 ? lines[1] : null
        }
      });
    }

    try {
      console.log(`Inserting ${validPosts.length} posts into database...`);

      // Insert all posts
      const createdPosts = await Post.insertMany(validPosts, { ordered: false });
      console.log(`Successfully inserted ${createdPosts.length} posts`);

      // Send notifications for published posts
      try {
        const rssNotificationService = require('../services/rssNotification/rssNotificationService');
        const publishedPosts = createdPosts.filter(post => post.status === 'published');

        if (publishedPosts.length > 0) {
          console.log(`📢 Sending notifications for ${publishedPosts.length} published posts from bulk upload`);
          for (const post of publishedPosts) {
            try {
              await rssNotificationService.notifyUsersAboutAdminPost(post);
            } catch (notifyErr) {
              console.error(`Failed to notify for post ${post._id}:`, notifyErr.message);
            }
          }
          console.log('✅ Bulk upload notifications sent');
        }
      } catch (notifyErr) {
        console.error('Bulk upload notification error:', notifyErr);
      }

      // Log activity for posts creation
      await Activity.create({
        type: 'create',
        userId: req.user._id,
        user: req.user.name,
        userName: req.user.name,
        userEmail: req.user.email,
        userRole: req.user.role,
        title: `Bulk upload of ${createdPosts.length} posts`,
        description: `Bulk imported ${createdPosts.length} posts from CSV file`,
        entityType: 'post',
        metadata: {
          count: createdPosts.length,
          errors: errors.length,
          uploadedByRole: req.user.role,
          fileName: req.file.originalname,
          fileSize: req.file.size
        },
        action: 'bulk_upload',
        severity: 'success'
      });

      return res.status(201).json({
        success: true,
        message: `Successfully uploaded ${createdPosts.length} posts${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
        count: createdPosts.length,
        errors: errors,
        debug: {
          totalRows: rowIndex,
          validRows: createdPosts.length,
          errorRows: errors.length
        }
      });

    } catch (insertError) {
      console.error('Bulk insert error:', insertError);

      // Check if it's a duplicate key error
      if (insertError.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Duplicate posts found. Some posts may already exist.',
          error: insertError.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Error inserting posts into database',
        error: insertError.message
      });
    }

  } catch (error) {
    console.error('=== BULK UPLOAD ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);

    return res.status(500).json({
      success: false,
      message: 'Server error during bulk upload',
      error: error.message
    });
  }
};

// @desc    Download CSV template
// @route   GET /api/bulk-upload/template
// @access  Private
exports.downloadTemplate = async (req, res) => {
  try {
    const csvTemplate =
      'title,shortTitle,body,category,tags,region,author,publishDateTime,status,isSponsored,metaTitle,metaDescription,imageUrl\n' +
      '"Sample Post Title","Short Title","This is the main body content of the post.","Indian","stockmarket,investing","India","Author Name","2025-12-01T10:00:00","draft","false","Sample Meta Title","Sample meta description for SEO","https://example.com/image.jpg"\n' +
      '"Another Post","Another Short","Content here.","Technology","tech,software","India","Another Author","2025-12-02T14:30:00","draft","true","Tech Meta","Meta for tech post","https://example.com/tech.jpg"';

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="stoxbolt-post-template.csv"');
    return res.send(csvTemplate);

  } catch (error) {
    console.error('Download template error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Validate CSV before upload
// @route   POST /api/bulk-upload/validate
// @access  Private (Admin, Superadmin, Editor)
exports.validateCsv = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a CSV file'
      });
    }

    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    const validationResults = {
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      errors: [],
      categoriesToCreate: [],
      existingCategories: [],
      sampleData: null
    };

    const rows = [];

    bufferStream
      .pipe(csv())
      .on('data', async (row) => {
        validationResults.totalRows++;
        rows.push(row);

        const rowErrors = [];

        // Validate required fields
        if (!row.title || row.title.trim() === '') rowErrors.push('Missing title');
        if (!row.shortTitle || row.shortTitle.trim() === '') rowErrors.push('Missing shortTitle');
        if (!row.body || row.body.trim() === '') rowErrors.push('Missing body');
        if (!row.author || row.author.trim() === '') rowErrors.push('Missing author');

        // Check status
        const validStatuses = ['draft', 'scheduled', 'pending_approval', 'published', 'archived'];
        if (row.status && !validStatuses.includes(row.status.toLowerCase())) {
          rowErrors.push(`Invalid status: "${row.status}". Must be one of: ${validStatuses.join(', ')}`);
        }

        // Check category
        if (row.category && row.category.trim() !== '') {
          const categoryName = row.category.trim();
          try {
            const existingCategory = await Category.findOne({
              name: { $regex: new RegExp(`^${categoryName}$`, 'i') }
            });

            if (existingCategory) {
              if (!validationResults.existingCategories.includes(categoryName)) {
                validationResults.existingCategories.push(categoryName);
              }
            } else {
              if (!validationResults.categoriesToCreate.includes(categoryName)) {
                validationResults.categoriesToCreate.push(categoryName);
              }
            }
          } catch (error) {
            rowErrors.push(`Category check error: ${error.message}`);
          }
        }

        if (rowErrors.length > 0) {
          validationResults.invalidRows++;
          validationResults.errors.push({
            row: validationResults.totalRows,
            data: row,
            errors: rowErrors
          });
        } else {
          validationResults.validRows++;
        }
      })
      .on('end', () => {
        // Store first valid row as sample data
        if (rows.length > 0) {
          validationResults.sampleData = rows[0];
        }

        res.status(200).json({
          success: true,
          message: 'CSV validation completed',
          validation: validationResults
        });
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        res.status(400).json({
          success: false,
          message: 'Error parsing CSV file',
          error: error.message
        });
      });

  } catch (error) {
    console.error('CSV validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during CSV validation',
      error: error.message
    });
  }
};