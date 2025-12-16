const PushSubscription = require('../models/PushSubscription');

exports.subscribePush = async (req, res) => {
  try {
    const { subscription } = req.body;

    if (!subscription) {
      return res.status(400).json({ message: 'Subscription missing' });
    }

    await PushSubscription.findOneAndUpdate(
      { userId: req.user._id },
      {
        userId: req.user._id,
        subscription
      },
      { upsert: true, new: true }
    );

    res.status(201).json({
      success: true,
      message: 'Push notification enabled'
    });
  } catch (err) {
    console.error('Push subscribe error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
