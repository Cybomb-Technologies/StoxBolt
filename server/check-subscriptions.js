// check-subscriptions.js
require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔌 Connecting to MongoDB...');
mongoose.connect(process.env.MONGODB_URI);

const PushSubscription = require('./models/webPush/PushSubscription');
const RSSNotificationSubscription = require('./models/rssNotification/RSSNotificationSubscription');

async function checkSubscriptions() {
    try {
        console.log('\n📊 Checking Push Subscriptions...');
        const pushSubs = await PushSubscription.find({});
        console.log(`Found ${pushSubs.length} push subscriptions`);

        if (pushSubs.length > 0) {
            pushSubs.forEach((sub, i) => {
                console.log(`\n${i + 1}. Push Subscription:`);
                console.log(`   User ID: ${sub.userId || 'N/A'}`);
                console.log(`   Endpoint: ${sub.endpoint?.substring(0, 50)}...`);
                console.log(`   Active: ${sub.isActive}`);
                console.log(`   Created: ${sub.createdAt}`);
            });
        }

        console.log('\n📊 Checking RSS Subscriptions...');
        const rssSubs = await RSSNotificationSubscription.find({});
        console.log(`Found ${rssSubs.length} RSS subscriptions`);

        if (rssSubs.length > 0) {
            rssSubs.forEach((sub, i) => {
                console.log(`\n${i + 1}. RSS Subscription:`);
                console.log(`   User ID: ${sub.userId}`);
                console.log(`   Type: ${sub.subscriptionType}`);
                console.log(`   Channels:`, sub.channels);
                if (sub.channels.webPush) {
                    console.log('   ✅ WebPush ENABLED');
                } else {
                    console.log('   ⚠️ WebPush DISABLED (In-app only)');
                }
                console.log(`   Active: ${sub.isActive}`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit();
    }
}

checkSubscriptions();
