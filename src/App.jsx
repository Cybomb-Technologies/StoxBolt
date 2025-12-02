
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HomePage from '@/pages/HomePage';
import PostDetailPage from '@/pages/PostDetailPage';
import CategoryPage from '@/pages/CategoryPage';
import AdminDashboard from '@/pages/AdminDashboard';
import LoginPage from '@/pages/LoginPage';
import DisclaimerPage from '@/pages/DisclaimerPage';
import TermsPage from '@/pages/TermsPage';
import PrivacyPage from '@/pages/PrivacyPage';
import RefundPolicyPage from '@/pages/RefundPolicyPage';
import AboutPage from '@/pages/AboutPage';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import FloatingIndices from '@/components/FloatingIndices';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Helmet>
          <title>StoxBolt - Your Financial News Platform</title>
          <meta name="description" content="Stay updated with the latest financial news from India, US, Global markets, Commodities, Forex, Crypto, and IPOs on StoxBolt" />
        </Helmet>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
          <Header />
          <FloatingIndices />
          <div className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/post/:id" element={<PostDetailPage />} />
              <Route path="/category/:category" element={<CategoryPage />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/disclaimer" element={<DisclaimerPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/refund-policy" element={<RefundPolicyPage />} />
              <Route path="/about" element={<AboutPage />} />
            </Routes>
          </div>
          <Footer />
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
