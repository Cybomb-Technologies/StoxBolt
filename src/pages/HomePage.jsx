import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import HeroSlider from '@/components/HeroSlider';
import PostCard from '@/components/PostCard';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  const transformPostData = (post) => {
    // Helper function to get image URL from post object
    const getImageUrl = (postData) => {
      if (!postData) return '';
      
      // Check all possible image property names in order of preference
      return postData.imageUrl || 
             postData.featuredImage || 
             postData.image || 
             postData.thumbnail || 
             postData.bannerImage || 
             '';
    };

    // Helper function to get category name
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

    // Helper function to get author name
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

    // Helper function to get body content
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

  const fetchPosts = async (pageNum = 1) => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/api/public-posts`, {
        params: {
          page: pageNum,
          limit: 12,
          status: 'published',
          sort: '-createdAt'
        }
      });
      
      if (response.data.success) {
        const newPosts = Array.isArray(response.data.data) ? 
          response.data.data.map(transformPostData) : 
          [];
        
        if (pageNum === 1) {
          setPosts(newPosts);
        } else {
          setPosts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));
            return [...prev, ...uniqueNewPosts];
          });
        }
        
        setTotalPages(response.data.totalPages || 1);
        setHasMore(pageNum < (response.data.totalPages || 1));
      } else {
        throw new Error(response.data.message || 'Failed to fetch posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load posts. Please try again.',
        variant: 'destructive'
      });
      
      if (pageNum === 1) {
        setPosts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(1);
  }, []);

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

  return (
    <>
      <Helmet>
        <title>StoxBolt - Latest Financial News & Market Updates</title>
        <meta name="description" content="Stay updated with the latest financial news from India, US, Global markets, Commodities, Forex, Crypto, and IPOs on StoxBolt. Real-time market analysis and insights." />
        <meta property="og:title" content="StoxBolt - Latest Financial News & Market Updates" />
        <meta property="og:description" content="Stay updated with the latest financial news from India, US, Global markets, Commodities, Forex, Crypto, and IPOs." />
        <meta property="og:type" content="website" />
      </Helmet>

      <main className="min-h-screen">
        <HeroSlider />

        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, index) => (
              <PostCard key={post.id} post={post} index={index} />
            ))}
          </div>

          {loading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-2" />
              <span className="text-gray-600">Loading posts...</span>
            </div>
          )}

          {!loading && posts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 font-medium">No posts found</p>
              <button 
                onClick={() => fetchPosts(1)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {!hasMore && posts.length > 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 font-medium">You've reached the end of the latest posts!</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default HomePage;