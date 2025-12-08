import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, ExternalLink, Trash2, Calendar, Eye, Clock, User, Tag, AlertCircle } from 'lucide-react';
import axios from 'axios';

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

      // Update local state
      setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
      
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

  const LoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="h-8 w-48 mb-2 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="border rounded-lg overflow-hidden bg-white shadow-sm">
          <div className="p-0">
            <div className="flex flex-col md:flex-row">
              <div className="h-48 md:h-auto md:w-1/3 lg:w-1/4 bg-gray-200 animate-pulse" />
              <div className="flex-1 p-6">
                <div className="h-6 w-full mb-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-3/4 mb-3 bg-gray-200 rounded animate-pulse" />
                <div className="flex items-center gap-4 mb-3">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-4 w-full mb-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-2/3 mb-4 bg-gray-200 rounded animate-pulse" />
                <div className="flex justify-between">
                  <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
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
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Saved Posts</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
        <button
          onClick={fetchSavedPosts}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-50 to-orange-50 mb-4">
          <Bookmark className="h-8 w-8 text-orange-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Saved Posts Yet</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Save posts you want to read later by clicking the bookmark icon on any article
        </p>
        <Link
          to="/"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          <Eye className="mr-2 h-4 w-4" />
          Browse Articles
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Saved Posts</h1>
          <p className="text-gray-600 mt-1">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'} saved for later
          </p>
        </div>
        <button
          onClick={handleRemoveAll}
          disabled={removingAll}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 w-full sm:w-auto"
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
        </button>
      </div>

      <div className="grid gap-6">
        {posts.map((post) => (
          <div 
            key={post._id} 
            className="border rounded-lg bg-white group hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
            onClick={() => handlePostClick(post.slug)}
          >
            <div className="p-0">
              <div className="flex flex-col md:flex-row">
                {/* Post Image */}
                {post.image && (
                  <div className="md:w-1/3 lg:w-1/4">
                    <div className="relative h-48 md:h-full overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                        }}
                      />
                      {post.isSponsored && (
                        <span className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                          Sponsored
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Post Content */}
                <div className={`flex-1 p-6 ${post.image ? 'md:w-2/3 lg:w-3/4' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 mr-4">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2 mb-2">
                        {post.title}
                      </h3>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3 flex-wrap">
                        <div className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          <span>{post.author}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{formatDate(post.createdAt)}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{formatReadTime(post.readTime)}</span>
                        </div>
                      </div>

                      {post.summary && (
                        <p className="text-gray-600 line-clamp-2 mb-4">
                          {post.summary}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {post.category && (
                            <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                              {post.category}
                            </span>
                          )}
                          {post.tags && post.tags.slice(0, 2).map((tag, index) => (
                            <span
                              key={index}
                              className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                            >
                              <Tag className="h-3 w-3 mr-1" />
                              {typeof tag === 'string' ? tag : JSON.stringify(tag)}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            className="px-3 py-1 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePostClick(post.slug);
                            }}
                          >
                            <ExternalLink className="inline h-4 w-4 mr-1" />
                            Read
                          </button>
                          <button
                            onClick={(e) => handleRemoveSaved(post._id, e)}
                            disabled={deletingId === post._id}
                            className="px-3 py-1 text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg disabled:opacity-50 text-sm"
                          >
                            {deletingId === post._id ? (
                              <div className="h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin inline-block"></div>
                            ) : (
                              <>
                                <Trash2 className="inline h-4 w-4 mr-1" />
                                Remove
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-center text-gray-500">
          <Bookmark className="mr-2 h-4 w-4" />
          <span>You have {posts.length} saved {posts.length === 1 ? 'post' : 'posts'}</span>
        </div>
      </div>
    </div>
  );
};

export default SavedPosts;