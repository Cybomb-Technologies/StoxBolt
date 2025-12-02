
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import PostCard from '@/components/PostCard';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const CategoryPage = () => {
  const { category } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const categoryNames = {
    indian: 'Indian',
    us: 'US',
    global: 'Global',
    commodities: 'Commodities',
    forex: 'Forex',
    crypto: 'Crypto',
    ipos: 'IPOs'
  };

  const stockImages = [
    'https://images.unsplash.com/photo-1611974765270-ca1258634369?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1526304640151-b5a95f9032d5?auto=format&fit=crop&q=80&w=800'
  ];

  const categoryName = categoryNames[category] || category;

  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    fetchPosts(1);
  }, [category]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 500 &&
        !loading &&
        hasMore
      ) {
        setPage((prev) => prev + 1);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore]);

  useEffect(() => {
    if (page > 1) {
      fetchPosts(page);
    }
  }, [page]);

  const fetchPosts = async (pageNum) => {
    setLoading(true);
    try {
      // API call: GET /api/posts?category=${category}&page=${pageNum}&limit=12
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      const mockPosts = Array.from({ length: 12 }, (_, i) => ({
        id: `${category}-${pageNum}-${i + 1}`,
        title: `${categoryName} Market Analysis: Major Developments ${pageNum}-${i + 1}`,
        shortTitle: `${categoryName} Update`,
        body: 'In-depth analysis of recent market movements and their implications for investors.',
        image: stockImages[(i + pageNum) % stockImages.length],
        category: categoryName,
        author: 'Market Analyst',
        publishedAt: new Date(Date.now() - i * 3600000).toISOString(),
        isSponsored: i % 6 === 0
      }));

      if (pageNum === 3) {
        setHasMore(false);
      }

      setPosts((prev) => [...prev, ...mockPosts]);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{categoryName} News - StoxBolt</title>
        <meta name="description" content={`Latest ${categoryName} financial news and market updates on StoxBolt. Stay informed with real-time analysis and insights.`} />
      </Helmet>

      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
              {categoryName} News
            </h1>
            <p className="text-gray-600">Stay updated with the latest {categoryName.toLowerCase()} market news and analysis</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, index) => (
              <PostCard key={post.id} post={post} index={index} />
            ))}
          </div>

          {loading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>
          )}

          {!hasMore && posts.length > 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 font-medium">You've reached the end!</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CategoryPage;
