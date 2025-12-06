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

  // Transform post data to ensure it's in the right format
  const transformPostData = (post) => {
    return {
      id: post._id || post.id,
      _id: post._id,
      title: post.title || '',
      body: typeof post.body === 'string' ? post.body : 
            post.body?.content || post.body?.text || post.content || post.description || '',
      summary: post.summary || post.excerpt || '',
      image: post.image || post.thumbnail || post.featuredImage || 
             `https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=800`,
      category: typeof post.category === 'string' ? post.category : 
                post.category?.name || post.category?.title || '',
      isSponsored: post.isSponsored || post.sponsored || false,
      publishedAt: post.publishedAt || post.createdAt || post.updatedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      status: post.status || 'published',
      author: post.author ? 
        (typeof post.author === 'string' ? post.author : post.author.name || post.author.username) : 
        'Admin',
      tags: Array.isArray(post.tags) ? post.tags : 
            (post.tags ? post.tags.split(',') : [])
    };
  };

  const fetchPosts = async (pageNum = 1) => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/api/posts`, {
        params: {
          page: pageNum,
          limit: 12,
          status: 'published',
          sort: '-createdAt'
        }
      });
      
      console.log('API Response:', response.data); // Debug log
      
      if (response.data.success) {
        // Transform the data before setting state
        const newPosts = Array.isArray(response.data.data) ? 
          response.data.data.map(transformPostData) : 
          [];
        
        console.log('Transformed posts:', newPosts); // Debug log
        
        if (pageNum === 1) {
          setPosts(newPosts);
        } else {
          setPosts(prev => {
            // Avoid duplicates
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
      
      // Fallback to empty array if API fails
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
            {posts.map((post, index) => {
              // Debug log for each post
              if (process.env.NODE_ENV === 'development') {
                console.log(`Post ${index}:`, post);
              }
              
              return <PostCard key={post.id} post={post} index={index} />;
            })}
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