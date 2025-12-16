import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import PostCard from '@/components/PostCard';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useToast } from '@/components/ui/use-toast';

const baseURL = import.meta.env.VITE_API_URL || 'https://api.stoxbolt.com';

import { getRandomImage } from '@/utils/imageUtils';

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
      return categoryData.name || categoryData.title || categoryData._id || '';
    }
    return '';
  };

  const getAuthorName = (authorData) => {
    if (!authorData) return 'Admin';
    if (typeof authorData === 'string') return authorData;
    if (typeof authorData === 'object') {
      return authorData.name || authorData.username || authorData.email || 'Admin';
    }
    return 'Admin';
  };

  const getBodyContent = (bodyData) => {
    if (!bodyData) return '';
    if (typeof bodyData === 'string') return bodyData;
    if (typeof bodyData === 'object') {
      return bodyData.content || bodyData.text || bodyData.description || '';
    }
    return '';
  };

  const categoryName = getCategoryName(post.category);
  const imageUrl = getImageUrl(post);

  return {
    id: post._id || post.id,
    _id: post._id || post.id,
    title: post.title || 'Untitled Post',
    body: getBodyContent(post.body),
    summary: post.summary ||
      post.excerpt ||
      (getBodyContent(post.body) ? getBodyContent(post.body).substring(0, 150) + '...' : ''),
    image: imageUrl || getRandomImage(categoryName), // Use fallback if empty
    category: categoryName,
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
  const [totalPages, setTotalPages] = useState(1);
  const [categoryInfo, setCategoryInfo] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    setPosts([]);
    setPage(1);
    fetchCategoryInfo();
  }, [category]);

  useEffect(() => {
    if (categoryInfo) {
      fetchPosts(1);
    }
  }, [categoryInfo]);

  const fetchCategoryInfo = async () => {
    try {
      // Increased limit to ensure we find the category even if it's far down the list
      const response = await axios.get(`${baseURL}/api/categories`, {
        params: { limit: 100 }
      });

      if (response.data.success) {
        const categories = response.data.data;

        let cat = categories.find(c => c._id === category);

        if (!cat) {
          cat = categories.find(c => {
            const catSlug = c.slug || c.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            return catSlug === category;
          });
        }

        if (cat) {
          setCategoryInfo(cat);
        } else {
          console.warn('Category not found in list, using params as fallback');
          setCategoryInfo({ name: category, _id: null }); // Set _id null to avoid invalid ID errors
        }
      }
    } catch (error) {
      console.error('Error fetching category:', error);
      setCategoryInfo({ name: category, _id: null });
    }
  };

  const fetchPosts = async (pageNum = 1) => {
    setLoading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const categoryId = categoryInfo?._id;

      // Since we are fixing the backend query issue, we must have a valid ID.
      // If we don't have an ID (slug fallback), the backend might not find it if it strictly expects ObjectId.
      // But let's try calling with what we have.

      if (!categoryId) {
        // Fallback: If no ID found, maybe the user passed a slug that isn't in DB yet?
        // Or fetch all and filter client side as last resort?
        // Let's try fetching with the slug/name as category param.
      }

      const params = {
        page: pageNum,
        limit: 30, // 30 posts per page
        status: 'published',
        sort: '-createdAt'
      };

      if (categoryId) {
        params.category = categoryId;
      }

      const response = await axios.get(`${baseURL}/api/public-posts`, { params });

      if (response.data.success) {
        let newPosts = [];
        if (Array.isArray(response.data.data)) {
          newPosts = response.data.data.map(transformPostData);
        }

        setPosts(newPosts);
        setTotalPages(response.data.totalPages || 1);
        setPage(pageNum);
      } else {
        throw new Error(response.data.message || 'Failed to fetch posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      // Fallback mechanism moved out or simplified
      setPosts([]);
      toast({
        title: 'Error',
        description: 'Failed to load posts.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchPosts(newPage);
    }
  };

  return (
    <>
      <Helmet>
        <title>{categoryInfo?.name || category} News - StoxBolt</title>
        <meta name="description" content={`Latest ${categoryInfo?.name || category} financial news and market updates on StoxBolt.`} />
      </Helmet>

      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2 capitalize">
              {categoryInfo?.name || category} News
            </h1>
            <p className="text-gray-600">
              Stay updated with the latest {(categoryInfo?.name || category).toLowerCase()} market news and analysis
            </p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
              <span className="ml-2 text-gray-600">Loading posts...</span>
            </div>
          ) : (
            <>
              {posts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post, index) => (
                    <PostCard key={post.id || index} post={post} index={index} />
                  ))}
                </div>
              ) : (
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
            </>
          )}

          {/* Pagination Controls */}
          {!loading && posts.length > 0 && totalPages > 1 && (
            <div className="flex justify-center items-center mt-12 gap-4">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </button>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  Page {page} of {totalPages}
                </span>
              </div>

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CategoryPage;