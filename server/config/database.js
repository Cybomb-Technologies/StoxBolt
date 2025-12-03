const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Create default admin user if not exists
    await createDefaultAdmin();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const createDefaultAdmin = async () => {
  const User = require('../models/admin');
  const bcrypt = require('bcryptjs');
  
  try {
    // Check if any admin exists
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists) {
      // Create default admin
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const defaultAdmin = new User({
        name: 'Super Admin',
        email: 'admin@stoxbolt.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true
      });
      
      await defaultAdmin.save();
      console.log('Default admin created: admin@stoxbolt.com / admin123');
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
};

module.exports = connectDB;