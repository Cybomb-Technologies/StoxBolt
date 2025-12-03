import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, User, Tag, Eye, Globe, ImageOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PostPreview = () => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const previewData = localStorage.getItem('postPreview');
    
    if (previewData) {
      try {
        const parsedData = JSON.parse(previewData);
        setPost(parsedData);
      } catch (error) {
        console.error('Error parsing preview data:', error);
      }
    } else {
      console.warn('No preview data found');
    }
    
    setLoading(false);
    
    // Clean up on unmount
    return () => {
      localStorage.removeItem('postPreview');
    };
  }, []);

  // Function to get safe image URL
  const getImageUrl = (url) => {
    if (!url) return null;
    
    // If it's a base64 image (from preview), use it directly
    if (url.startsWith('data:image')) {
      return url;
    }
    
    // If it's a relative path or uploaded path
    if (url.startsWith('/') || url.startsWith('uploads/')) {
      // For preview, we can't always access backend files
      // Return a placeholder or the URL as-is
      return url.startsWith('/') ? url : `/${url}`;
    }
    
    // If it's already a full URL
    return url;
  };

  // Handle image loading error
  const handleImageError = () => {
    setImageError(true);
  };

  // Function to go back to post list
  const goBackToList = () => {
    navigate('/admin/posts/list');
  };

  // Function to continue editing
  const continueEditing = () => {
    if (post._id === 'preview' || !post._id) {
      navigate('/admin/posts/new');
    } else {
      navigate(`/admin/posts/edit/${post._id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">No Preview Available</h1>
        <p className="text-gray-600 mb-6">Please go back and create or edit a post to see the preview.</p>
        <Button onClick={() => navigate('/admin/posts/list')} className="bg-orange-600 hover:bg-orange-700">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Posts
        </Button>
      </div>
    );
  }

  const imageUrl = getImageUrl(post.imageUrl);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50"
    >
      {/* Preview Banner */}
      <div className="bg-orange-600 text-white p-4 text-center">
        <div className="container mx-auto">
          <p className="font-semibold">📝 POST PREVIEW - This is how your post will look to readers</p>
          <p className="text-sm opacity-90 mt-1">Changes are not saved until you click "Save" in the editor</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="outline"
          onClick={goBackToList}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Posts List
        </Button>

        {/* Post Content */}
        <article className="bg-white rounded-2xl shadow-xl p-8">
          {/* Category Badge */}
          <div className="mb-4">
            <span className="inline-block px-4 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
              {post.category}
            </span>
            {post.isSponsored && (
              <span className="inline-block ml-2 px-4 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                💎 Sponsored
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
          
          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-8 pb-6 border-b">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              <span className="font-medium">{post.author}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{new Date(post.publishDateTime || post.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
            {post.region && (
              <div className="flex items-center">
                <Globe className="h-4 w-4 mr-2" />
                <span>{post.region}</span>
              </div>
            )}
            <div className="flex items-center">
              <Eye className="h-4 w-4 mr-2" />
              <span>Preview Mode</span>
            </div>
          </div>

          {/* Featured Image */}
          {imageUrl && (
            <div className="mb-8">
              <div className="relative">
                <img
                  src={imageUrl}
                  alt={post.title}
                  className="w-full h-auto max-h-[500px] object-cover rounded-xl shadow-lg"
                  onError={handleImageError}
                  crossOrigin="anonymous"
                />
                {imageError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 rounded-xl">
                    <ImageOff className="h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-gray-500 text-sm">Image failed to load in preview</p>
                  </div>
                )}
              </div>
              
              {/* Image info messages */}
              {post.imageUrl && post.imageUrl.startsWith('data:') && (
                <p className="text-sm text-gray-500 text-center mt-2">
                  📷 Image is stored temporarily - it will be uploaded when you save
                </p>
              )}
              {post.imageUrl && post.imageUrl.includes('localhost:5000') && (
                <p className="text-sm text-yellow-600 text-center mt-2">
                  ⚠️ Note: In preview mode, images from backend may not load due to security restrictions
                </p>
              )}
            </div>
          )}

          {/* Body Content */}
          <div className="prose prose-lg max-w-none mb-8">
            {post.body.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                {paragraph || <br />}
              </p>
            ))}
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-8 pt-6 border-t">
              <div className="flex items-center mb-3">
                <Tag className="h-4 w-4 mr-2 text-gray-500" />
                <h3 className="font-semibold text-gray-700">Tags:</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* SEO Preview Section */}
          <div className="mt-8 p-6 bg-gray-50 rounded-xl">
            <h3 className="font-bold text-gray-900 mb-4">SEO Preview</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Title Tag:</p>
                <p className="text-blue-600 font-medium truncate">
                  {post.metaTitle || post.title} | Your Site Name
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Meta Description:</p>
                <p className="text-gray-700 line-clamp-2">
                  {post.metaDescription || post.body.substring(0, 150) + '...'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">URL Slug:</p>
                <p className="text-green-600 truncate">
                  yoursite.com/post/{post._id === 'preview' ? 'sample-url-slug' : post._id}
                </p>
              </div>
            </div>
          </div>

          {/* Status Info */}
          <div className="mt-8 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`h-3 w-3 rounded-full ${
                  post.status === 'published' ? 'bg-green-500' :
                  post.status === 'scheduled' ? 'bg-yellow-500' :
                  post.status === 'draft' ? 'bg-gray-500' :
                  'bg-red-500'
                }`}></div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-800">
                  Current Status: <span className="font-bold">{post.status?.toUpperCase() || 'DRAFT'}</span>
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  {post.status === 'draft' && 'This post is in draft mode and not visible to the public.'}
                  {post.status === 'scheduled' && `This post is scheduled to publish on ${new Date(post.publishDateTime).toLocaleString()}.`}
                  {post.status === 'published' && 'This post is live and visible to the public.'}
                  {post.status === 'archived' && 'This post is archived and not visible to the public.'}
                </p>
              </div>
            </div>
          </div>
        </article>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <Button
            variant="outline"
            onClick={goBackToList}
          >
            Back to Posts List
          </Button>
          <Button
            className="bg-orange-600 hover:bg-orange-700"
            onClick={continueEditing}
          >
            {post._id === 'preview' ? 'Continue Editing' : 'Edit This Post'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default PostPreview;