import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, ExternalLink, Trash2, Calendar, Eye, Clock, User, Tag, AlertCircle, ChevronRight, Sparkles } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SavedPosts = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [removingAll, setRemovingAll] = useState(false);
  const [error, setError] = useState(null);

  const fetchSavedPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please login to view saved posts');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${baseURL}/api/user-auth/bookmarks`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPosts(response.data.data || []);
      } else {
        setError(response.data.message || 'Failed to load saved posts');
      }
    } catch (error) {
      console.error('Error fetching saved posts:', error);
      if (error.response?.status === 401) {
        setError('Your session has expired. Please login again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError(error.response?.data?.message || 'Failed to load saved posts');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchSavedPosts();
  }, [fetchSavedPosts]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatReadTime = (readTime) => {
    if (!readTime) return '5 min read';
    return typeof readTime === 'string' ? readTime : `${readTime} min read`;
  };

  const handleRemoveSaved = async (postId, e) => {
    e?.stopPropagation();
    
    try {
      setDeletingId(postId);
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Please login to manage saved posts');
        navigate('/login');
        return;
      }

      await axios.delete(`${baseURL}/api/user-auth/bookmarks/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state with animation
      setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
      
      // Show success message
      alert('Post removed from saved items');
    } catch (error) {
      console.error('Error removing saved post:', error);
      alert(error.response?.data?.message || 'Failed to remove saved post');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRemoveAll = async () => {
    if (!window.confirm('Are you sure you want to remove all saved posts? This action cannot be undone.')) return;

    try {
      setRemovingAll(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Please login to manage saved posts');
        navigate('/login');
        return;
      }

      await axios.delete(`${baseURL}/api/user-auth/bookmarks`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPosts([]);
      
      alert('All saved posts removed');
    } catch (error) {
      console.error('Error removing all saved posts:', error);
      alert(error.response?.data?.message || 'Failed to remove saved posts');
    } finally {
      setRemovingAll(false);
    }
  };

  const handlePostClick = (slug) => {
    navigate(`/post/${slug}`, "_blank");
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
    },
    exit: {
      y: -20,
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: "easeIn"
      }
    }
  };

  const LoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="h-8 w-48 mb-2 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse" />
        </div>
        <div className="h-10 w-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="border rounded-lg overflow-hidden bg-white shadow-sm animate-pulse">
          <div className="p-0">
            <div className="flex flex-col md:flex-row">
              <div className="h-48 md:h-auto md:w-1/3 lg:w-1/4 bg-gradient-to-r from-gray-200 to-gray-300" />
              <div className="flex-1 p-4 sm:p-6">
                <div className="h-6 w-full mb-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded" />
                <div className="h-4 w-3/4 mb-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded" />
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <div className="h-4 w-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded" />
                  <div className="h-4 w-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded" />
                  <div className="h-4 w-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded" />
                </div>
                <div className="h-4 w-full mb-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded" />
                <div className="h-4 w-2/3 mb-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded" />
                <div className="flex flex-wrap justify-between gap-3">
                  <div className="h-6 w-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded" />
                  <div className="h-6 w-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <motion.div 
        className="text-center py-8 sm:py-12 md:py-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-red-50 to-pink-50 mb-4 sm:mb-6">
          <AlertCircle className="h-8 w-8 sm:h-10 sm:w-10 text-red-500" />
        </div>
        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">Error Loading Saved Posts</h3>
        <p className="text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base md:text-lg">{error}</p>
        <motion.button
          onClick={fetchSavedPosts}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-300 transform hover:-translate-y-0.5"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Try Again
        </motion.button>
      </motion.div>
    );
  }

  if (posts.length === 0) {
    return (
      <motion.div 
        className="text-center py-8 sm:py-12 md:py-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-yellow-50 to-orange-50 mb-4 sm:mb-6">
          <Bookmark className="h-8 w-8 sm:h-10 sm:w-10 text-orange-500" />
        </div>
        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">No Saved Posts Yet</h3>
        <p className="text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base md:text-lg">
          Save posts you want to read later by clicking the bookmark icon on any article
        </p>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Eye className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Browse Articles
            <ChevronRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
          </Link>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1">Saved Posts</h1>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'} saved for later
          </p>
        </div>
        <motion.button
          onClick={handleRemoveAll}
          disabled={removingAll}
          className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 disabled:opacity-50 w-full sm:w-auto transition-all duration-300 transform hover:-translate-y-0.5 shadow-md hover:shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {removingAll ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
              Clearing...
            </>
          ) : (
            <>
              <Trash2 className="inline mr-2 h-4 w-4" />
              Clear All
            </>
          )}
        </motion.button>
      </div>

      <AnimatePresence>
        <div className="grid gap-4 sm:gap-5 md:gap-6">
          {posts.map((post, index) => (
            <motion.div 
              key={post._id}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout
              className="border rounded-xl bg-white group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1"
              onClick={() => handlePostClick(post.slug)}
            >
              <div className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Post Image */}
                  {post.image && (
                    <div className="md:w-1/3 lg:w-1/4">
                      <div className="relative h-48 md:h-full overflow-hidden">
                        <motion.img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                          }}
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.3 }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        {post.isSponsored && (
                          <span className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                            Sponsored
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Post Content */}
                  <div className={`flex-1 p-4 sm:p-5 md:p-6 ${post.image ? 'md:w-2/3 lg:w-3/4' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1 mr-4">
                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors duration-300 line-clamp-2 mb-2">
                          {post.title}
                        </h3>
                        
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center">
                            <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            <span className="text-xs sm:text-sm">{post.author}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            <span className="text-xs sm:text-sm">{formatDate(post.createdAt)}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            <span className="text-xs sm:text-sm">{formatReadTime(post.readTime)}</span>
                          </div>
                        </div>

                        {post.summary && (
                          <p className="text-gray-600 line-clamp-2 mb-4 text-sm sm:text-base md:text-lg">
                            {post.summary}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            {post.category && (
                              <span className="px-3 py-1 bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 text-xs font-medium rounded-full">
                                {post.category}
                              </span>
                            )}
                            {post.tags && post.tags.slice(0, 2).map((tag, index) => (
                              <span
                                key={index}
                                className="flex items-center px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 text-xs rounded-full"
                              >
                                <Tag className="h-3 w-3 mr-1" />
                                {typeof tag === 'string' ? tag : JSON.stringify(tag)}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-2">
                            <motion.button
                              className="px-3 sm:px-4 py-1.5 sm:py-2 text-gray-600 hover:text-white bg-gray-50 hover:bg-gradient-to-r hover:from-orange-500 hover:to-red-600 border border-gray-300 hover:border-transparent rounded-lg transition-all duration-300 text-xs sm:text-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePostClick(post.slug);
                              }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <ExternalLink className="inline h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              Read
                            </motion.button>
                            <motion.button
                              onClick={(e) => handleRemoveSaved(post._id, e)}
                              disabled={deletingId === post._id}
                              className="px-3 sm:px-4 py-1.5 sm:py-2 text-red-500 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-600 border border-red-200 hover:border-transparent rounded-lg disabled:opacity-50 transition-all duration-300 text-xs sm:text-sm"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {deletingId === post._id ? (
                                <div className="h-3 w-3 sm:h-4 sm:w-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin inline-block"></div>
                              ) : (
                                <>
                                  <Trash2 className="inline h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                  Remove
                                </>
                              )}
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      <motion.div 
        className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center text-gray-500 text-sm sm:text-base">
            <Bookmark className="mr-2 h-4 w-4 text-orange-500" />
            <span>You have {posts.length} saved {posts.length === 1 ? 'post' : 'posts'}</span>
          </div>
          <motion.button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Back to top ↑
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SavedPosts;