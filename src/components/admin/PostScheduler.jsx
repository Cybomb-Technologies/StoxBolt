import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Calendar, Clock, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PostScheduler = () => {
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchScheduledPosts();
  }, []);

  const fetchScheduledPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`${baseURL}/api/posts?status=scheduled`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch scheduled posts');
      }

      if (data.success) {
        setScheduledPosts(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to load scheduled posts');
      }
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load scheduled posts',
        variant: 'destructive'
      });
      setScheduledPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to remove this scheduled post?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${baseURL}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete post');
      }

      if (data.success) {
        setScheduledPosts((prev) => prev.filter((p) => p._id !== postId));
        toast({
          title: 'Post Removed',
          description: 'Scheduled post has been removed'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove post',
        variant: 'destructive'
      });
    }
  };

  const handlePublishNow = async (postId) => {
    if (!window.confirm('Publish this post immediately?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${baseURL}/api/posts/${postId}/publish`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to publish post');
      }

      if (data.success) {
        toast({
          title: 'Post Published',
          description: 'Post has been published immediately'
        });
        fetchScheduledPosts(); // Refresh the list
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to publish post',
        variant: 'destructive'
      });
    }
  };

  const handleTimezoneChange = (e) => {
    setTimezone(e.target.value);
    toast({
      title: 'Timezone Updated',
      description: `Timezone changed to ${e.target.value}`
    });
  };

  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getTimeRemaining = (dateString) => {
    try {
      const now = new Date();
      const scheduled = new Date(dateString);
      const diff = scheduled - now;
      
      if (diff <= 0) return 'Overdue';
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      if (days > 0) return `in ${days}d ${hours}h`;
      if (hours > 0) return `in ${hours}h`;
      
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `in ${minutes}m`;
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchScheduledPosts();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-2xl shadow-xl p-8"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Post Scheduler</h2>
        <div className="text-sm text-gray-600">
          {scheduledPosts.length} scheduled posts
        </div>
      </div>

      <div className="mb-8">
        <Label htmlFor="timezone">Display Timezone</Label>
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
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Scheduled Posts</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Refresh'
            )}
          </Button>
        </div>
        
        {scheduledPosts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No scheduled posts</p>
            <p className="text-sm text-gray-500 mt-2">
              Schedule posts from the post editor
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {scheduledPosts.map((post) => {
              const timeRemaining = getTimeRemaining(post.publishDateTime);
              const isOverdue = timeRemaining === 'Overdue';
              
              return (
                <div
                  key={post._id}
                  className={`p-4 rounded-xl transition-colors ${isOverdue ? 'bg-red-50 border-2 border-red-200' : 'bg-gray-50 hover:bg-gray-100'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{post.title}</h4>
                        <div className={`px-2 py-1 rounded-full text-xs font-semibold ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                          {timeRemaining}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDateTime(post.publishDateTime)}</span>
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                          {post.category}
                        </span>
                        <span className="text-sm">
                          By: {post.author || post.authorId?.name || 'Unknown'}
                        </span>
                      </div>
                      
                      {post.shortTitle && (
                        <p className="text-sm text-gray-500 mt-2 line-clamp-1">
                          {post.shortTitle}
                        </p>
                      )}
                    </div>
                    
                    <div className="ml-4 flex items-center space-x-2">
                      {isOverdue && user?.role === 'superadmin' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePublishNow(post._id)}
                          className="hover:text-green-600"
                          title="Publish Now"
                        >
                          Publish
                        </Button>
                      )}
                      {user?.role === 'superadmin' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(post._id)}
                          className="hover:text-red-600"
                          title="Remove from Schedule"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {isOverdue && (
                    <div className="flex items-center mt-3 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      This post was scheduled for {formatDateTime(post.publishDateTime)} but was not published
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PostScheduler;