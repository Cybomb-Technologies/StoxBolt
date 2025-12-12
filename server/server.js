const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path'); // Add this
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());

const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:5000', 'http://localhost:5173', 'https://stoxbolt.com'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Serve static files with proper headers
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, path) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Debug middleware to check paths
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Import routes
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const schedulerRoutes = require('./routes/schedulerRoutes');
const activityRoutes = require('./routes/activityRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const bulkUploadRoutes = require('./routes/bulkUploadRoutes');
const approvalRoutes = require('./routes/approvalRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const publicPostRoutes = require('./routes/publicPostRoutes');
// Try different paths for userAuthRoutes
const userAuthRoutes = require('./routes/User-routes/User-routes');
const rssFeedRoutes = require('./routes/rssFeedRoutes');

// Routes
app.use('/api/auth', authRoutes); //Auth Routes(Admin)
app.use('/api/posts', postRoutes); 
app.use('/api/scheduler', schedulerRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/users', adminRoutes); //Admin User Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/bulk-upload', bulkUploadRoutes);
app.use('/api/approval', approvalRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/rss', rssFeedRoutes);

app.use('/api/user-auth', userAuthRoutes); //User Routes
app.use('/api/public-posts', publicPostRoutes); 
// Enhanced health check
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };
  
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: statusMap[dbStatus] || 'Unknown',
    routesLoaded: {
      auth: true,
      posts: true,
      scheduler: true,
      activities: true,
      users: true,
      upload: true,
      bulkUpload: true,
      approval: true,
      categories: true,
      userAuth: !!userAuthRoutes
    }
  });
});

// Route test endpoint
app.get('/test-paths', (req, res) => {
  res.json({
    currentDir: __dirname,
    routesDir: path.join(__dirname, 'routes'),
    userRoutesPath: path.join(__dirname, 'routes', 'User-routes', 'User-routes.js'),
    fileExists: require('fs').existsSync(path.join(__dirname, 'routes', 'User-routes', 'User-routes.js'))
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err.message);
  console.error('Stack:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    path: err.path || 'Unknown'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      '/api/auth',
      '/api/posts',
      '/api/scheduler',
      '/api/activities',
      '/api/users',
      '/api/upload',
      '/api/bulk-upload',
      '/api/approval',
      '/api/categories',
      '/api/user-auth',
      '/health',
      '/test-paths',
       '/api/rss',
    ]
  });
});

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stoxbolt', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

connectDB();

const PORT = process.env.PORT;

const server = app.listen(PORT, () => {
  console.log(`
🚀 Server running on port ${PORT}
📁 Current directory: ${__dirname}
🔗 Test paths at: http://localhost:${PORT}/test-paths
🩺 Health check: http://localhost:${PORT}/health
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = { app, server };