import React, { useState, useEffect, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { 
  User, 
  Lock, 
  Bookmark, 
  Settings, 
  LogOut,
  Edit,
  Calendar,
  Mail,
  Shield,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Use React.lazy for code splitting with proper error handling
const SavedPosts = React.lazy(() => import('./profile/SavedPosts'));
const ChangePasswordForm = React.lazy(() => import('./profile/ChangePasswordForm'));

// Fallback component
const LoadingFallback = () => (
  <div className="animate-pulse">
    <div className="h-40 bg-gray-300 rounded-lg mb-6"></div>
    <div className="space-y-4">
      <div className="h-6 bg-gray-300 rounded w-3/4"></div>
      <div className="h-6 bg-gray-300 rounded w-1/2"></div>
      <div className="h-6 bg-gray-300 rounded w-2/3"></div>
    </div>
  </div>
);

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedPosts, setSavedPosts] = useState([]);
  const [savedPostsLoading, setSavedPostsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserData();
    if (activeTab === 'saved') {
      fetchSavedPosts();
    }
  }, [activeTab]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/user-login');
        return;
      }

      const response = await axios.get(`${baseURL}/api/user-auth/profile`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setUserData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError(error.response?.data?.message || 'Failed to load profile data');
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast({
          title: 'Session Expired',
          description: 'Please login again',
          variant: 'destructive'
        });
        navigate('/user-login');
        return;
      }
      
      toast({
        title: 'Error',
        description: 'Failed to load profile data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedPosts = async () => {
    try {
      setSavedPostsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${baseURL}/api/user-auth/saved-posts`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setSavedPosts(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching saved posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load saved posts',
        variant: 'destructive'
      });
    } finally {
      setSavedPostsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
    toast({
      title: 'Success',
      description: 'Logged out successfully',
      variant: 'default'
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleRetry = () => {
    fetchUserData();
    if (activeTab === 'saved') {
      fetchSavedPosts();
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  const tabContentVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      x: 20,
      transition: {
        duration: 0.2,
        ease: "easeIn"
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="animate-pulse">
            <div className="h-8 sm:h-10 bg-gray-300 rounded w-1/4 mb-6 sm:mb-8"></div>
            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
              <div className="h-40 bg-gray-300 rounded-lg mb-6"></div>
              <div className="space-y-4">
                <div className="h-6 bg-gray-300 rounded w-3/4"></div>
                <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                <div className="h-6 bg-gray-300 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div 
            className="bg-white rounded-xl shadow-lg p-6 sm:p-8 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-50 mb-4 sm:mb-6">
              <AlertCircle className="h-8 w-8 sm:h-10 sm:w-10 text-red-500" />
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">Unable to Load Profile</h2>
            <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base md:text-lg max-w-md mx-auto">{error}</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <motion.button
                onClick={handleRetry}
                className="px-6 py-3 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 text-white rounded-lg hover:opacity-90 transition-all duration-300 transform hover:-translate-y-0.5"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Try Again
              </motion.button>
              <motion.button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-300 transform hover:-translate-y-0.5"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Go Home
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Profile - StoxBolt</title>
        <meta name="description" content="Manage your StoxBolt profile, saved posts, and account settings" />
      </Helmet>

      <motion.div 
        className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-6 sm:py-8 md:py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="container mx-auto px-3 sm:px-4 md:px-6 max-w-7xl">
          {/* Page Header */}
          <motion.div 
            className="mb-6 sm:mb-8 md:mb-12"
            variants={itemVariants}
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-1 sm:mb-2">
              My Account
            </h1>
            <p className="text-gray-600 text-sm sm:text-base md:text-lg lg:text-xl">
              Manage your profile, saved posts, and account settings
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Left Sidebar - Navigation */}
            <motion.div 
              className="lg:col-span-1"
              variants={itemVariants}
            >
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6 mb-4 sm:mb-6">
                <div className="flex flex-col items-center mb-4 sm:mb-6 md:mb-8">
                  <motion.div 
                    className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 flex items-center justify-center mb-3 sm:mb-4"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <span className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                      {userData?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </motion.div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 text-center mb-1">
                    {userData?.username || 'User'}
                  </h2>
                  <p className="text-gray-500 text-xs sm:text-sm md:text-base mt-1 text-center break-words max-w-full">
                    {userData?.email}
                  </p>
                  <div className="mt-2 px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-xs font-medium">
                    {userData?.isWriter ? 'Writer Account' : 'Member'}
                  </div>
                </div>

                <nav className="space-y-1 sm:space-y-2">
                  {['profile', 'saved', 'password'].map((tab) => (
                    <motion.button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`w-full flex items-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all duration-300 text-sm sm:text-base md:text-lg ${
                        activeTab === tab
                          ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 text-white shadow-lg'
                          : 'text-gray-700 hover:bg-gradient-to-r hover:from-yellow-50 hover:via-orange-50 hover:to-red-50 hover:text-gray-900'
                      }`}
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {tab === 'profile' && <User className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />}
                      {tab === 'saved' && <Bookmark className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />}
                      {tab === 'password' && <Lock className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />}
                      {tab === 'profile' && 'Profile Info'}
                      {tab === 'saved' && 'Saved Posts'}
                      {tab === 'password' && 'Change Password'}
                      {tab === 'saved' && (
                        <span className="ml-auto bg-white/20 text-white text-xs font-medium px-2 py-1 rounded">
                          {savedPosts.length}
                        </span>
                      )}
                    </motion.button>
                  ))}

                  <motion.button
                    onClick={handleLogout}
                    className="w-full flex items-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-300 mt-3 sm:mt-4 text-sm sm:text-base md:text-lg"
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <LogOut className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                    Logout
                  </motion.button>
                </nav>
              </div>
            </motion.div>

            {/* Main Content Area */}
            <motion.div 
              className="lg:col-span-3"
              variants={itemVariants}
            >
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Tab Header */}
                <div className="border-b border-gray-200">
                  <div className="flex overflow-x-auto scrollbar-hide">
                    {['profile', 'saved', 'password'].map((tab) => (
                      <motion.button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 sm:px-5 md:px-6 py-3 sm:py-4 font-medium text-sm sm:text-base md:text-lg whitespace-nowrap flex-shrink-0 transition-all duration-300 ${
                          activeTab === tab
                            ? 'border-b-2 border-orange-600 text-orange-600 font-semibold'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {tab === 'profile' && <User className="inline mr-2 h-3 w-3 sm:h-4 sm:w-4" />}
                        {tab === 'saved' && <Bookmark className="inline mr-2 h-3 w-3 sm:h-4 sm:w-4" />}
                        {tab === 'password' && <Lock className="inline mr-2 h-3 w-3 sm:h-4 sm:w-4" />}
                        {tab === 'profile' && 'Profile Information'}
                        {tab === 'saved' && 'Saved Posts'}
                        {tab === 'password' && 'Change Password'}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="p-4 sm:p-5 md:p-6 lg:p-8">
                  <Suspense fallback={<LoadingFallback />}>
                    <AnimatePresence mode="wait">
                      {activeTab === 'profile' && (
                        <motion.div
                          key="profile"
                          variants={tabContentVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="space-y-4 sm:space-y-6 md:space-y-8"
                        >
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
                            <div>
                              <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
                                Personal Information
                              </h3>
                              <p className="text-gray-600 text-sm sm:text-base md:text-lg">
                                Your profile details and account information
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                            <div className="space-y-3 sm:space-y-4">
                              <motion.div
                                whileHover={{ scale: 1.01 }}
                                transition={{ duration: 0.2 }}
                              >
                                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1">
                                  Full Name
                                </label>
                                <div className="p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                                  <div className="flex items-center">
                                    <User className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                    <span className="font-medium text-sm sm:text-base md:text-lg">
                                      {userData?.username || 'Not set'}
                                    </span>
                                  </div>
                                </div>
                              </motion.div>

                              <motion.div
                                whileHover={{ scale: 1.01 }}
                                transition={{ duration: 0.2 }}
                              >
                                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1">
                                  Email Address
                                </label>
                                <div className="p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                                  <div className="flex items-center">
                                    <Mail className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                    <span className="font-medium text-sm sm:text-base md:text-lg truncate">
                                      {userData?.email}
                                    </span>
                                    {userData?.emailVerified && (
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 200 }}
                                      >
                                        <CheckCircle className="ml-2 h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                                      </motion.div>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            </div>

                            <div className="space-y-3 sm:space-y-4">
                              <motion.div
                                whileHover={{ scale: 1.01 }}
                                transition={{ duration: 0.2 }}
                              >
                                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1">
                                  Account Created
                                </label>
                                <div className="p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                                  <div className="flex items-center">
                                    <Calendar className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                    <span className="font-medium text-sm sm:text-base md:text-lg">
                                      {formatDate(userData?.createdAt)}
                                    </span>
                                  </div>
                                </div>
                              </motion.div>

                              <motion.div
                                whileHover={{ scale: 1.01 }}
                                transition={{ duration: 0.2 }}
                              >
                                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1">
                                  Login Method
                                </label>
                                <div className="p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                                  <div className="flex items-center">
                                    <Shield className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                    <span className="font-medium text-sm sm:text-base md:text-lg">
                                      {userData?.googleId ? 'Google Sign-in' : 'Email & Password'}
                                    </span>
                                  </div>
                                </div>
                              </motion.div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {activeTab === 'saved' && (
                        <motion.div
                          key="saved"
                          variants={tabContentVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                        >
                          <SavedPosts 
                            posts={savedPosts} 
                            loading={savedPostsLoading}
                            onRefresh={fetchSavedPosts}
                          />
                        </motion.div>
                      )}

                      {activeTab === 'password' && (
                        <motion.div
                          key="password"
                          variants={tabContentVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                        >
                          <ChangePasswordForm 
                            email={userData?.email}
                            onSuccess={() => {
                              toast({
                                title: 'Success',
                                description: 'Password changed successfully',
                                variant: 'default'
                              });
                            }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Suspense>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};

export default Profile;