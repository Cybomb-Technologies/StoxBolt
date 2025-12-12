import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Share2, Bookmark, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';
import { getRandomImage } from '@/utils/imageUtils';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PostCard = ({ post, index }) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (post?.id || post?._id) {
      checkBookmarkStatus();
    }
  }, [post?.id, post?._id]);

  const checkBookmarkStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const postId = post?.id || post?._id;
      
      if (token && postId) {
        const response = await axios.get(
          `${baseURL}/api/user-auth/bookmarks/${postId}/status`, 
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        // Handle different response formats
        if (response.data.success !== undefined) {
          setIsBookmarked(response.data.data?.isBookmarked || response.data.isBookmarked || false);
        } else {
          setIsBookmarked(response.data?.isBookmarked || false);
        }
      }
    } catch (error) {
      console.error('Error checking bookmark status:', error);
      // Don't show error toast for failed bookmark status check
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: post?.title || '',
          text: post?.summary || (post?.body ? post.body.substring(0, 100) : ''),
          url: `${window.location.origin}/post/${post?.id || post?._id || ''}`
        });
      } else {
        await navigator.clipboard.writeText(`${window.location.origin}/post/${post?.id || post?._id || ''}`);
        toast({
          title: 'Link Copied!',
          description: 'Post link copied to clipboard'
        });
      }
      
      const postId = post?.id || post?._id;
      if (postId) {
        try {
          await axios.post(`${baseURL}/api/public-posts/${postId}/share`, {}, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
        } catch (shareError) {
          console.log('Share tracking failed (not critical):', shareError);
        }
      }
    } catch (error) {
      // Ignore "AbortError" from user cancelling share
      if (error.name !== 'AbortError') {
        console.error('Error sharing post:', error);
      }
    }
  };

  const handleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setBookmarkLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const postId = post?.id || post?._id;
      
      if (!token) {
        toast({
          title: 'Login Required',
          description: 'Please login to bookmark posts',
          variant: 'destructive'
        });
        return;
      }

      if (!postId) {
        toast({
          title: 'Error',
          description: 'Invalid post data',
          variant: 'destructive'
        });
        return;
      }

      if (isBookmarked) {
        // Remove bookmark
        await axios.delete(`${baseURL}/api/user-auth/bookmarks/${postId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setIsBookmarked(false);
        toast({
          title: 'Removed from bookmarks',
          description: 'Post removed from your saved items'
        });
      } else {
        // Add bookmark using POST to toggle endpoint
        await axios.post(
          `${baseURL}/api/user-auth/posts/${postId}/bookmark`, 
          {}, // Empty body
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        setIsBookmarked(true);
        toast({
          title: 'Added to bookmarks',
          description: 'Post saved successfully'
        });
      }
    } catch (error) {
      console.error('Error updating bookmark:', error);
      
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Failed to update bookmark';
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setBookmarkLoading(false);
    }
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Recently';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';
    
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  // Updated to always return orange color
  const getCategoryColor = () => {
    return 'bg-orange-500';
  };

  const getImageUrl = (postData) => {
    if (!postData) return '';
    
    // Check all possible image property names
    return postData.imageUrl || 
           postData.image || 
           postData.thumbnail || 
           postData.featuredImage || 
           '';
  };

  if (!post) {
    return null;
  }

  const postId = post.id || post._id;
  const postTitle = post.title || 'Untitled Post';
  const postBody = post.body || post.content || '';
  const postSummary = post.summary || post.excerpt || '';
  const postImage = getImageUrl(post);
  const isSponsored = post.isSponsored || false;
  const publishedAt = post.publishedAt || post.createdAt || post.updatedAt;
  
  // Extract category name - simplified
  let postCategory = '';
  if (post.category) {
    if (typeof post.category === 'string') {
      postCategory = post.category;
    } else if (post.category.name) {
      postCategory = post.category.name;
    } else if (post.category.title) {
      postCategory = post.category.title;
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group h-full"
    >
      <Link to={`/post/${postId}`} className="block h-full">
        <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 h-full flex flex-col max-h-[450px]">
          <div className="relative overflow-hidden h-56 flex-shrink-0">
            {postImage ? (
              <img
                src={postImage}
                alt={postTitle}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = getRandomImage(postCategory);
                }}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <span className="text-gray-400 text-sm">No image</span>
              </div>
            )}
            
            {isSponsored && (
              <div className="absolute top-3 left-3 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                <TrendingUp className="h-3 w-3" />
                <span>Sponsored</span>
              </div>
            )}
            
            {postCategory && (
              <div className={`absolute top-3 right-3 ${getCategoryColor()} text-white px-3 py-1 rounded-full text-xs font-semibold`}>
                {postCategory}
              </div>
            )}
          </div>

          <div className="p-6 flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-hidden">
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors line-clamp-2">
                {postTitle}
              </h3>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-3 h-16 overflow-hidden">
                {postSummary || 
                 (postBody ? postBody.replace(/<[^>]*>/g, '').substring(0, 150) : '') || 
                 'No description available'}
                {!postSummary && postBody && postBody.replace(/<[^>]*>/g, '').length > 150 && '...'}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-auto flex-shrink-0">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>{getTimeAgo(publishedAt)}</span>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  className="hover:bg-orange-50 hover:text-orange-600 rounded-full"
                  disabled={!postId}
                  title="Share post"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBookmark}
                  disabled={bookmarkLoading || !postId}
                  className={`hover:bg-orange-50 rounded-full ${isBookmarked ? 'text-orange-600' : 'hover:text-orange-600'}`}
                  title={isBookmarked ? "Remove bookmark" : "Bookmark post"}
                >
                  <Bookmark className={`h-4 w-4 transition-all ${isBookmarked ? 'fill-current' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default PostCard;