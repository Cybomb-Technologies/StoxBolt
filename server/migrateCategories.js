// scripts/migrateCategories.js
const mongoose = require('mongoose');
require('dotenv').config();

const Category = require('./models/Category');
const Post = require('./models/Post');
const AdminPost = require('./models/AdminPost');

const migrateCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Existing categories from enum
    const existingCategories = [
      'Indian', 'US', 'Global', 'Commodities', 'Forex', 'Crypto', 'IPOs'
    ];
    
    // Create categories if they don't exist
    for (const categoryName of existingCategories) {
      let category = await Category.findOne({ name: categoryName });
      
      if (!category) {
        category = await Category.create({
          name: categoryName,
          description: `${categoryName} category`
        });
        console.log(`Created category: ${categoryName}`);
      }
    }
    
    // Get all categories for mapping
    const allCategories = await Category.find({});
    const categoryMap = {};
    allCategories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });
    
    // Update existing posts
    const posts = await Post.find({});
    let updatedPosts = 0;
    
    for (const post of posts) {
      if (typeof post.category === 'string' && categoryMap[post.category]) {
        post.category = categoryMap[post.category];
        await post.save();
        updatedPosts++;
      }
    }
    
    console.log(`Updated ${updatedPosts} posts`);
    
    // Update admin posts
    const adminPosts = await AdminPost.find({});
    let updatedAdminPosts = 0;
    
    for (const adminPost of adminPosts) {
      if (typeof adminPost.category === 'string' && categoryMap[adminPost.category]) {
        adminPost.category = categoryMap[adminPost.category];
        await adminPost.save();
        updatedAdminPosts++;
      }
    }
    
    console.log(`Updated ${updatedAdminPosts} admin posts`);
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migrateCategories();