const User = require('../../models/User-models/User-models');

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password'); 
    // password field remove pannum

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users',
      error: error.message
    });
  }
};

module.exports = getUsers;
