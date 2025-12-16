import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Clock,
  User,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { useToast } from '@/components/ui/use-toast';
import { getRandomImage } from '@/utils/imageUtils';
import { cn } from '@/lib/utils';

const baseURL = import.meta.env.VITE_API_URL || 'https://api.stoxbolt.com';

// Custom Skeleton component
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
  const [visibleCards, setVisibleCards] = useState(3);
  const { toast } = useToast();
  const navigate = useNavigate();

  const transformPostData = useCallback((post) => {
    const getCategoryName = (categoryData) => {
      if (!categoryData) return 'General';
      if (typeof categoryData === 'string') return categoryData;
      if (typeof categoryData === 'object') {
        return categoryData.name || categoryData.title || categoryData._id || 'General';
      }
      return 'General';
    };

    const formatDate = (dateString) => {
      if (!dateString) return 'Recent';
      try {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: diffDays > 365 ? 'numeric' : undefined
        });
      } catch (error) {
        return 'Recent';
      }
    };

    const categoryName = getCategoryName(post.category);
    const bodyText = typeof post.body === 'string' ? post.body :
      post.body?.content || post.content || post.description || '';

    return {
      id: post._id || post.id,
      title: post.title || 'Untitled Post',
      summary: post.summary || post.excerpt ||
        bodyText.substring(0, 120) + (bodyText.length > 120 ? '...' : ''),
      image: post.imageUrl || post.image || post.thumbnail ||
        post.featuredImage || getRandomImage(categoryName),
      category: categoryName,
      formattedDate: formatDate(post.createdAt || post.publishDateTime),
      author: post.author ?
        (typeof post.author === 'string' ? post.author :
          post.author.name || post.author.username || 'Admin') :
        'Admin',
      readTime: post.readTime || Math.max(1, Math.ceil(bodyText.length / 1500)) || 3
    };
  }, []);

  // Fetch related posts
  useEffect(() => {
    const fetchRelatedPosts = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();

        if (category) {
          params.append('category', typeof category === 'object' ? category._id : category);
        }

        if (currentPostId) params.append('exclude', currentPostId);
        params.append('limit', '6'); // Get up to 6 posts
        params.append('status', 'published');
        params.append('sort', '-createdAt');

        const response = await axios.get(`${baseURL}/api/public-posts?${params.toString()}`);

        if (response.data.success) {
          const postsData = response.data.data || [];
          const transformedPosts = postsData.slice(0, 6).map(transformPostData); // Limit to 6
          setPosts(transformedPosts);
        } else {
          setError('No related posts available');
        }
      } catch (error) {
        console.error('Error fetching related posts:', error);
        setError('Unable to load related articles');
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedPosts();
  }, [category, currentPostId, transformPostData]);

  // Handle responsive card count
  useEffect(() => {
    const updateVisibleCards = () => {
      if (window.innerWidth < 640) {
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

  // Navigation handlers
  const nextSlide = () => {
    if (posts.length <= visibleCards) return;
    const maxIndex = Math.ceil(posts.length / visibleCards) - 1;
    const nextIndex = Math.floor(currentIndex / visibleCards) + 1;

    if (nextIndex <= maxIndex) {
      setCurrentIndex(nextIndex * visibleCards);
    } else {
      setCurrentIndex(0); // Loop back to start
    }
  };

  const prevSlide = () => {
    if (posts.length <= visibleCards) return;
    const maxIndex = Math.ceil(posts.length / visibleCards) - 1;
    const prevIndex = Math.floor(currentIndex / visibleCards) - 1;

    if (prevIndex >= 0) {
      setCurrentIndex(prevIndex * visibleCards);
    } else {
      setCurrentIndex(maxIndex * visibleCards); // Loop to end
    }
  };

  // Drag handlers for touch/mouse
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

  const handlePostClick = (postId) => {
    if (isDragging) return; // Prevent click during drag
    navigate(`/post/${postId}`);
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="mt-12 bg-white rounded-2xl shadow-lg p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="w-10 h-10 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
            <Skeleton className="h-48 w-full" />
            <div className="p-5">
              <Skeleton className="h-6 w-32 mb-3 rounded-full" />
              <Skeleton className="h-7 w-full mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-4" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Post card component
  const PostCard = ({ post }) => (
    <motion.div
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className="h-full bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-orange-200 hover:shadow-lg transition-all duration-300 cursor-pointer group"
      onClick={() => handlePostClick(post.id)}
    >
      {/* Image container */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <motion.img
          src={post.image}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <span className="inline-block px-3 py-1 bg-orange-500 text-white text-xs font-medium rounded-full">
            {post.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-gray-900 text-lg mb-3 line-clamp-2 group-hover:text-orange-600 transition-colors">
          {post.title}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {post.summary}
        </p>

        {/* Meta info */}
        <div className="flex items-center justify-between text-gray-500 text-xs pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{post.readTime} min read</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{post.formattedDate}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // If no posts, don't show anything
  if (!loading && posts.length === 0) {
    return null;
  }

  if (loading) {
    return <LoadingSkeleton />;
  }

  // Calculate visible posts based on current index and visible cards
  const visiblePosts = posts.slice(currentIndex, currentIndex + visibleCards);
  const totalPages = Math.ceil(posts.length / visibleCards);
  const currentPage = Math.floor(currentIndex / visibleCards);

  return (
    <div className="mt-12 bg-white rounded-2xl shadow-lg p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Related Articles
          </h2>
          <p className="text-gray-600 mt-2 flex items-center">
            <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
            Discover more content you might like
          </p>
        </div>

        {/* Navigation buttons */}
        {posts.length > visibleCards && (
          <div className="flex items-center gap-2">
            <Button
              onClick={prevSlide}
              variant="outline"
              size="icon"
              className="rounded-full w-10 h-10 hover:bg-gray-50 border-gray-300 hover:border-orange-300 transition-all"
              aria-label="Previous articles"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 px-3">
              <span className="text-sm font-medium text-gray-700">
                {currentPage + 1}
              </span>
              <span className="text-gray-400">/</span>
              <span className="text-sm text-gray-500">{totalPages}</span>
            </div>
            <Button
              onClick={nextSlide}
              variant="outline"
              size="icon"
              className="rounded-full w-10 h-10 hover:bg-gray-50 border-gray-300 hover:border-orange-300 transition-all"
              aria-label="Next articles"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Carousel */}
      <div className="relative">
        <div
          className="overflow-hidden select-none"
          onMouseDown={handleDragStart}
          onMouseUp={handleDragEnd}
          onMouseLeave={() => setIsDragging(false)}
          onTouchStart={handleDragStart}
          onTouchEnd={handleDragEnd}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "grid gap-6",
                visibleCards === 1 && "grid-cols-1",
                visibleCards === 2 && "grid-cols-1 sm:grid-cols-2",
                visibleCards === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              )}
            >
              {visiblePosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile indicators */}
        {posts.length > visibleCards && (
          <div className="flex justify-center mt-8 gap-2">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx * visibleCards)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  currentPage === idx
                    ? "bg-orange-500 w-8"
                    : "bg-gray-300 w-2 hover:bg-gray-400 hover:w-4"
                )}
                aria-label={`Go to page ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm">
          <p className="text-gray-600">
            Showing <span className="font-semibold">{Math.min(visiblePosts.length, posts.length)}</span> of{' '}
            <span className="font-semibold">{posts.length}</span> related articles
          </p>
        </div>
      </div>
    </div>
  );
};

export default RelatedPostsCarousel;