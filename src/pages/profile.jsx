import React, { useState, useEffect, Suspense } from 'react'; // Added Suspense
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
        // Token is invalid or expired
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="bg-white rounded-xl shadow-lg p-8">
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Profile</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleRetry}
                className="px-6 py-3 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
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

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 md:py-12">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              My Account
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Manage your profile, saved posts, and account settings
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
            {/* Left Sidebar - Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
                <div className="flex flex-col items-center mb-6 sm:mb-8">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 flex items-center justify-center mb-4">
                    <span className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                      {userData?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 text-center">
                    {userData?.username || 'User'}
                  </h2>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1 text-center">{userData?.email}</p>
                  <div className="mt-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    {userData?.isWriter ? 'Writer Account' : 'Member'}
                  </div>
                </div>

                <nav className="space-y-1 sm:space-y-2">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors text-sm sm:text-base ${
                      activeTab === 'profile'
                        ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 text-white'
                        : 'text-gray-700 hover:bg-orange-50'
                    }`}
                  >
                    <User className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                    Profile Info
                  </button>

                  <button
                    onClick={() => setActiveTab('saved')}
                    className={`w-full flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors text-sm sm:text-base ${
                      activeTab === 'saved'
                        ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 text-white'
                        : 'text-gray-700 hover:bg-orange-50'
                    }`}
                  >
                    <Bookmark className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                    Saved Posts
                    <span className="ml-auto bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded">
                      {savedPosts.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('password')}
                    className={`w-full flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors text-sm sm:text-base ${
                      activeTab === 'password'
                        ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 text-white'
                        : 'text-gray-700 hover:bg-orange-50'
                    }`}
                  >
                    <Lock className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                    Change Password
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors mt-2 sm:mt-4 text-sm sm:text-base"
                  >
                    <LogOut className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                    Logout
                  </button>
                </nav>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Tab Header */}
                <div className="border-b">
                  <div className="flex overflow-x-auto">
                    <button
                      onClick={() => setActiveTab('profile')}
                      className={`px-4 sm:px-6 py-3 sm:py-4 font-medium text-sm sm:text-base whitespace-nowrap ${
                        activeTab === 'profile'
                          ? 'border-b-2 border-orange-600 text-orange-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <User className="inline mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      Profile Information
                    </button>
                    <button
                      onClick={() => setActiveTab('saved')}
                      className={`px-4 sm:px-6 py-3 sm:py-4 font-medium text-sm sm:text-base whitespace-nowrap ${
                        activeTab === 'saved'
                          ? 'border-b-2 border-orange-600 text-orange-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Bookmark className="inline mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      Saved Posts
                    </button>
                    <button
                      onClick={() => setActiveTab('password')}
                      className={`px-4 sm:px-6 py-3 sm:py-4 font-medium text-sm sm:text-base whitespace-nowrap ${
                        activeTab === 'password'
                          ? 'border-b-2 border-orange-600 text-orange-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Lock className="inline mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      Change Password
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                <div className="p-4 sm:p-6">
                  <Suspense fallback={<LoadingFallback />}>
                    {activeTab === 'profile' && (
                      <div className="space-y-4 sm:space-y-6">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                          <div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                              Personal Information
                            </h3>
                            <p className="text-gray-600 mt-1 text-sm sm:text-base">
                              Your profile details and account information
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                          <div className="space-y-3 sm:space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name
                              </label>
                              <div className="p-3 bg-gray-50 rounded-lg border">
                                <div className="flex items-center">
                                  <User className="mr-2 h-4 w-4 text-gray-400" />
                                  <span className="font-medium">
                                    {userData?.username || 'Not set'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                              </label>
                              <div className="p-3 bg-gray-50 rounded-lg border">
                                <div className="flex items-center">
                                  <Mail className="mr-2 h-4 w-4 text-gray-400" />
                                  <span className="font-medium truncate">{userData?.email}</span>
                                  {userData?.emailVerified && (
                                    <CheckCircle className="ml-2 h-4 w-4 text-green-500 flex-shrink-0" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3 sm:space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Account Created
                              </label>
                              <div className="p-3 bg-gray-50 rounded-lg border">
                                <div className="flex items-center">
                                  <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                                  <span className="font-medium">
                                    {formatDate(userData?.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Login Method
                              </label>
                              <div className="p-3 bg-gray-50 rounded-lg border">
                                <div className="flex items-center">
                                  <Shield className="mr-2 h-4 w-4 text-gray-400" />
                                  <span className="font-medium">
                                    {userData?.googleId ? 'Google Sign-in' : 'Email & Password'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'saved' && (
                      <SavedPosts 
                        posts={savedPosts} 
                        loading={savedPostsLoading}
                        onRefresh={fetchSavedPosts}
                      />
                    )}

                    {activeTab === 'password' && (
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
                    )}
                  </Suspense>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;