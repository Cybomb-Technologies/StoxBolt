const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const RSSFeedConfig = require('./models/RSSFeedConfig');
const RSSNotificationSubscription = require('./models/rssNotification/RSSNotificationSubscription');
const Notification = require('./models/inAppNotification/Notification');
const Post = require('./models/Post');
const User = require('./models/User-models/User-models');
const Admin = require('./models/admin');
// Correct User model

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected');
        console.log('JWT_SECRET present:', !!process.env.JWT_SECRET);
    } catch (err) {
        console.error('Connection error:', err);
        process.exit(1);
    }
};

const runDebug = async () => {
    await connectDB();

    console.log('\n--- 1. RSS Feed Configs ---');
    const feeds = await RSSFeedConfig.find({});
    console.log(`Found ${feeds.length} feeds`);
    feeds.forEach(f => console.log(`- ${f.name} (${f._id}) Active: ${f.isActive}`));

    console.log('\n--- 2. Users (UserData) ---');
    const users = await User.find({}).limit(5);
    console.log(`Found ${users.length} users (showing first 5)`);
    users.forEach(u => console.log(`- ${u.username} (${u._id}) Email: ${u.email}`));

    console.log('\n--- 2b. Admins ---');
    const admins = await Admin.find({});
    console.log(`Found ${admins.length} admins`);
    admins.forEach(a => console.log(`- ${a.name} (${a._id}) Email: ${a.email}`));

    console.log('\n--- 3. RSS Notification Subscriptions ---');
    const subs = await RSSNotificationSubscription.find({});
    console.log(`Found ${subs.length} subscriptions`);
    subs.forEach(s => console.log(`- User: ${s.userId} Type: ${s.subscriptionType} Active: ${s.isActive}`));

    console.log('\n--- 4. Recent RSS Posts (Last 5) ---');
    const posts = await Post.find({ source: 'rss_feed' }).sort({ createdAt: -1 }).limit(5);
    posts.forEach(p => console.log(`- ${p.title} (${p._id}) Created: ${p.createdAt}`));

    console.log('\n--- 5. Recent Notifications (Last 10) ---');
    const notifs = await Notification.find({}).sort({ createdAt: -1 }).limit(10);
    notifs.forEach(n => console.log(`- User: ${n.userId} Title: ${n.title} Type: ${n.type} Created: ${n.createdAt}`));

    process.exit();
};

runDebug();
