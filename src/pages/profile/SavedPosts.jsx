import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, ExternalLink, Trash2, Calendar, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SavedPosts = ({ posts, loading, onRefresh }) => {
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState(null);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleRemoveSaved = async (postId) => {
    try {
      setDeletingId(postId);
      const token = localStorage.getItem('token');
      
      await axios.delete(`${baseURL}/api/user-auth/saved-posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast({
        title: 'Success',
        description: 'Post removed from saved items',
        variant: 'default'
      });

      onRefresh();
    } catch (error) {
      console.error('Error removing saved post:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove saved post',
        variant: 'destructive'
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleRemoveAll = async () => {
    if (!window.confirm('Are you sure you want to remove all saved posts?')) return;

    try {
      const token = localStorage.getItem('token');
      
      await axios.delete(`${baseURL}/api/user-auth/saved-posts`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast({
        title: 'Success',
        description: 'All saved posts removed',
        variant: 'default'
      });

      onRefresh();
    } catch (error) {
      console.error('Error removing all saved posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove saved posts',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-24 sm:h-32 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-yellow-50 to-orange-50 mb-4">
          <Bookmark className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">No Saved Posts Yet</h3>
        <p className="text-gray-600 mb-4 sm:mb-6 max-w-md mx-auto text-sm sm:text-base">
          Save posts you want to read later by clicking the bookmark icon on any article
        </p>
        <Link
          to="/"
          className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 text-white rounded-lg hover:opacity-90 transition-opacity text-sm sm:text-base"
        >
          <Eye className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          Browse Articles
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Saved Posts</h3>
          <p className="text-gray-600 text-sm sm:text-base">
            Posts you've saved to read later
          </p>
        </div>
        {posts.length > 0 && (
          <button
            onClick={handleRemoveAll}
            className="flex items-center px-3 sm:px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm sm:text-base w-full sm:w-auto justify-center"
          >
            <Trash2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-3 sm:space-y-4">
        {posts.map((post) => (
          <div
            key={post._id}
            className="group border border-gray-200 rounded-xl hover:border-orange-300 transition-all duration-300 hover:shadow-md"
          >
            <div className="p-3 sm:p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-start gap-3 sm:gap-4">
                {/* Post Image */}
                {post.image && (
                  <div className="md:w-1/4">
                    <div className="relative overflow-hidden rounded-lg aspect-video md:aspect-square">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {post.isSponsored && (
                        <span className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                          Sponsored
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Post Content */}
                <div className={`flex-1 ${post.image ? 'md:w-3/4' : ''}`}>
                  <div className="flex justify-between items-start mb-2 sm:mb-3">
                    <div className="flex-1 min-w-0 mr-2">
                      <Link
                        to={`/post/${post.slug || post._id}`}
                        className="text-base sm:text-lg md:text-xl font-bold text-gray-900 hover:text-orange-600 transition-colors line-clamp-2"
                      >
                        {post.title}
                      </Link>
                      <div className="flex flex-wrap items-center mt-1 sm:mt-2 text-xs sm:text-sm text-gray-500 gap-1 sm:gap-2">
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          <span>{formatDate(post.createdAt)}</span>
                        </div>
                        {post.category && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                              {post.category}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveSaved(post._id)}
                      disabled={deletingId === post._id}
                      className="ml-1 sm:ml-2 p-1 sm:p-2 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                      title="Remove from saved"
                    >
                      {deletingId === post._id ? (
                        <div className="h-3 w-3 sm:h-4 sm:w-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                    </button>
                  </div>

                  <p className="text-gray-600 mb-3 sm:mb-4 line-clamp-2 text-sm sm:text-base">
                    {post.summary || post.excerpt || ''}
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      {post.tags && post.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gradient-to-br from-yellow-50 to-orange-50 text-orange-700 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <Link
                      to={`/post/${post.slug || post._id}`}
                      className="flex items-center text-orange-600 hover:text-orange-700 font-medium text-sm sm:text-base mt-2 sm:mt-0"
                    >
                      Read Article
                      <ExternalLink className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
        <div className="flex items-center justify-center text-gray-500 text-sm sm:text-base">
          <Bookmark className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          <span>You have {posts.length} saved {posts.length === 1 ? 'post' : 'posts'}</span>
        </div>
      </div>
    </div>
  );
};

export default SavedPosts;