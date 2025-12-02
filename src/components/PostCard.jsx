
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Share2, Bookmark, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const PostCard = ({ post, index }) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { toast } = useToast();

  const handleShare = (e) => {
    e.preventDefault();
    if (navigator.share) {
      navigator.share({
        title: post.title,
        url: `/post/${post.id}`
      });
    } else {
      navigator.clipboard.writeText(window.location.origin + `/post/${post.id}`);
      toast({
        title: 'Link Copied!',
        description: 'Post link copied to clipboard'
      });
    }
  };

  const handleBookmark = (e) => {
    e.preventDefault();
    setIsBookmarked(!isBookmarked);
    // API call: POST /api/bookmarks
    toast({
      title: isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks',
      description: isBookmarked ? 'Post removed from your saved items' : 'Post saved successfully'
    });
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const getCategoryColor = (category) => {
    const colors = {
      Indian: 'bg-orange-500',
      US: 'bg-blue-500',
      Global: 'bg-purple-500',
      Commodities: 'bg-yellow-500',
      Forex: 'bg-green-500',
      Crypto: 'bg-indigo-500',
      IPOs: 'bg-pink-500'
    };
    return colors[category] || 'bg-gray-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group"
    >
      <Link to={`/post/${post.id}`} className="block">
        <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 h-full flex flex-col">
          <div className="relative overflow-hidden">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
            />
            {post.isSponsored && (
              <div className="absolute top-3 left-3 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                <TrendingUp className="h-3 w-3" />
                <span>Sponsored</span>
              </div>
            )}
            <div className={`absolute top-3 right-3 ${getCategoryColor(post.category)} text-white px-3 py-1 rounded-full text-xs font-semibold`}>
              {post.category}
            </div>
          </div>

          <div className="p-6 flex-1 flex flex-col">
            <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors line-clamp-2">
              {post.title}
            </h3>
            
            <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">
              {post.body}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>{getTimeAgo(post.publishedAt)}</span>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  className="hover:bg-orange-50 hover:text-orange-600"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBookmark}
                  className={`hover:bg-orange-50 ${isBookmarked ? 'text-orange-600' : 'hover:text-orange-600'}`}
                >
                  <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default PostCard;
