import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import PostCard from '@/components/PostCard';
import { Loader2, ChevronLeft, ChevronRight, Search } from 'lucide-react';
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

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (query) {
      setPage(1);
      fetchPosts(1);
    } else {
      setPosts([]);
      setLoading(false);
    }
  }, [query]);

  const fetchPosts = async (pageNum = 1) => {
    if (!query) return;
    
    setLoading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const params = {
        page: pageNum,
        limit: 30, // 30 posts per page
        status: 'published',
        search: query,
        sort: '-createdAt'
      };

      const response = await axios.get(`${baseURL}/api/public-posts`, { params });

      if (response.data.success) {
        let newPosts = [];
        if (Array.isArray(response.data.data)) {
          newPosts = response.data.data.map(transformPostData);
        }

        setPosts(newPosts);
        setTotalPages(response.data.totalPages || 1);
        setTotalResults(response.data.total || response.data.count || 0);
        setPage(pageNum);
      } else {
        throw new Error(response.data.message || 'Failed to fetch posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
      toast({
        title: 'Error',
        description: 'Failed to load search results.',
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
        <title>Search Results for "{query}" - StoxBolt</title>
        <meta name="description" content={`Search results for ${query} on StoxBolt.`} />
      </Helmet>

      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <Search className="mr-3 h-8 w-8 text-orange-600" />
              Search Results
            </h1>
            <p className="text-gray-600">
              Found {totalResults} results for "{query}"
            </p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
              <span className="ml-2 text-gray-600">Loading results...</span>
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
                <div className="text-center py-16 bg-gray-50 rounded-xl">
                  <Search className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-500 mb-6">
                    We couldn't find any posts matching "{query}".
                  </p>
                  <p className="text-sm text-gray-400">
                    Try different keywords or check for spelling mistakes.
                  </p>
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

export default SearchPage;
