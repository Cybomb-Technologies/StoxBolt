import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Share2, Bookmark, Clock, User, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import RelatedPostsCarousel from '@/components/RelatedPostsCarousel';
import IndexSnapshot from '@/components/IndexSnapshot';
import SocialImageExport from '@/components/SocialImageExport';
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PostDetailPage = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showSocialExport, setShowSocialExport] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPost();
  }, [id]);

  const getCategoryName = (category) => {
    if (!category) return 'General';
    
    if (typeof category === 'string') return category;
    
    if (typeof category === 'object') {
      return category.name || category.title || category._id || 'General';
    }
    
    return 'General';
  };

  const getCategoryId = (category) => {
    if (!category) return null;
    
    if (typeof category === 'string') return category;
    
    if (typeof category === 'object') {
      return category._id || category.id || null;
    }
    
    return null;
  };

  const getSafePostData = (postData) => {
    if (!postData) return null;
    
    return {
      ...postData,
      body: typeof postData.body === 'string' ? postData.body : 
            postData.body?.content || postData.content || postData.description || '',
      categoryName: getCategoryName(postData.category),
      categoryId: getCategoryId(postData.category),
      imageUrl: postData.imageUrl || postData.image || postData.thumbnail || '',
      author: typeof postData.author === 'string' ? postData.author : 
              postData.author?.name || postData.author?.username || 'Admin',
      tags: Array.isArray(postData.tags) ? postData.tags : 
            (typeof postData.tags === 'string' ? postData.tags.split(',') : [])
    };
  };

  const fetchPost = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/api/posts/${id}`);
      
      if (response.data.success) {
        const safePostData = getSafePostData(response.data.data);
        setPost(safePostData);
      } else {
        throw new Error(response.data.message || 'Post not found');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load post',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (!post) return;
    
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.metaDescription || post.body?.substring(0, 100),
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link Copied!',
        description: 'Post link copied to clipboard'
      });
    }
  };

  const handleBookmark = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await axios.post(
          `${baseURL}/api/posts/${id}/bookmark`, 
          {}, 
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data.success) {
          setIsBookmarked(!isBookmarked);
          toast({
            title: isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks',
            description: isBookmarked ? 'Post removed from your saved items' : 'Post saved successfully'
          });
        }
      } else {
        toast({
          title: 'Login Required',
          description: 'Please login to bookmark posts',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error bookmarking post:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to bookmark post',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">Post not found</p>
          <Link to="/" className="inline-flex items-center text-orange-600 hover:text-orange-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{post.metaTitle || post.title} - StoxBolt</title>
        <meta name="description" content={post.metaDescription || post.body?.substring(0, 160)} />
        <meta property="og:title" content={post.metaTitle || post.title} />
        <meta property="og:description" content={post.metaDescription || post.body?.substring(0, 160)} />
        <meta property="og:image" content={post.imageUrl} />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={post.publishDateTime || post.createdAt} />
        <meta property="article:author" content={post.author} />
      </Helmet>

      <article className="min-h-screen py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to="/" className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            {post.imageUrl ? (
              <div className="relative h-96 overflow-hidden">
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            ) : null}

            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                <span className="px-4 py-2 bg-orange-600 text-white text-sm font-semibold rounded-full inline-block w-fit">
                  {post.categoryName}
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleShare}
                    className="hover:bg-orange-50 hover:text-orange-600"
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBookmark}
                    className={`hover:bg-orange-50 ${isBookmarked ? 'text-orange-600' : 'hover:text-orange-600'}`}
                  >
                    <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
                  </Button>
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 md:gap-6 text-gray-600 mb-6 pb-6 border-b">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">{post.author}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">
                    {post.publishDateTime || post.createdAt ? 
                      new Date(post.publishDateTime || post.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : 
                      'Recently'}
                  </span>
                </div>
              </div>

              <div className="prose prose-lg max-w-none">
                {post.body ? (
                  post.body.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                      {paragraph}
                    </p>
                  ))
                ) : (
                  <p className="text-gray-600 italic">No content available.</p>
                )}
              </div>

              {post.tags && post.tags.length > 0 && (
                <div className="mt-8 pt-6 border-t">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">Tags:</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors"
                      >
                        #{typeof tag === 'string' ? tag : JSON.stringify(tag)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <div className="mt-8">
            <IndexSnapshot />
          </div>

          {post.categoryId && (
            <div className="mt-8">
              <RelatedPostsCarousel 
                category={post.categoryId} 
                currentPostId={post._id || post.id} 
              />
            </div>
          )}
        </div>
      </article>

      {showSocialExport && post && (
        <SocialImageExport
          post={post}
          onClose={() => setShowSocialExport(false)}
        />
      )}
    </>
  );
};

export default PostDetailPage;