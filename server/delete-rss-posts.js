// delete-rss-posts.js
require('dotenv').config();
const mongoose = require('mongoose');
const Post = require('./models/Post');

async function deleteRSSPosts() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected');

        console.log('🗑️ Deleting RSS posts...');
        const result = await Post.deleteMany({ source: 'rss_feed' });

        console.log(`✅ Deleted ${result.deletedCount} RSS posts successfully.`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Connection closed');
        process.exit();
    }
}

deleteRSSPosts();
