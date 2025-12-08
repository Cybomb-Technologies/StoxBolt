import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { 
  Calendar, 
  Clock, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw, 
  AlertTriangle,
  CalendarClock,
  FileText
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PostScheduler = () => {
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchAllData();
  }, []);

  // Update the fetchAllData function to handle category errors gracefully
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      console.log('Fetching all scheduled posts data...');
      
      // Fetch scheduled posts (approved)
      const scheduledResponse = await fetch(`${baseURL}/api/posts/scheduled`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      let scheduledResult;
      try {
        scheduledResult = await scheduledResponse.json();
      } catch (parseError) {
        console.error('Failed to parse scheduled posts response:', parseError);
        throw new Error('Invalid response from server');
      }
      
      if (!scheduledResponse.ok) {
        throw new Error(scheduledResult?.message || 'Failed to fetch scheduled posts');
      }

      if (scheduledResult.success) {
        const scheduledPostsData = scheduledResult.data || [];
        console.log('Scheduled posts:', scheduledPostsData);
        
        // Process scheduled posts with safe category handling
        const processedScheduled = scheduledPostsData.map((post) => {
          // Safe category name extraction
          let categoryName = 'Uncategorized';
          if (post.categoryName) {
            categoryName = post.categoryName;
          } else if (post.category) {
            if (typeof post.category === 'object' && post.category.name) {
              categoryName = post.category.name;
            } else if (typeof post.category === 'string') {
              // Handle string categories (like "Indian")
              if (post.category.toLowerCase() === 'indian') {
                categoryName = 'Indian';
              } else if (post.category.length < 24) {
                // Probably a category name, not an ObjectId
                categoryName = post.category;
              } else {
                // Might be an ObjectId, use placeholder
                categoryName = 'Category ID: ' + post.category.substring(0, 8) + '...';
              }
            }
          }
          
          return {
            ...post,
            categoryName,
            source: 'Post',
            type: 'scheduled'
          };
        });
        
        setScheduledPosts(processedScheduled);
        
        // Check for overdue posts
        const now = new Date();
        const overduePosts = processedScheduled.filter(post => {
          if (!post.publishDateTime) return false;
          const publishDate = new Date(post.publishDateTime);
          return publishDate <= now && post.status !== 'published';
        });
        
        if (overduePosts.length > 0) {
          toast({
            title: 'Overdue Posts Detected',
            description: `${overduePosts.length} scheduled post(s) are overdue and need attention.`,
            variant: 'destructive',
            duration: 5000
          });
        }
        
        // Show warning if there were data issues
        if (scheduledResult.warnings) {
          toast({
            title: 'Data Issues',
            description: scheduledResult.warnings,
            variant: 'warning',
            duration: 7000
          });
        } else {
          toast({
            title: 'Data Loaded',
            description: `Loaded ${processedScheduled.length} scheduled posts`,
            variant: 'default'
          });
        }
      } else {
        throw new Error(scheduledResult.message || 'Failed to load scheduled posts');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message || 'Failed to load data');
      toast({
        title: 'Error',
        description: error.message || 'Failed to load scheduled posts',
        variant: 'destructive'
      });
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
      console.log('Deleting scheduled post:', postId);
      
      const response = await fetch(`${baseURL}/api/scheduler/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
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
      console.log('Publishing post now:', postId);
      
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
        fetchAllData(); // Refresh the list
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
      if (!dateString) return 'No date set';
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

  const getTimeRemaining = (dateString, status) => {
    try {
      if (!dateString) return 'No date';
      
      const now = new Date();
      const scheduled = new Date(dateString);
      
      // If post is already published, show "Published"
      if (status === 'published') {
        return 'Published';
      }
      
      const diff = scheduled - now;
      
      if (diff <= 0) return 'Overdue';
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      if (days > 0) return `${days}d ${hours}h`;
      if (hours > 0) return `${hours}h`;
      
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${minutes}m`;
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  const getAuthorName = (post) => {
    if (post.author) return post.author;
    if (post.authorId?.name) return post.authorId.name;
    if (typeof post.authorId === 'string') return post.authorId;
    return 'Unknown Author';
  };

  const triggerAutoPublish = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${baseURL}/api/scheduler/trigger-auto-publish`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Auto-publish Triggered',
          description: `Processed ${data.count} posts`,
          variant: 'default'
        });
        fetchAllData();
      } else {
        throw new Error(data.message || 'Failed to trigger auto-publish');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to trigger auto-publish',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading scheduled posts...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-2xl shadow-xl p-6 md:p-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Post Scheduler</h2>
          <p className="text-gray-600 mt-1">Manage and view scheduled posts</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex space-x-2">
            <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              {scheduledPosts.length} scheduled
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          {user?.role === 'superadmin' && (
            <Button
              variant="outline"
              size="sm"
              onClick={triggerAutoPublish}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Trigger Auto-publish
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <Button
                onClick={handleRefresh}
                size="sm"
                variant="outline"
                className="mt-2 border-red-300 text-red-700 hover:bg-red-100"
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <Label htmlFor="timezone" className="text-sm font-medium text-gray-700 mb-2 block">
          Display Timezone
        </Label>
        <select
          id="timezone"
          value={timezone}
          onChange={handleTimezoneChange}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors"
        >
          <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
          <option value="America/New_York">America/New_York (EST)</option>
          <option value="Europe/London">Europe/London (GMT)</option>
          <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
          <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Times will be displayed in your selected timezone
        </p>
      </div>

      {/* Scheduled Posts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-orange-500" />
            Scheduled Posts
          </h3>
          <div className="text-sm text-gray-500">
            {scheduledPosts.length > 0 && `Next post: ${formatDateTime(scheduledPosts[0]?.publishDateTime)}`}
          </div>
        </div>
        
        {scheduledPosts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg font-medium">No scheduled posts</p>
            <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
              Create posts with future publish dates to see them here.
            </p>
            <Button
              onClick={handleRefresh}
              className="mt-4"
            >
              Check for New Posts
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {scheduledPosts.map((post) => {
              const timeRemaining = getTimeRemaining(post.publishDateTime, post.status);
              const isOverdue = timeRemaining === 'Overdue';
              const isPublished = post.status === 'published';
              
              return (
                <div
                  key={post._id}
                  className={`p-4 rounded-xl transition-all duration-200 ${isOverdue ? 'bg-red-50 border-2 border-red-200' : isPublished ? 'bg-green-50 border-2 border-green-200' : 'bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 hover:border-orange-300 hover:shadow-sm'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 truncate pr-2" title={post.title}>
                          {post.title || 'Untitled Post'}
                        </h4>
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${isOverdue ? 'bg-red-100 text-red-700 border border-red-200' : isPublished ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-orange-100 text-orange-700 border border-orange-200'}`}>
                          {isOverdue ? 'Overdue' : timeRemaining}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                        <span className="flex items-center space-x-1 bg-white px-2 py-1 rounded border">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span className="whitespace-nowrap">{formatDateTime(post.publishDateTime)}</span>
                        </span>
                        
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs whitespace-nowrap border border-blue-200">
                          {post.categoryName || 'Uncategorized'}
                        </span>
                        
                        <span className="text-sm whitespace-nowrap px-2 py-1 bg-gray-100 rounded border">
                          By: {getAuthorName(post)}
                        </span>
                        
                        <span className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs whitespace-nowrap border border-purple-200">
                          <FileText className="h-3 w-3" />
                          {post.source || 'Post'}
                        </span>
                        
                        {isPublished && (
                          <span className="flex items-center text-green-600 whitespace-nowrap px-2 py-1 bg-green-100 rounded border border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                            Published
                          </span>
                        )}
                      </div>
                      
                      {post.shortTitle && (
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                          {post.shortTitle}
                        </p>
                      )}
                    </div>
                    
                    <div className="ml-4 flex items-center space-x-2 flex-shrink-0">
                      {isOverdue && !isPublished && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handlePublishNow(post._id)}
                          className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                          title="Publish Now"
                        >
                          Publish Now
                        </Button>
                      )}
                      {(user?.role === 'superadmin' || post.authorId?._id === user?._id) && !isPublished && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(post._id)}
                          className="hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                          title="Remove from Schedule"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {isOverdue && !isPublished && (
                    <div className="flex items-center mt-3 text-sm text-red-600 bg-red-100 px-3 py-2 rounded-lg">
                      <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>This post was scheduled for {formatDateTime(post.publishDateTime)} but was not published automatically</span>
                    </div>
                  )}
                  
                  {isPublished && (
                    <div className="flex items-center mt-3 text-sm text-green-600 bg-green-100 px-3 py-2 rounded-lg">
                      <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>This post has been published</span>
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