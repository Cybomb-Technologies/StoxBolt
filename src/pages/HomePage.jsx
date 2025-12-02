
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import HeroSlider from '@/components/HeroSlider';
import PostCard from '@/components/PostCard';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  const stockImages = [
    'https://images.unsplash.com/photo-1611974765270-ca1258634369?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1526304640151-b5a95f9032d5?auto=format&fit=crop&q=80&w=800'
  ];

  useEffect(() => {
    fetchPosts();
  }, []);

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
      fetchPosts();
    }
  }, [page]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // API call: GET /api/posts?page=${page}&limit=12
      // Mock data
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const mockPosts = Array.from({ length: 12 }, (_, i) => ({
        id: `${page}-${i + 1}`,
        title: `Breaking: Major Financial Development in ${['Indian', 'US', 'Global'][i % 3]} Markets`,
        shortTitle: 'Market Update',
        body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        image: stockImages[(i + page) % stockImages.length],
        category: ['Indian', 'US', 'Global', 'Commodities', 'Forex', 'Crypto', 'IPOs'][i % 7],
        author: 'StoxBolt Desk',
        publishedAt: new Date(Date.now() - i * 3600000).toISOString(),
        isSponsored: i % 5 === 0
      }));

      if (page === 3) {
        setHasMore(false);
      }

      setPosts((prev) => [...prev, ...mockPosts]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load posts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
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
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          )}

          {!hasMore && posts.length > 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 font-medium">You've reached the end!</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default HomePage;
