const webpush = require('web-push');
const PushSubscription = require('../models/webPush/PushSubscription');

exports.sendPushToUsers = async ({ title, message, url }) => {
  const subs = await PushSubscription.find();

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        sub.subscription,
        JSON.stringify({ title, message, url })
      );
    } catch (err) {
      console.error('Push failed:', err.message);
    }
  }
};
