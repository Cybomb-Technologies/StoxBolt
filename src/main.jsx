import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';

// Hook to scroll to top on route changes
const useScrollToTop = () => {
  React.useEffect(() => {
    // Function to scroll to top
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });
    };
    
    // Scroll on initial load
    scrollToTop();
    
    // Listen for popstate events (browser back/forward)
    window.addEventListener('popstate', scrollToTop);
    
    // Override pushState to detect programmatic navigation
    const originalPushState = window.history.pushState;
    window.history.pushState = function(...args) {
      const result = originalPushState.apply(this, args);
      scrollToTop();
      return result;
    };
    
    return () => {
      window.removeEventListener('popstate', scrollToTop);
      window.history.pushState = originalPushState;
    };
  }, []);
};

// Register service worker for push notifications
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(reg => console.log('✅ Service Worker registered'))
    .catch(err => console.error('❌ Service Worker registration failed:', err));
}

// Main component
const Root = () => {
  useScrollToTop();
  
  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <Root />
);