
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

// Import components directly to avoid any import issues
const Header = React.lazy(() => import('@/components/Header'));
const Footer = React.lazy(() => import('@/components/Footer'));
const HomePage = React.lazy(() => import('@/pages/HomePage'));
const PostDetailPage = React.lazy(() => import('@/pages/PostDetailPage'));
const CategoryPage = React.lazy(() => import('@/pages/CategoryPage'));
const AdminDashboard = React.lazy(() => import('@/pages/admin/AdminDashboard'));
const LoginPage = React.lazy(() => import('@/pages/admin/LoginPage'));
const DisclaimerPage = React.lazy(() => import('@/pages/DisclaimerPage'));
const TermsPage = React.lazy(() => import('@/pages/TermsPage'));
const PrivacyPage = React.lazy(() => import('@/pages/PrivacyPage'));
const RefundPolicyPage = React.lazy(() => import('@/pages/RefundPolicyPage'));
const AboutPage = React.lazy(() => import('@/pages/AboutPage'));
const FloatingIndices = React.lazy(() => import('@/components/FloatingIndices'));

// Admin Components
const PostList = React.lazy(() => import('@/components/admin/PostList'));
const PostEditor = React.lazy(() => import('@/components/admin/PostEditor'));
const PostPreview = React.lazy(() => import('@/components/admin/PostPreview'));
const BulkUpload = React.lazy(() => import('@/components/admin/BulkUpload'));
const PostScheduler = React.lazy(() => import('@/components/admin/PostScheduler'));
const ActivityLog = React.lazy(() => import('@/components/admin/ActivityLog'));
const AdminList = React.lazy(() => import('@/components/admin/AdminList'));
const CreateAdmin = React.lazy(() => import('@/components/admin/CreateAdmin'));
const EditAdmin = React.lazy(() => import('@/components/admin/EditAdmin'));
const Overview = React.lazy(() => import('@/components/admin/Overview'));

// Loading fallback
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

// Main Layout Component
const MainLayout = ({ children }) => {
  return (
    <>
      <React.Suspense fallback={<LoadingFallback />}>
        <Header />
        <FloatingIndices />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-16">
          <main className="flex-grow">
            {children}
          </main>
        </div>
        <Footer />
      </React.Suspense>
    </>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Helmet>
          <title>StoxBolt - Your Financial News Platform</title>
          <meta name="description" content="Stay updated with the latest financial news from India, US, Global markets, Commodities, Forex, Crypto, and IPOs on StoxBolt" />
        </Helmet>
        
        <React.Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Public routes with main layout */}
            <Route path="/" element={
              <MainLayout>
                <HomePage />
              </MainLayout>
            } />
            <Route path="/post/:id" element={
              <MainLayout>
                <PostDetailPage />
              </MainLayout>
            } />
            <Route path="/category/:category" element={
              <MainLayout>
                <CategoryPage />
              </MainLayout>
            } />
            <Route path="/disclaimer" element={
              <MainLayout>
                <DisclaimerPage />
              </MainLayout>
            } />
            <Route path="/terms" element={
              <MainLayout>
                <TermsPage />
              </MainLayout>
            } />
            <Route path="/privacy" element={
              <MainLayout>
                <PrivacyPage />
              </MainLayout>
            } />
            <Route path="/refund-policy" element={
              <MainLayout>
                <RefundPolicyPage />
              </MainLayout>
            } />
            <Route path="/about" element={
              <MainLayout>
                <AboutPage />
              </MainLayout>
            } />
            
            {/* Admin Routes - All nested under AdminDashboard layout */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }>
              <Route index path="/admin/overview"element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <Overview /> 
                </React.Suspense>
              } />
              <Route path="posts/list" element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <PostList />
                </React.Suspense>
              } />
              <Route path="posts/new" element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <PostEditor />
                </React.Suspense>
              } />
              <Route path="posts/edit/:id" element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <PostEditor />
                </React.Suspense>
              } />
              <Route path="bulk-upload" element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <BulkUpload />
                </React.Suspense>
              } />
              <Route path="scheduler" element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <PostScheduler />
                </React.Suspense>
              } />
              <Route path="activity" element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <ActivityLog />
                </React.Suspense>
              } />
              <Route path="preview" element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <PostPreview />
                </React.Suspense>
              } />
              <Route path="users" element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <AdminList />
                </React.Suspense>
              } />
              <Route path="users/create" element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <CreateAdmin />
                </React.Suspense>
              } />
              <Route path="users/edit/:id" element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <EditAdmin />
                </React.Suspense>
              } />
            </Route>
            
            {/* Preview route (public but with main layout) */}
            <Route path="/post/preview" element={
              <MainLayout>
                <React.Suspense fallback={<LoadingFallback />}>
                  <PostPreview />
                </React.Suspense>
              </MainLayout>
            } />
            
            {/* Redirect any unmatched routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </React.Suspense>
        
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;
