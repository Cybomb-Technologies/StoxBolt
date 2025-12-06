import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { useToast } from '@/components/ui/use-toast';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const RelatedPostsCarousel = ({ category, currentPostId }) => {
  const [posts, setPosts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const transformPostData = (post) => {
    const getCategoryName = (categoryData) => {
      if (!categoryData) return '';
      if (typeof categoryData === 'string') return categoryData;
      if (typeof categoryData === 'object') {
        return categoryData.name || categoryData.title || categoryData._id || '';
      }
      return '';
    };

    const getCategoryId = (categoryData) => {
      if (!categoryData) return '';
      if (typeof categoryData === 'string') return categoryData;
      if (typeof categoryData === 'object') {
        return categoryData._id || categoryData.id || '';
      }
      return '';
    };

    return {
    id: post._id || post.id,
    _id: post._id || post.id,
    title: post.title || 'Untitled Post',
    body: typeof post.body === 'string' ? post.body : 
          post.body?.content || post.content || post.description || '',
    summary: post.summary || post.excerpt || 
             (typeof post.body === 'string' ? post.body.substring(0, 100) : ''),
    // Update this line to check all image properties:
    image: post.imageUrl || post.image || post.thumbnail || post.featuredImage || '',
    category: getCategoryName(post.category),
    categoryId: getCategoryId(post.category),
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: post.author ? 
      (typeof post.author === 'string' ? post.author : post.author.name || post.author.username) : 
      'Admin'
  };
};

  useEffect(() => {
    fetchRelatedPosts();
  }, [category, currentPostId]);

  const fetchRelatedPosts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      
      if (category) {
        params.append('category', category);
      }
      
      if (currentPostId) params.append('exclude', currentPostId);
      params.append('limit', '6');
      params.append('status', 'published');
      params.append('sort', '-createdAt');

      const response = await axios.get(`${baseURL}/api/posts?${params.toString()}`);
      
      if (response.data.success) {
        const postsData = response.data.data || [];
        const transformedPosts = postsData.map(transformPostData);
        setPosts(transformedPosts);
      } else {
        setError('Failed to fetch related posts');
        toast({
          title: 'Error',
          description: response.data.message || 'Failed to load related articles',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching related posts:', error);
      setError('Failed to fetch related posts');
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load related articles',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    if (posts.length <= 3) return;
    setCurrentIndex((prev) => 
      Math.min(prev + 1, posts.length - 3)
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  if (loading) {
    return (
      <div className="mt-12 bg-white rounded-2xl shadow-xl p-8 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <span className="ml-2 text-gray-600">Loading related articles...</span>
      </div>
    );
  }

  if (error || posts.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h2>
      
      <div className="relative">
        <div className="overflow-hidden">
          <motion.div
            className="flex gap-6"
            animate={{ x: `-${currentIndex * (100 / 3)}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ width: `${(posts.length * 100) / 3}%` }}
          >
            {posts.map((post, index) => {
              const postId = post.id || post._id;
              
              return (
                <Link
                  key={postId}
                  to={`/post/${postId}`}
                  className="min-w-[calc(33.333%-1rem)] group"
                >
                  <div className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-all h-full">
                    <div className="relative h-48 overflow-hidden">
                      {post.image ? (
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : null}
                      {post.category && (
                        <div className="absolute top-3 right-3 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          {post.category}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors mb-2">
                        {post.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {post.summary || post.body?.substring(0, 100) || ''}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </motion.div>
        </div>

        {posts.length > 3 && (
          <>
            <Button
              onClick={prevSlide}
              disabled={currentIndex === 0}
              variant="outline"
              size="icon"
              className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-all z-10"
            >
              <ChevronLeft className="h-6 w-6 text-gray-700" />
            </Button>
            <Button
              onClick={nextSlide}
              disabled={currentIndex >= posts.length - 3}
              variant="outline"
              size="icon"
              className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-all z-10"
            >
              <ChevronRight className="h-6 w-6 text-gray-700" />
            </Button>
          </>
        )}
      </div>

      {posts.length > 3 && (
        <div className="flex justify-center mt-6 space-x-2">
          {Array.from({ length: Math.min(3, posts.length - 2) }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full ${
                currentIndex === idx ? 'bg-orange-500' : 'bg-gray-300'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RelatedPostsCarousel;