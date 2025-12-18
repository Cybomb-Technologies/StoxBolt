import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, User, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { getRandomImage } from '@/utils/imageUtils';

const baseURL = import.meta.env.VITE_API_URL || 'https://api.stoxbolt.com';

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedPosts();
  }, []);

  useEffect(() => {
    if (slides.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 5000);

      return () => clearInterval(timer);
    }
  }, [slides.length]);

  const fetchFeaturedPosts = async () => {
    try {
      const response = await axios.get(`${baseURL}/api/public-posts?limit=5&status=published&sort=-createdAt`);
      if (response.data.success) {
        const posts = response.data.data.map(post => {
          const categoryName = post.category?.name || post.category || 'Featured';
          return {
            id: post._id,
            title: post.title,
            image: post.imageUrl || post.image || post.thumbnail || post.featuredImage || getRandomImage(categoryName),
            category: categoryName,
            author: typeof post.author === 'string' ? post.author : post.author?.name || post.author?.username || 'Admin',
            publishedAt: post.publishDateTime || post.createdAt,
            body: post.body
          };
        });
        setSlides(posts);
      }
    } catch (error) {
      console.error('Error fetching featured posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  if (loading) {
    return (
      <div className="relative h-[400px] md:h-[500px] lg:h-[650px] bg-gradient-to-r from-blue-50 to-orange-50 animate-pulse">
        <div className="container mx-auto h-full flex items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-48 bg-gray-300 rounded mb-4 mx-auto"></div>
            <div className="h-4 w-64 bg-gray-200 rounded mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (slides.length === 0) {
    return null;
  }

  return (
    <div className="relative h-[400px] md:h-[500px] lg:h-[650px] bg-gray-900 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <div className="relative w-full h-full">
            {slides[currentSlide].image ? (
              <img
                src={slides[currentSlide].image}
                alt={slides[currentSlide].title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null; // Prevent infinite loop
                  e.target.src = getRandomImage(slides[currentSlide].category);
                }}
              />
            ) : null}
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-14">
            <div className="container mx-auto">
              <span className="inline-block px-3 py-1 bg-orange-600 text-white text-xs md:text-sm font-semibold rounded-full mb-3 md:mb-4">
                {slides[currentSlide].category}
              </span>
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-3 md:mb-4 max-w-3xl leading-tight">
                {slides[currentSlide].title}
              </h2>

              <div className="flex items-center space-x-4 text-white text-xs md:text-sm mb-4">
                <div className="flex items-center space-x-1">
                  <User className="h-3 w-3 md:h-4 md:w-4" />
                  <span>{slides[currentSlide].author}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3 md:h-4 md:w-4" />
                  <span>
                    {new Date(slides[currentSlide].publishedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              <p className="text-white/90 mb-6 max-w-2xl line-clamp-2 md:line-clamp-3 text-sm md:text-base hidden sm:block">
                {slides[currentSlide].body?.substring(0, 150)}...
              </p>

              <Link to={`/post/${slides[currentSlide].id}`}>
                <Button className="bg-white text-gray-900 hover:bg-gray-100 text-sm md:text-base px-4 py-2 md:px-6 md:py-3 h-auto">
                  Read More
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <button
        onClick={prevSlide}
        className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 md:p-3 rounded-full transition-all"
      >
        <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 md:p-3 rounded-full transition-all"
      >
        <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
      </button>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all ${index === currentSlide ? 'bg-white w-6 md:w-8' : 'bg-white/50'
              }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;