// fixCategoryData.js
const mongoose = require('mongoose');
require('dotenv').config();

const Post = require('./models/Post');
const AdminPost = require('./models/AdminPost');
const Category = require('./models/Category');

const fixCategoryData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Find all posts with string categories
    const posts = await Post.find({
      $or: [
        { category: { $type: 'string' } },
        { category: { $exists: false } }
      ]
    });
    
    console.log(`Found ${posts.length} posts with string categories`);
    
    let fixedCount = 0;
    
    for (const post of posts) {
      if (typeof post.category === 'string') {
        // Find or create category
        let category = await Category.findOne({ 
          name: { $regex: new RegExp(`^${post.category}$`, 'i') }
        });
        
        if (!category) {
          console.log(`Creating new category: ${post.category}`);
          category = await Category.create({
            name: post.category,
            description: `Auto-created from existing posts`
          });
        }
        
        // Update post with ObjectId
        post.category = category._id;
        await post.save();
        fixedCount++;
        console.log(`Fixed post: ${post.title} - category: ${category.name}`);
      }
    }
    
    // Fix AdminPosts
    const adminPosts = await AdminPost.find({
      $or: [
        { category: { $type: 'string' } },
        { category: { $exists: false } }
      ]
    });
    
    console.log(`Found ${adminPosts.length} admin posts with string categories`);
    
    for (const adminPost of adminPosts) {
      if (typeof adminPost.category === 'string') {
        // Find or create category
        let category = await Category.findOne({ 
          name: { $regex: new RegExp(`^${adminPost.category}$`, 'i') }
        });
        
        if (!category) {
          console.log(`Creating new category: ${adminPost.category}`);
          category = await Category.create({
            name: adminPost.category,
            description: `Auto-created from existing admin posts`
          });
        }
        
        // Update admin post with ObjectId
        adminPost.category = category._id;
        await adminPost.save();
        fixedCount++;
        console.log(`Fixed admin post: ${adminPost.title} - category: ${category.name}`);
      }
    }
    
    console.log(`\n✅ Data fix completed! Fixed ${fixedCount} records.`);
    process.exit(0);
    
  } catch (error) {
    console.error('Error fixing category data:', error);
    process.exit(1);
  }
};

fixCategoryData();