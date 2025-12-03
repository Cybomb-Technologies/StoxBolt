import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HomePage from '@/pages/HomePage';
import PostDetailPage from '@/pages/PostDetailPage';
import CategoryPage from '@/pages/CategoryPage';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import LoginPage from '@/pages/admin/LoginPage';
import DisclaimerPage from '@/pages/DisclaimerPage';
import TermsPage from '@/pages/TermsPage';
import PrivacyPage from '@/pages/PrivacyPage';
import RefundPolicyPage from '@/pages/RefundPolicyPage';
import AboutPage from '@/pages/AboutPage';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import FloatingIndices from '@/components/FloatingIndices';
import ProtectedRoute from '@/components/ProtectedRoute';
import PostPreview from '@/components/admin/PostPreview';
// Main Layout Component (with header/footer)
const MainLayout = () => {
  return (
    <>
      <Header />
      <FloatingIndices />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-16">
        <main className="flex-grow">
          <Outlet />
        </main>
      </div>
      <Footer />
    </>
  );
};

// Admin Layout Component (without header/footer)
const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Outlet />
    </div>
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
        
        <Routes>
          {/* Admin Routes (without header/footer) */}
          <Route element={<AdminLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
          </Route>
          
          {/* Main Website Routes (with header/footer) */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/post/:id" element={<PostDetailPage />} />
            <Route path="/category/:category" element={<CategoryPage />} />
            <Route path="/disclaimer" element={<DisclaimerPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/refund-policy" element={<RefundPolicyPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/post/preview" element={<PostPreview />} />
            {/* Redirect any unmatched routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;