try {
  const routes = require('./routes/rssFeedRoutes');
  console.log('Successfully loaded rssFeedRoutes');
} catch (error) {
  console.error('Failed to load rssFeedRoutes:', error);
  process.exit(1);
}
