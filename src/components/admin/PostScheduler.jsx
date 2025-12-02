
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Calendar, Clock, Trash2 } from 'lucide-react';

const PostScheduler = () => {
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const { toast } = useToast();

  useEffect(() => {
    fetchScheduledPosts();
  }, []);

  const fetchScheduledPosts = async () => {
    // API call: GET /api/posts?status=scheduled
    const mockPosts = Array.from({ length: 5 }, (_, i) => ({
      id: `scheduled-${i + 1}`,
      title: `Scheduled StoxBolt Post ${i + 1}`,
      category: ['Indian', 'US', 'Crypto'][i % 3],
      scheduledFor: new Date(Date.now() + (i + 1) * 86400000).toISOString()
    }));
    setScheduledPosts(mockPosts);
  };

  const handleDelete = async (postId) => {
    try {
      // API call: DELETE /api/posts/${postId}
      setScheduledPosts((prev) => prev.filter((p) => p.id !== postId));
      toast({
        title: 'Post Removed',
        description: 'Scheduled post has been removed'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove post',
        variant: 'destructive'
      });
    }
  };

  const handleTimezoneChange = (e) => {
    setTimezone(e.target.value);
    // API call: PUT /api/settings/timezone
    toast({
      title: 'Timezone Updated',
      description: `Timezone changed to ${e.target.value}`
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-2xl shadow-xl p-8"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Post Scheduler</h2>

      <div className="mb-8">
        <Label htmlFor="timezone">Default Timezone</Label>
        <select
          id="timezone"
          value={timezone}
          onChange={handleTimezoneChange}
          className="w-full mt-2 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
        >
          <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
          <option value="America/New_York">America/New_York (EST)</option>
          <option value="Europe/London">Europe/London (GMT)</option>
          <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
          <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
        </select>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Scheduled Posts</h3>
        
        {scheduledPosts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No scheduled posts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scheduledPosts.map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{post.title}</h4>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(post.scheduledFor).toLocaleDateString()}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(post.scheduledFor).toLocaleTimeString()}</span>
                    </span>
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                      {post.category}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(post.id)}
                  className="hover:text-red-600"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PostScheduler;
