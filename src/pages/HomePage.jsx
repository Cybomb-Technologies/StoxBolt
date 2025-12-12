import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import HeroSlider from '@/components/HeroSlider';
import PostCard from '@/components/PostCard';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Fallback images categorized
const categoryImages = {
  default: [
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80', // Stock graph
    'https://images.unsplash.com/photo-1611974765270-ca1258634369?auto=format&fit=crop&w=800&q=80', // Stock candles
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80'  // Financial newspaper
  ],
  markets: [
    'https://images.unsplash.com/photo-1611974765270-ca1258634369?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1535320903710-d9cf76d51c92?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=800&q=80'
  ],
  economy: [
    'https://images.unsplash.com/photo-1526304640155-24e3acfad16ef?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=800&q=80'
  ],
  technology: [
    'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80'
  ],
  ipo: [
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?auto=format&fit=crop&w=800&q=80'
  ]
};

const getRandomImage = (categoryName = '') => {
  const normalizedCat = categoryName.toLowerCase();
  let images = categoryImages.default;

  if (normalizedCat.includes('market') || normalizedCat.includes('stock')) images = categoryImages.markets;
  else if (normalizedCat.includes('economy') || normalizedCat.includes('finance')) images = categoryImages.economy;
  else if (normalizedCat.includes('tech') || normalizedCat.includes('digital')) images = categoryImages.technology;
  else if (normalizedCat.includes('ipo') || normalizedCat.includes('startup')) images = categoryImages.ipo;

  return images[Math.floor(Math.random() * images.length)];
};

const transformPostData = (post) => {
  // Helper function to get image URL from post object
  const getImageUrl = (postData) => {
    if (!postData) return '';
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
      return categoryData.name || categoryData.title || categoryData._id || '';
    }
    return '';
  };

  // Helper function to get author name
  const getAuthorName = (authorData) => {
    if (!authorData) return 'Admin';
    if (typeof authorData === 'string') return authorData;
    if (typeof authorData === 'object') {
      return authorData.name || authorData.username || authorData.email || 'Admin';
    }
    return 'Admin';
  };

  // Helper function to get body content
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
    image: imageUrl || getRandomImage(categoryName),
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

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  const fetchPosts = async (pageNum = 1) => {
    setLoading(true);
    // Scroll to top when fetching new page
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    try {
      const response = await axios.get(`${baseURL}/api/public-posts`, {
        params: {
          page: pageNum,
          limit: 30, // Updated to 30 posts per page
          status: 'published',
          sort: '-createdAt'
        }
      });
      
      if (response.data.success) {
        const newPosts = Array.isArray(response.data.data) ? 
          response.data.data.map(transformPostData) : 
          [];
        
        setPosts(newPosts); // Replace posts instead of appending
        setTotalPages(response.data.totalPages || 1);
        setPage(pageNum); // Update current page state
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
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(1);
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchPosts(newPage);
    }
  };

  return (
    <>
      <Helmet>
        <title>StoxBolt - Latest Financial News & Market Updates</title>
        <meta name="description" content="Stay updated with the latest financial news from India, US, Global markets, Commodities, Forex, Crypto, and IPOs on StoxBolt. Real-time market analysis and insights." />
        <meta property="og:title" content="StoxBolt - Latest Financial News & Market Updates" />
        <meta property="og:description" content="Stay updated with the latest financial news from India, US, Global markets, Commodities, Forex, Crypto, and IPOs." />
        <meta property="og:type" content="website" />
      </Helmet>

      <main className="min-h-screen pb-12">
        <HeroSlider />

        <div className="container mx-auto px-4 py-12">
          {loading && posts.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-2" />
              <span className="text-gray-600">Loading posts...</span>
            </div>
          ) : (
            <>
              {posts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post, index) => (
                    <PostCard key={post.id} post={post} index={index} />
                  ))}
                </div>
              ) : (
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
      </main>
    </>
  );
};

export default HomePage;