const Post = require('../models/Post');
const Activity = require('../models/Activity');
const csv = require('csv-parser');
const stream = require('stream');

// @desc    Bulk upload posts from CSV
// @route   POST /api/posts/bulk-upload
// @access  Private (Admin and Superadmin)
exports.bulkUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a CSV file'
      });
    }
    
    const results = [];
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);
    
    // Parse CSV
    const posts = [];
    const errors = [];
    
    bufferStream
      .pipe(csv())
      .on('data', (row) => {
        // Validate required fields
        if (!row.title || !row.shortTitle || !row.body || !row.author) {
          errors.push({
            row: row,
            error: 'Missing required fields'
          });
          return;
        }
        
        // Check if admin is trying to publish posts
        if (req.user.role === 'admin' && row.status === 'published') {
          errors.push({
            row: row,
            error: 'Admin cannot upload published posts. Status changed to draft.'
          });
          row.status = 'draft'; // Force draft status for admin
        }
        
        // Process tags
        let tags = [];
        if (row.tags) {
          tags = row.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        }
        
        // Create post object
        const postData = {
          title: row.title,
          shortTitle: row.shortTitle || row.title.substring(0, 100),
          body: row.body,
          category: row.category || 'Indian',
          tags: tags,
          region: row.region || 'India',
          author: row.author,
          authorId: req.user._id,
          publishDateTime: row.publishDateTime || Date.now(),
          status: req.user.role === 'admin' ? (row.status === 'published' ? 'draft' : row.status) : row.status || 'draft',
          isSponsored: row.isSponsored === 'true' || row.isSponsored === true,
          metaTitle: row.metaTitle || row.title,
          metaDescription: row.metaDescription || (row.body ? row.body.substring(0, 150) + '...' : ''),
          imageUrl: row.imageUrl || ''
        };
        
        posts.push(postData);
      })
      .on('end', async () => {
        try {
          if (posts.length === 0) {
            return res.status(400).json({
              success: false,
              message: 'No valid posts found in CSV',
              errors: errors
            });
          }
          
          // Insert all posts
          const createdPosts = await Post.insertMany(posts);
          
          // Log activity
          await Activity.create({
            type: 'upload',
            userId: req.user._id,
            user: req.user.name,
            title: `Bulk upload of ${createdPosts.length} posts`,
            details: {
              count: createdPosts.length,
              errors: errors.length,
              uploadedByRole: req.user.role
            }
          });
          
          res.status(201).json({
            success: true,
            message: `Successfully uploaded ${createdPosts.length} posts`,
            count: createdPosts.length,
            errors: errors,
            data: createdPosts
          });
          
        } catch (insertError) {
          console.error('Bulk insert error:', insertError);
          res.status(500).json({
            success: false,
            message: 'Error inserting posts',
            error: insertError.message
          });
        }
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
    console.error('Bulk upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Download CSV template
// @route   GET /api/posts/bulk-upload/template
// @access  Private
exports.downloadTemplate = async (req, res) => {
  try {
    const csvTemplate = 
      'title,shortTitle,body,category,tags,region,author,publishDateTime,status,isSponsored,metaTitle,metaDescription,imageUrl\n' +
      '"Sample Post Title","Short Title","This is the main body content of the post.","Indian","stockmarket,investing","India","Author Name","2025-12-01T10:00:00","draft","false","Sample Meta Title","Sample meta description for SEO","https://example.com/image.jpg"';
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="stoxbolt-post-template.csv"');
    res.send(csvTemplate);
    
  } catch (error) {
    console.error('Download template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};