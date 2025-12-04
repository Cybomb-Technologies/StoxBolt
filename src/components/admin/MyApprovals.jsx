// MyApprovals.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Eye,
  MessageSquare,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Tag,
  Search,
  Filter,
  CalendarClock,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const MyApprovals = () => {
  const [myPosts, setMyPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [error, setError] = useState(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const itemsPerPage = 10;

  useEffect(() => {
    if (user) {
      fetchMyPosts();
    }
  }, [user, currentPage, filterStatus]);

  const fetchMyPosts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        type: 'all'
      });
      
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      // Use the correct endpoint
      const url = `${baseURL}/api/approval/my-submissions?${params.toString()}`;
      console.log('Fetching My Submissions from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('My Submissions Response:', data);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please log in again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. Please check your permissions.');
        } else {
          throw new Error(data.message || `Failed to fetch your submissions: ${response.status}`);
        }
      }

      if (data.success) {
        console.log('Received data count:', data.data.length);
        
        // Debug log to see what we received
        if (data.data.length > 0) {
          console.log('Sample data received:');
          data.data.slice(0, 3).forEach((post, index) => {
            console.log(`${index + 1}. ID: ${post._id}`);
            console.log(`   Title: ${post.title}`);
            console.log(`   Type: ${post.type}`);
            console.log(`   Approval Status: ${post.approvalStatus}`);
            console.log(`   Scheduled: ${post.isScheduledPost}`);
            console.log(`   Schedule Approved: ${post.scheduleApproved}`);
            console.log('---');
          });
        }
        
        setMyPosts(data.data);
        setTotalPosts(data.total);
        setTotalPages(data.totalPages);
        
        // Show success message
        toast({
          title: 'Success',
          description: `Loaded ${data.data.length} submissions`,
          variant: 'default'
        });
      } else {
        throw new Error(data.message || 'Failed to load your submissions');
      }
    } catch (error) {
      console.error('Error fetching your posts:', error);
      setError(error.message);
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to load your submissions',
        variant: 'destructive',
        duration: 5000
      });
      
      setMyPosts([]);
      setTotalPosts(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

 const getStatusBadge = (post) => {
  console.log('Getting status for post:', {
    id: post._id,
    title: post.title,
    type: post.type,
    approvalStatus: post.approvalStatus,
    isScheduledPost: post.isScheduledPost,
    isScheduled: post.isScheduled,
    scheduleApproved: post.scheduleApproved,
    publishDateTime: post.publishDateTime,
    status: post.status
  });
  
  // FIRST: Check if it's a scheduled post by multiple criteria
  const isScheduled = 
    post.isScheduledPost || 
    post.isScheduled ||
    (post.publishDateTime && new Date(post.publishDateTime) > new Date()) ||
    post.approvalStatus?.includes('scheduled') ||
    post.status === 'scheduled';
  
  console.log('Is scheduled?', isScheduled, 'Criteria:', {
    isScheduledPost: post.isScheduledPost,
    isScheduled: post.isScheduled,
    futureDate: post.publishDateTime && new Date(post.publishDateTime) > new Date(),
    approvalStatusHasScheduled: post.approvalStatus?.includes('scheduled'),
    statusIsScheduled: post.status === 'scheduled'
  });
  
  // Handle scheduled posts
  if (isScheduled) {
    if (post.scheduleApproved || post.approvalStatus === 'scheduled_approved') {
      return {
        label: 'Schedule Approved',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
        isScheduled: true
      };
    } else if (post.approvalStatus === 'rejected' || post.rejectionReason) {
      return {
        label: 'Schedule Rejected',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle,
        isScheduled: true
      };
    } else {
      // Default for scheduled pending
      return {
        label: 'Schedule Pending',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock,
        isScheduled: true
      };
    }
  }
  
  // Use approvalStatus for AdminPosts, status for Posts
  const status = post.approvalStatus || post.status || 'pending_review';
  
  const statusConfig = {
    pending_review: {
      label: 'Pending Review',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: Clock
    },
    approved: {
      label: 'Approved',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle
    },
    rejected: {
      label: 'Rejected',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: XCircle
    },
    changes_requested: {
      label: 'Changes Requested',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: MessageSquare
    },
    scheduled_pending: {
      label: 'Schedule Pending',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: Clock,
      isScheduled: true
    },
    scheduled_approved: {
      label: 'Schedule Approved',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle,
      isScheduled: true
    },
    draft: {
      label: 'Draft',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: FileText
    },
    published: {
      label: 'Published',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: CheckCircle
    },
    pending_approval: {
      label: 'Pending Approval',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: Clock
    },
    scheduled: {
      label: 'Scheduled',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: CalendarClock,
      isScheduled: true
    }
  };

  return statusConfig[status] || statusConfig.pending_review;
};

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Not specified';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatScheduleDate = (dateString) => {
    try {
      if (!dateString) return 'Not scheduled';
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = date - now;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      let relativeTime = '';
      if (diffDays === 0) {
        relativeTime = 'Today';
      } else if (diffDays === 1) {
        relativeTime = 'Tomorrow';
      } else if (diffDays > 1) {
        relativeTime = `in ${diffDays} days`;
      } else {
        relativeTime = 'Past due';
      }
      
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} (${relativeTime})`;
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handlePreview = (post) => {
    const previewData = {
      ...post,
      _id: post._id || post.postId || 'preview',
      status: 'published',
      createdAt: post.createdAt || new Date().toISOString(),
    };
    
    localStorage.setItem('postPreview', JSON.stringify(previewData));
    window.open(`/post/preview`, '_blank');
  };

  const handleFilterApply = () => {
    setCurrentPage(1);
    fetchMyPosts();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setCurrentPage(1);
    fetchMyPosts();
  };

  const handleRefresh = () => {
    fetchMyPosts();
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      handleFilterApply();
    }
  };

  // Handle empty states
  if (loading && currentPage === 1) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your submissions...</p>
          <p className="text-sm text-gray-500 mt-2">Fetching data from server</p>
        </div>
      </div>
    );
  }

  // Add this right after loading check in MyApprovals.jsx
if (process.env.NODE_ENV === 'development') {
  console.log('=== MYAPPROVALS DEBUG ===');
  console.log('Total posts:', myPosts.length);
  console.log('All posts data:');
  
  myPosts.forEach((post, index) => {
    console.log(`${index + 1}. ID: ${post._id}`);
    console.log(`   Title: ${post.title}`);
    console.log(`   Type: ${post.type}`);
    console.log(`   Approval Status: ${post.approvalStatus}`);
    console.log(`   isScheduledPost: ${post.isScheduledPost}`);
    console.log(`   isScheduled: ${post.isScheduled}`);
    console.log(`   scheduleApproved: ${post.scheduleApproved}`);
    console.log(`   publishDateTime: ${post.publishDateTime}`);
    console.log(`   Future date?: ${post.publishDateTime && new Date(post.publishDateTime) > new Date()}`);
    console.log('---');
  });
  
  // Check specifically for scheduled posts
  const scheduledPosts = myPosts.filter(post => 
    post.isScheduledPost || 
    post.isScheduled ||
    (post.publishDateTime && new Date(post.publishDateTime) > new Date())
  );
  
  console.log(`Scheduled posts found: ${scheduledPosts.length}`);
  scheduledPosts.forEach((post, index) => {
    console.log(`${index + 1}. ${post.title} - ${post.approvalStatus}`);
  });
}

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Submissions</h1>
              <p className="text-gray-600 mt-2">Track your posts and approval requests</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500">User: {user?.name || 'Unknown'}</span>
                <span className="text-sm px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full">
                  {user?.role?.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                <AlertCircle className="h-3 w-3 mr-1" />
                Total: {totalPosts}
              </span>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleRefresh}
                    className="px-3 py-1.5 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Card Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Your Posts & Submissions</h2>
                <p className="text-sm text-gray-600">Review status of your submitted posts and scheduled posts</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <User className="h-3 w-3 mr-1" />
                  {user?.role?.toUpperCase() || 'USER'}
                </span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title, category, or status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleSearch}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="changes_requested">Changes Requested</option>
                  <option value="scheduled_pending">Schedule Pending</option>
                  <option value="scheduled_approved">Schedule Approved</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
                
                <button
                  onClick={handleFilterApply}
                  className="px-4 py-2.5 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
                >
                  Apply Filters
                </button>
                
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
            
            {/* Results count */}
            <div className="mt-4 flex items-center justify-between text-sm">
              <p className="text-gray-600">
                Showing {myPosts.length} of {totalPosts} submissions
                {filterStatus !== 'all' && ` (filtered by: ${filterStatus.replace('_', ' ')})`}
              </p>
              {loading && (
                <div className="flex items-center text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </div>
              )}
            </div>
          </div>

          {/* Posts List */}
          <div className="divide-y divide-gray-200">
            {myPosts.length === 0 ? (
              <motion.div 
                className="text-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {error ? (
                  <>
                    <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Error Loading Data
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      {error}
                    </p>
                  </>
                ) : searchQuery || filterStatus !== 'all' ? (
                  <>
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No matching submissions found
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Try adjusting your search or filters
                    </p>
                  </>
                ) : (
                  <>
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No submissions yet
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto mb-6">
                      You haven't submitted any posts for approval yet.
                    </p>
                    <button
                      onClick={() => window.location.href = '/admin/posts/create'}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                    >
                      Create Your First Post
                    </button>
                  </>
                )}
              </motion.div>
            ) : (
              myPosts.map((post) => {
                const postTitle = post.title || 'Untitled Post';
                const statusConfig = getStatusBadge(post);
                const Icon = statusConfig.icon;
                const isScheduled = post.isScheduledPost || post.isScheduled;
                
                // Handle postId properly
                const postIdValue = post._id || 'no-id';
                const linkedPostTitle = post.postId && typeof post.postId === 'object' ? post.postId.title : null;
                
                return (
                  <motion.div 
                    key={postIdValue} 
                    className="px-6 py-4 hover:bg-gray-50 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-4">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isScheduled ? 
                            'bg-gradient-to-br from-purple-100 to-purple-200' : 
                            'bg-gradient-to-br from-orange-100 to-orange-200'
                        }`}>
                          {isScheduled ? (
                            <CalendarClock className="h-6 w-6 text-purple-600" />
                          ) : (
                            <FileText className="h-6 w-6 text-orange-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {postTitle}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color} border`}>
                              <Icon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </span>
                            
                            {isScheduled && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                <Calendar className="h-3 w-3 mr-1" />
                                Scheduled
                              </span>
                            )}
                            
                            {post.isUpdateRequest && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                Update Request
                              </span>
                            )}
                            
                            {/* Show source type */}
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                              {post.type === 'approval' ? 'AdminPost' : 'Post'}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-gray-600 text-sm mb-2">
                            {post.category && (
                              <div className="flex items-center">
                                <Tag className="h-3 w-3 mr-2" />
                                {typeof post.category === 'object' ? post.category.name : post.category}
                              </div>
                            )}
                            
                            {post.version && (
                              <div className="flex items-center">
                                <span className="font-medium">Version:</span> {post.version}
                              </div>
                            )}
                            
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-2" />
                              Submitted {formatDate(post.createdAt)}
                            </div>
                            
                            {isScheduled && post.publishDateTime && (
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-2" />
                                Scheduled: {formatScheduleDate(post.publishDateTime)}
                              </div>
                            )}
                            
                            {/* Show linked post if exists */}
                            {linkedPostTitle && (
                              <div className="flex items-center">
                                <span className="font-medium">Linked to:</span> {linkedPostTitle}
                              </div>
                            )}
                          </div>
                          
                          {post.shortTitle && (
                            <p className="text-gray-600 text-sm mb-2 truncate">
                              {post.shortTitle}
                            </p>
                          )}
                          
                          {post.reviewerNotes && (
                            <div className="mt-2 p-2 bg-blue-50 text-blue-700 rounded text-xs">
                              <div className="flex items-start">
                                <MessageSquare className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                                <span><strong>Reviewer Notes:</strong> {post.reviewerNotes}</span>
                              </div>
                            </div>
                          )}
                          
                          {post.rejectionReason && (
                            <div className="mt-2 p-2 bg-red-50 text-red-700 rounded text-xs">
                              <div className="flex items-start">
                                <AlertCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                                <span><strong>Rejection Reason:</strong> {post.rejectionReason}</span>
                              </div>
                            </div>
                          )}
                          
                          {/* Debug info in development */}
                          {process.env.NODE_ENV === 'development' && (
                            <div className="mt-2 text-xs text-gray-500">
                              ID: {postIdValue} | 
                              Type: {post.type} | 
                              Approval Status: {post.approvalStatus} | 
                              Scheduled: {isScheduled ? 'Yes' : 'No'} |
                              Schedule Approved: {post.scheduleApproved ? 'Yes' : 'No'}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handlePreview(post)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Preview Post"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        
                        {post.approvalStatus === 'changes_requested' && (
                          <button
                            onClick={() => window.location.href = `/admin/posts/edit/${postIdValue}`}
                            className="px-3 py-1.5 text-sm bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
                          >
                            Make Changes
                          </button>
                        )}
                        
                        {/* {isScheduled && !post.scheduleApproved && (
                          <span className="text-xs text-gray-500 italic">
                            Awaiting schedule approval
                          </span>
                        )} */}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || loading}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || loading}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Debug Panel (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg border border-gray-300">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Debug Info</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <div>User: {user?.name}</div>
              <div>Role: {user?.role}</div>
              <div>User ID: {user?._id}</div>
              <div>API URL: {baseURL}</div>
              <div>Total Submissions: {totalPosts}</div>
              <div>Current Page: {currentPage}</div>
              <div>Filter Status: {filterStatus}</div>
              <div>Search Query: {searchQuery}</div>
              <div>Loaded Posts: {myPosts.length}</div>
              <div className="mt-2">
                <strong>Submission Types:</strong>
                <ul className="ml-4 mt-1">
                  <li>AdminPosts: {myPosts.filter(p => p.type === 'approval').length}</li>
                  <li>Posts: {myPosts.filter(p => p.type === 'post').length}</li>
                  <li>Scheduled: {myPosts.filter(p => p.isScheduled || p.isScheduledPost).length}</li>
                  <li>Schedule Pending: {myPosts.filter(p => 
                    (p.isScheduled || p.isScheduledPost) && !p.scheduleApproved
                  ).length}</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyApprovals;