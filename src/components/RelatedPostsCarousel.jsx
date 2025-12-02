
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const RelatedPostsCarousel = ({ category, currentPostId }) => {
  const [posts, setPosts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const stockImages = [
    'https://images.unsplash.com/photo-1611974765270-ca1258634369?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1526304640151-b5a95f9032d5?auto=format&fit=crop&q=80&w=800'
  ];

  useEffect(() => {
    fetchRelatedPosts();
  }, [category]);

  const fetchRelatedPosts = async () => {
    // API call: GET /api/posts?category=${category}&exclude=${currentPostId}&limit=6
    const mockPosts = Array.from({ length: 6 }, (_, i) => ({
      id: `related-${i + 1}`,
      title: `Related ${category} News Story ${i + 1}`,
      image: stockImages[i % stockImages.length],
      category
    }));
    setPosts(mockPosts);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, posts.length - 2));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.max(1, posts.length - 2)) % Math.max(1, posts.length - 2));
  };

  if (posts.length === 0) return null;

  return (
    <div className="mt-12 bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h2>
      
      <div className="relative">
        <div className="overflow-hidden">
          <motion.div
            className="flex gap-6"
            animate={{ x: `-${currentIndex * (100 / 3)}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/post/${post.id}`}
                className="min-w-[calc(33.333%-1rem)] group"
              >
                <div className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-all">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors">
                      {post.title}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </motion.div>
        </div>

        {posts.length > 3 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-all"
            >
              <ChevronLeft className="h-6 w-6 text-gray-700" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-all"
            >
              <ChevronRight className="h-6 w-6 text-gray-700" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default RelatedPostsCarousel;
