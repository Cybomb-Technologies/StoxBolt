const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const RSSFeedConfig = require('./models/RSSFeedConfig');
const RSSNotificationSubscription = require('./models/rssNotification/RSSNotificationSubscription');
const Notification = require('./models/inAppNotification/Notification');
const Post = require('./models/Post');
const Admin = require('./models/admin');
require('./models/User-models/User-models'); // Register UserData model for population
const rssNotificationService = require('./services/rssNotification/rssNotificationService');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('Connection error:', err);
        process.exit(1);
    }
};

const verifyFix = async () => {
    await connectDB();

    try {
        // 1. Find an Admin
        const admin = await Admin.findOne();
        if (!admin) {
            console.log('No admin found, creating temp admin...');
            // Create temp admin if needed, but likely one exists
            return;
        }
        console.log(`Using Admin: ${admin.name} (${admin._id})`);

        // 2. Mock Feed Config
        // Cleanup potential leftovers first
        await RSSFeedConfig.findOneAndDelete({ url: { $regex: 'test.com/rss' } });

        const feedConfig = new RSSFeedConfig({
            name: 'Test Feed ' + Date.now(),
            url: 'http://test.com/rss/' + Date.now(), // Unique URL
            brandName: 'Test Brand',
            isActive: true,
            createdBy: admin._id
        });
        await feedConfig.save();
        console.log(`Created Test Feed: ${feedConfig.name}`);

        // 3. Test Subscribe (Simulating Route Logic)
        console.log('Testing Subscribe...');
        await rssNotificationService.subscribe(admin._id, {
            subscriptionType: 'feed',
            feedId: feedConfig._id,
            userModel: 'Admin', // Testing the new field
            channels: { inApp: true }
        });

        // Verify Subscription
        const sub = await RSSNotificationSubscription.findOne({
            userId: admin._id,
            feedId: feedConfig._id,
            userModel: 'Admin'
        });

        if (sub) {
            console.log('✅ Subscription successfully created for Admin!');
        } else {
            console.error('❌ Subscription NOT found!');
        }

        // 3b. Create Temp Category
        const Category = require('./models/Category');
        let category = await Category.findOne({ name: 'TestCat' });
        if (!category) {
            category = await Category.create({
                name: 'TestCat',
                slug: 'test-cat',
                description: 'Test',
                createdBy: admin._id,
                type: 'news'
            });
        }

        // 4. Test Notification (Simulating Cron Service)
        console.log('Testing Notification Generation...');
        const mockPost = new Post({
            title: 'Test Post ' + Date.now(),
            shortTitle: 'Test Post',
            body: 'Content',
            link: 'http://test.com/post/1',
            guid: 'guid-' + Date.now(),
            category: category._id, // Add valid category
            author: 'Test Author', // String required
            authorId: admin._id,
            source: 'rss_feed',
            status: 'published',
            publishDateTime: new Date()
        });
        // We don't necessarily need to save the post to DB for this unit test of service, 
        // but the service might expect populated category. 
        // Let's attach a mock category object if needed or save it.
        await mockPost.save();

        const result = await rssNotificationService.notifyNewPosts([mockPost], feedConfig);
        console.log('Notification Result:', result);

        // Verify Notification in DB
        const notif = await Notification.findOne({
            userId: admin._id,
            type: 'rss-new-post',
            relatedId: mockPost._id,
            userModel: 'Admin'
        });

        if (notif) {
            console.log('✅ Notification successfully created for Admin!');
            console.log('Notification:', notif.title);
        } else {
            console.error('❌ Notification NOT found!');
        }

        // Cleanup
        await RSSFeedConfig.findByIdAndDelete(feedConfig._id);
        await RSSNotificationSubscription.findByIdAndDelete(sub._id);
        await Post.findByIdAndDelete(mockPost._id);
        if (notif) await Notification.findByIdAndDelete(notif._id);

        console.log('Cleanup done.');

    } catch (error) {
        console.error('Verification Error:', error);
    } finally {
        process.exit();
    }
};

verifyFix();
