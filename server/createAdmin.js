const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Admin = require('./models/admin');

async function createAdminUser() {
  try {
    const email = 'superadmin@stoxbolt.com';
    const password = 'admin123';
    
    console.log('Creating admin user...');
    console.log('Email:', email);
    console.log('Password:', password);
    
    // Check if user already exists
    const existingUser = await Admin.findOne({ email });
    if (existingUser) {
      console.log('User already exists, deleting...');
      await Admin.deleteOne({ email });
    }
    
    // Hash the password CORRECTLY
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    console.log('Generated salt:', salt);
    console.log('Hashed password:', hashedPassword);
    console.log('Hash length:', hashedPassword.length);
    
    // Create the user
    const user = await Admin.create({
      name: 'Admin User',
      email: email,
      password: hashedPassword,
      role: 'superadmin',
      isActive: true
    });
    
    console.log('\n✅ User created successfully!');
    console.log('ID:', user._id);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('isActive:', user.isActive);
    
    // Verify the password works
    console.log('\nVerifying password...');
    const testMatch = await bcrypt.compare(password, hashedPassword);
    console.log('Password verification:', testMatch ? '✅ SUCCESS' : '❌ FAILED');
    
    // Test with the model method
    const userWithPassword = await Admin.findById(user._id).select('+password');
    const methodMatch = await userWithPassword.matchPassword(password);
    console.log('Model method verification:', methodMatch ? '✅ SUCCESS' : '❌ FAILED');
    
    mongoose.disconnect();
    console.log('\n✅ Done! You can now login with:');
    console.log('Email: admin@stoxbolt.com');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

createAdminUser();