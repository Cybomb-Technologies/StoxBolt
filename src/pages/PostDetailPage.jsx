
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Share2, Bookmark, Clock, User, ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import RelatedPostsCarousel from '@/components/RelatedPostsCarousel';
import IndexSnapshot from '@/components/IndexSnapshot';
import SocialImageExport from '@/components/SocialImageExport';

const PostDetailPage = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showSocialExport, setShowSocialExport] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      // API call: GET /api/posts/${id}
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const mockPost = {
        id,
        title: 'Indian Stock Market Reaches Historic Milestone as Sensex Crosses 70,000',
        shortTitle: 'Sensex Historic High',
        body: `Mumbai: In a landmark achievement for Indian financial markets, the BSE Sensex crossed the psychological barrier of 70,000 points today, marking a significant milestone in the country's economic journey.

The rally was driven by strong corporate earnings, robust economic fundamentals, and increased foreign institutional investor (FII) participation. Market experts attribute this surge to a combination of factors including improved GDP growth projections, controlled inflation rates, and positive global sentiment towards emerging markets.

Leading the charge were banking and IT stocks, with HDFC Bank, Infosys, and TCS showing exceptional gains. The Nifty 50 index also mirrored this performance, crossing the 21,000 mark for the first time in its history.

Finance Minister Nirmala Sitharaman welcomed this development, stating that it reflects the growing confidence in India's economic policies and reforms. "This is a testament to the resilience of our economy and the faith investors have in India's growth story," she said in a statement.

Analysts predict that this momentum could continue, supported by the government's infrastructure push, digital transformation initiatives, and improving corporate profitability. However, they also caution investors to maintain a balanced portfolio and stay informed about global economic developments that could impact market dynamics.

The achievement comes at a time when India is positioning itself as a global economic powerhouse, with various international organizations projecting it to become the world's third-largest economy by 2030.`,
        image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=1600',
        category: 'Indian',
        author: 'Rajesh Kumar',
        publishedAt: new Date().toISOString(),
        tags: ['Sensex', 'Stock Market', 'Indian Economy', 'FII', 'Banking'],
        region: 'India',
        isSponsored: false,
        metaTitle: 'Indian Stock Market Reaches Historic Milestone - Sensex Crosses 70,000',
        metaDescription: 'BSE Sensex crosses 70,000 points for the first time, driven by strong corporate earnings and robust economic fundamentals.'
      };

      setPost(mockPost);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load post',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link Copied!',
        description: 'Post link copied to clipboard'
      });
    }
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast({
      title: isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks',
      description: isBookmarked ? 'Post removed from your saved items' : 'Post saved successfully'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Post not found</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{post.metaTitle || post.title} - StoxBolt</title>
        <meta name="description" content={post.metaDescription || post.body.substring(0, 160)} />
        <meta property="og:title" content={post.metaTitle || post.title} />
        <meta property="og:description" content={post.metaDescription || post.body.substring(0, 160)} />
        <meta property="og:image" content={post.image} />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={post.publishedAt} />
        <meta property="article:author" content={post.author} />
      </Helmet>

      <article className="min-h-screen py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to="/" className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-96 object-cover"
            />

            <div className="p-8">
              <div className="flex items-center justify-between mb-4">
                <span className="px-4 py-1 bg-orange-600 text-white text-sm font-semibold rounded-full">
                  {post.category}
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSocialExport(true)}
                    className="hover:bg-orange-50 hover:text-orange-600"
                  >
                    <Download className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleShare}
                    className="hover:bg-orange-50 hover:text-orange-600"
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBookmark}
                    className={`hover:bg-orange-50 ${isBookmarked ? 'text-orange-600' : 'hover:text-orange-600'}`}
                  >
                    <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
                  </Button>
                </div>
              </div>

              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {post.title}
              </h1>

              <div className="flex items-center space-x-6 text-gray-600 mb-6 pb-6 border-b">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">{post.author}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>

              <div className="prose prose-lg max-w-none">
                {post.body.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>

              {post.tags && post.tags.length > 0 && (
                <div className="mt-8 pt-6 border-t">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">Tags:</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <IndexSnapshot />
          <RelatedPostsCarousel category={post.category} currentPostId={post.id} />
        </div>
      </article>

      {showSocialExport && (
        <SocialImageExport
          post={post}
          onClose={() => setShowSocialExport(false)}
        />
      )}
    </>
  );
};

export default PostDetailPage;
