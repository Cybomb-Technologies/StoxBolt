import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import PostCard from '@/components/PostCard';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const CategoryPage = () => {
  const { category } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryName, setCategoryName] = useState('');

  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    fetchPosts(1);
    fetchCategoryName();
  }, [category]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 500 &&
        !loading &&
        hasMore &&
        page < totalPages
      ) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchPosts(nextPage);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore, page, totalPages]);

  const fetchCategoryName = async () => {
    try {
      const response = await axios.get(`${baseURL}/api/categories`);
      if (response.data.success) {
        const categories = response.data.data;
        const cat = categories.find(c => 
          c.name.toLowerCase() === category.toLowerCase() || 
          c._id === category
        );
        if (cat) {
          setCategoryName(cat.name);
        } else {
          setCategoryName(category);
        }
      }
    } catch (error) {
      console.error('Error fetching category:', error);
      setCategoryName(category);
    }
  };

  const fetchPosts = async (pageNum) => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/api/posts?category=${category}&page=${pageNum}&limit=12&status=published`);
      
      if (response.data.success) {
        const newPosts = response.data.data;
        
        if (pageNum === 1) {
          setPosts(newPosts);
        } else {
          setPosts(prev => [...prev, ...newPosts]);
        }
        
        setTotalPages(response.data.totalPages || 1);
        setHasMore(pageNum < (response.data.totalPages || 1));
      }
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
              <PostCard key={post._id} post={post} index={index} />
            ))}
          </div>

          {loading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>
          )}

          {!loading && posts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 font-medium">No posts found in this category</p>
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