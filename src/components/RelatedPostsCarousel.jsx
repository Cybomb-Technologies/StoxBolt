import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  ExternalLink, 
  Calendar, 
  User,
  Clock,
  BookOpen,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { useToast } from '@/components/ui/use-toast';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Custom Skeleton component to avoid import errors
const Skeleton = ({ className, ...props }) => (
  <div 
    className={`animate-pulse bg-gray-200 rounded-md ${className || ''}`}
    {...props}
  />
);

const RelatedPostsCarousel = ({ category, currentPostId }) => {
  const [posts, setPosts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  const transformPostData = useCallback((post) => {
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

    // Format date
    const formatDate = (dateString) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
      } catch (error) {
        return 'Recent';
      }
    };

    return {
      id: post._id || post.id,
      _id: post._id || post.id,
      title: post.title || 'Untitled Post',
      body: typeof post.body === 'string' ? post.body : 
            post.body?.content || post.content || post.description || '',
      summary: post.summary || post.excerpt || 
              (typeof post.body === 'string' ? post.body.substring(0, 120) : ''),
      image: post.imageUrl || post.image || post.thumbnail || post.featuredImage || '',
      category: getCategoryName(post.category),
      categoryId: getCategoryId(post.category),
      createdAt: post.createdAt,
      formattedDate: formatDate(post.createdAt || post.publishDateTime),
      updatedAt: post.updatedAt,
      author: post.author ? 
        (typeof post.author === 'string' ? post.author : post.author.name || post.author.username) : 
        'Admin',
      readTime: post.readTime || Math.ceil(((post.body?.length || 0) / 1000) * 0.5) || 3
    };
  }, []);

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
      params.append('limit', '8');
      params.append('status', 'published');
      params.append('sort', '-createdAt');

      const response = await axios.get(`${baseURL}/api/public-posts?${params.toString()}`);
      
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

  const handlePostClick = (postId) => {
    navigate(`/post/${postId}`);
  };

  const nextSlide = () => {
    if (posts.length <= visibleCards) return;
    setCurrentIndex((prev) => 
      Math.min(prev + 1, posts.length - visibleCards)
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleDragStart = (e) => {
    setIsDragging(true);
    setDragStartX(e.clientX || e.touches[0].clientX);
  };

  const handleDragEnd = (e) => {
    if (!isDragging) return;
    
    setIsDragging(false);
    const dragEndX = e.clientX || e.changedTouches[0].clientX;
    const dragDistance = dragStartX - dragEndX;
    const threshold = 50;

    if (dragDistance > threshold) {
      nextSlide();
    } else if (dragDistance < -threshold) {
      prevSlide();
    }
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
  };

  // Responsive card count
  const [visibleCards, setVisibleCards] = useState(3);

  useEffect(() => {
    const updateVisibleCards = () => {
      if (window.innerWidth < 768) {
        setVisibleCards(1);
      } else if (window.innerWidth < 1024) {
        setVisibleCards(2);
      } else {
        setVisibleCards(3);
      }
    };

    updateVisibleCards();
    window.addEventListener('resize', updateVisibleCards);
    return () => window.removeEventListener('resize', updateVisibleCards);
  }, []);

  const LoadingSkeleton = () => (
    <div className="mt-12 bg-white rounded-2xl shadow-xl p-6 md:p-8">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="bg-gray-50 rounded-xl overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <div className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || posts.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 bg-white rounded-2xl shadow-xl p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Related Articles</h2>
          <p className="text-gray-600 mt-1 flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Discover more content you might like
          </p>
        </div>
        {posts.length > visibleCards && (
          <div className="hidden md:flex items-center space-x-2">
            <Button
              onClick={prevSlide}
              disabled={currentIndex === 0}
              variant="outline"
              size="icon"
              className="rounded-full w-10 h-10 hover:bg-gray-50 transition-all hover:scale-105 active:scale-95"
              aria-label="Previous articles"
            >
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </Button>
            <Button
              onClick={nextSlide}
              disabled={currentIndex >= posts.length - visibleCards}
              variant="outline"
              size="icon"
              className="rounded-full w-10 h-10 hover:bg-gray-50 transition-all hover:scale-105 active:scale-95"
              aria-label="Next articles"
            >
              <ChevronRight className="h-5 w-5 text-gray-700" />
            </Button>
          </div>
        )}
      </div>
      
      <div className="relative">
        <div 
          className="overflow-hidden select-none"
          onMouseDown={handleDragStart}
          onMouseUp={handleDragEnd}
          onMouseMove={handleDragMove}
          onMouseLeave={() => setIsDragging(false)}
          onTouchStart={handleDragStart}
          onTouchEnd={handleDragEnd}
          onTouchMove={handleDragMove}
        >
          <motion.div
            className="flex gap-4 md:gap-6"
            animate={{ x: `-${currentIndex * (100 / visibleCards)}%` }}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 30,
              duration: 0.3 
            }}
            style={{ width: `${(posts.length * 100) / visibleCards}%` }}
          >
            {posts.map((post) => (
              <div
                key={post.id}
                className={`min-w-[calc(${100 / visibleCards}%-${visibleCards === 1 ? '0rem' : '1rem'})] group cursor-pointer`}
                onClick={() => !isDragging && handlePostClick(post.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !isDragging) {
                    e.preventDefault();
                    handlePostClick(post.id);
                  }
                }}
                aria-label={`Read article: ${post.title}`}
              >
                <div className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 h-full border border-gray-100 hover:border-orange-300 hover:translate-y-[-4px]">
                  <div className="relative h-48 md:h-52 overflow-hidden">
                    {post.image ? (
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const parent = e.target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-full h-full bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
                                <div class="text-orange-600 text-center p-4">
                                  <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15"></path>
                                  </svg>
                                  <span class="text-sm font-medium">No Image Available</span>
                                </div>
                              </div>
                            `;
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
                        <div className="text-orange-600 text-center p-4">
                          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15"></path>
                          </svg>
                          <span className="text-sm font-medium">No Image Available</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-orange-700 px-3 py-1 rounded-full text-xs font-semibold shadow-sm flex items-center">
                      {post.category}
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent p-4 pt-8">
                      <div className="flex items-center justify-between text-white">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span className="text-white/90">{post.formattedDate}</span>
                          </div>
                          <div className="flex items-center text-xs">
                            <User className="h-3 w-3 mr-1" />
                            <span className="text-white/90">{post.author}</span>
                          </div>
                        </div>
                        <div className="flex items-center text-xs bg-white/20 backdrop-blur-sm px-2 py-1 rounded">
                          <Clock className="h-3 w-3 mr-1" />
                          {post.readTime} min
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors mb-3 text-lg">
                      {post.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-3 mb-4 leading-relaxed">
                      {post.summary}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center text-sm text-orange-600 font-medium group-hover:text-orange-700 transition-colors">
                        Read Full Article
                        <ExternalLink className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </span>
                      <div className="flex items-center text-gray-500 text-xs">
                        <BookOpen className="h-3 w-3 mr-1" />
                        Featured
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Mobile navigation buttons */}
        {posts.length > visibleCards && (
          <div className="md:hidden flex items-center justify-center mt-6 space-x-4">
            <Button
              onClick={prevSlide}
              disabled={currentIndex === 0}
              variant="outline"
              size="icon"
              className="rounded-full w-10 h-10"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex space-x-2">
              {Array.from({ length: Math.min(3, Math.ceil(posts.length / visibleCards)) }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx * visibleCards)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    Math.floor(currentIndex / visibleCards) === idx 
                      ? 'bg-orange-500 w-8' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to page ${idx + 1}`}
                />
              ))}
            </div>
            <Button
              onClick={nextSlide}
              disabled={currentIndex >= posts.length - visibleCards}
              variant="outline"
              size="icon"
              className="rounded-full w-10 h-10"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Desktop pagination dots */}
        {posts.length > visibleCards && (
          <div className="hidden md:flex justify-center mt-8 space-x-2">
            {Array.from({ length: Math.ceil(posts.length / visibleCards) }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx * visibleCards)}
                className={`w-8 h-1.5 rounded-full transition-all ${
                  Math.floor(currentIndex / visibleCards) === idx 
                    ? 'bg-orange-500' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to page ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {posts.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-gray-600 text-sm">
            Showing {Math.min(posts.length, (currentIndex + visibleCards))} of {posts.length} related articles
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Click on any article to read more
          </p>
        </div>
      )}
    </div>
  );
};

export default RelatedPostsCarousel;