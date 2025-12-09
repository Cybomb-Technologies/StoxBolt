import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import PostCard from '@/components/PostCard';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Same transform function as HomePage for consistency
const transformPostData = (post) => {
  const getImageUrl = (postData) => {
    if (!postData) return '';
    
    return postData.imageUrl || 
           postData.featuredImage || 
           postData.image || 
           postData.thumbnail || 
           postData.bannerImage || 
           '';
  };

  const getCategoryName = (categoryData) => {
    if (!categoryData) return '';
    
    if (typeof categoryData === 'string') return categoryData;
    
    if (typeof categoryData === 'object') {
      return categoryData.name || 
             categoryData.title || 
             categoryData._id || 
             '';
    }
    
    return '';
  };

  const getAuthorName = (authorData) => {
    if (!authorData) return 'Admin';
    
    if (typeof authorData === 'string') return authorData;
    
    if (typeof authorData === 'object') {
      return authorData.name || 
             authorData.username || 
             authorData.email || 
             'Admin';
    }
    
    return 'Admin';
  };

  const getBodyContent = (bodyData) => {
    if (!bodyData) return '';
    
    if (typeof bodyData === 'string') return bodyData;
    
    if (typeof bodyData === 'object') {
      return bodyData.content || 
             bodyData.text || 
             bodyData.description || 
             '';
    }
    
    return '';
  };

  return {
    id: post._id || post.id,
    _id: post._id || post.id,
    title: post.title || 'Untitled Post',
    body: getBodyContent(post.body),
    summary: post.summary || 
             post.excerpt || 
             (getBodyContent(post.body) ? getBodyContent(post.body).substring(0, 150) + '...' : ''),
    image: getImageUrl(post),
    category: getCategoryName(post.category),
    isSponsored: post.isSponsored || post.sponsored || false,
    publishedAt: post.publishDateTime || post.publishedAt || post.createdAt || post.updatedAt,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    status: post.status || 'published',
    author: getAuthorName(post.author),
    tags: Array.isArray(post.tags) ? post.tags : 
          (typeof post.tags === 'string' ? post.tags.split(',') : [])
  };
};

const CategoryPage = () => {
  const { category } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryInfo, setCategoryInfo] = useState(null);

  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    fetchCategoryInfo();
  }, [category]);

  useEffect(() => {
    if (categoryInfo) {
      fetchPosts(1);
    }
  }, [categoryInfo]);

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

  const fetchCategoryInfo = async () => {
    try {
      const response = await axios.get(`${baseURL}/api/categories`);
      if (response.data.success) {
        const categories = response.data.data;
        
        // Try to find category by ID first, then by slug
        let cat = categories.find(c => c._id === category);
        
        if (!cat) {
          // Try to find by slug
          cat = categories.find(c => {
            const catSlug = c.slug || c.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            return catSlug === category;
          });
        }
        
        if (cat) {
          setCategoryInfo(cat);
        } else {
          // If category not found, set default info
          setCategoryInfo({
            name: category,
            _id: category
          });
        }
      }
    } catch (error) {
      console.error('Error fetching category:', error);
      setCategoryInfo({
        name: category,
        _id: category
      });
    }
  };

  const fetchPosts = async (pageNum) => {
    setLoading(true);
    try {
      // IMPORTANT: Use category ID for filtering, not name/slug
      const categoryId = categoryInfo?._id || category;
      
      let response;
      
      // Try multiple API endpoint formats
      try {
        // Format 1: Filter by category ID
        response = await axios.get(`${baseURL}/api/public-posts`, {
          params: {
            page: pageNum,
            limit: 12,
            status: 'published',
            category: categoryId,
            sort: '-createdAt'
          }
        });
      } catch (error) {
        console.log('First API call failed, trying alternative...');
        
        // Format 2: Alternative endpoint
        response = await axios.get(`${baseURL}/api/posts/category/${categoryId}`, {
          params: {
            page: pageNum,
            limit: 12,
            status: 'published'
          }
        });
      }
      
      if (response.data.success) {
        let newPosts = [];
        
        // Handle different response structures
        if (Array.isArray(response.data.data)) {
          newPosts = response.data.data.map(transformPostData);
        } else if (response.data.posts) {
          newPosts = response.data.posts.map(transformPostData);
        } else if (response.data.results) {
          newPosts = response.data.results.map(transformPostData);
        }
        
        if (pageNum === 1) {
          setPosts(newPosts);
        } else {
          setPosts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));
            return [...prev, ...uniqueNewPosts];
          });
        }
        
        setTotalPages(response.data.totalPages || 
                     response.data.pages || 
                     Math.ceil((response.data.total || 0) / 12) || 
                     1);
        setHasMore(pageNum < (response.data.totalPages || 
                   response.data.pages || 
                   Math.ceil((response.data.total || 0) / 12) || 
                   1));
      } else {
        console.error('API returned failure:', response.data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      
      // Fallback: Try to fetch all posts and filter client-side
      if (pageNum === 1) {
        try {
          const allPostsResponse = await axios.get(`${baseURL}/api/public-posts`, {
            params: {
              status: 'published',
              sort: '-createdAt'
            }
          });
          
          if (allPostsResponse.data.success && Array.isArray(allPostsResponse.data.data)) {
            const allPosts = allPostsResponse.data.data.map(transformPostData);
            
            // Filter by category name or ID
            const filteredPosts = allPosts.filter(post => {
              const postCategory = post.category;
              if (typeof postCategory === 'string') {
                return postCategory === categoryInfo?.name || 
                       postCategory === categoryInfo?._id;
              } else if (postCategory && typeof postCategory === 'object') {
                return postCategory._id === categoryInfo?._id || 
                       postCategory.name === categoryInfo?.name;
              }
              return false;
            });
            
            setPosts(filteredPosts.slice(0, 12));
            setHasMore(false);
          }
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{categoryInfo?.name || category} News - StoxBolt</title>
        <meta name="description" content={`Latest ${categoryInfo?.name || category} financial news and market updates on StoxBolt. Stay informed with real-time analysis and insights.`} />
      </Helmet>

      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
              {categoryInfo?.name || category} News
            </h1>
            <p className="text-gray-600">
              Stay updated with the latest {(categoryInfo?.name || category).toLowerCase()} market news and analysis
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, index) => (
              <PostCard key={post.id || post._id} post={post} index={index} />
            ))}
          </div>

          {loading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
              <span className="ml-2 text-gray-600">Loading posts...</span>
            </div>
          )}

          {!loading && posts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 font-medium">No posts found in this category</p>
              <button 
                onClick={() => fetchPosts(1)}
                className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Try Again
              </button>
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