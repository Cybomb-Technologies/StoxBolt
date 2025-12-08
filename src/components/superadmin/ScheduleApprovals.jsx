
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  User, 
  Loader2,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Tag,
  AlertTriangle,
  CheckSquare,
  AlertCircle,
  FileText,
  Database,
  ServerOff,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ScheduleApprovals = () => {
  const [pendingPosts, setPendingPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [error, setError] = useState(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const itemsPerPage = 10;

  useEffect(() => {
    if (user?.role === 'superadmin') {
      fetchPendingApprovals();
    } else if (user) {
      setError('Access Denied: Only superadmin can view schedule approvals');
      setLoading(false);
    }
  }, [user, currentPage]);

 // In ScheduleApprovals.jsx - Update the fetchPendingApprovals function
const fetchPendingApprovals = async () => {
  setLoading(true);
  setError(null);
  try {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      throw new Error('No authentication adminToken found');
    }

    console.log('Fetching pending approvals from:', `${baseURL}/api/posts/pending-schedule`);
    
    const response = await fetch(`${baseURL}/api/posts/pending-schedule`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include' // Add this if using cookies
    });

    console.log('Response status:', response.status);
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text);
      throw new Error(`Server returned non-JSON response: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (!response.ok) {
      // Check for specific error statuses
      if (response.status === 401) {
        throw new Error('Session expired. Please log in again.');
      } else if (response.status === 403) {
        throw new Error('Access denied. Only superadmin can view schedule approvals.');
      } else if (response.status === 404) {
        throw new Error('Endpoint not found. Please check the API URL.');
      } else if (response.status === 500) {
        // Server error - use the error message from response if available
        const errorMsg = data.message || data.error || `Server error: ${response.status}`;
        throw new Error(errorMsg);
      } else {
        throw new Error(data.message || `Server error: ${response.status}`);
      }
    }

    if (data.success) {
      let filteredPosts = data.data || [];
      
      console.log('Received posts:', filteredPosts.length);
      
      // Apply search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredPosts = filteredPosts.filter(post => 
          post.title?.toLowerCase().includes(query) || 
          (post.authorId?.name || post.author || '').toLowerCase().includes(query) ||
          (post.categoryName || post.category?.name || '').toLowerCase().includes(query)
        );
      }
      
      // Calculate pagination
      const totalFiltered = filteredPosts.length;
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedPosts = filteredPosts.slice(startIndex, endIndex);
      
      setPendingPosts(paginatedPosts);
      setTotalPages(Math.ceil(totalFiltered / itemsPerPage));
      setTotalPosts(totalFiltered);
      
      // Show success toast if we found posts
      if (filteredPosts.length > 0) {
        toast({
          title: 'Success',
          description: `Found ${filteredPosts.length} posts pending approval`,
          variant: 'default'
        });
      }
    } else {
      // Handle case where success is false but response is 200
      throw new Error(data.message || 'Failed to fetch pending approvals');
    }
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    console.error('Error details:', error.message, error.stack);
    
    // More specific error messages
    let userMessage = error.message || 'Failed to load pending approvals';
    
    if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
      userMessage = 'Network error. Please check your internet connection and server status.';
    } else if (error.message.includes('500')) {
      userMessage = 'Server error. The backend service encountered an issue.';
    } else if (error.message.includes('non-JSON response')) {
      userMessage = 'Server returned an invalid response. Check if the backend is running properly.';
    }
    
    setError(userMessage);
    
    toast({
      title: 'Error',
      description: userMessage,
      variant: 'destructive',
      duration: 5000
    });
    
    setPendingPosts([]);
  } finally {
    setLoading(false);
  }
};

  const handleApprove = async (post) => {
    // Use approvalId if available (for AdminPosts), otherwise use _id
    const postId = post.approvalId || post._id;
    
    // Validate postId
    if (!postId) {
      console.error('No post ID found:', post);
      toast({
        title: 'Error',
        description: 'Invalid post ID',
        variant: 'destructive'
      });
      return;
    }
    
    setProcessingId(postId);
    
    try {
      const adminToken = localStorage.getItem('adminToken');
      console.log('Approving schedule for post:', postId, 'Title:', post.title);
      
      const response = await fetch(`${baseURL}/api/posts/${postId}/approve-schedule`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('Approve response:', data);
      
      if (!response.ok) {
        if (response.status === 400 && data.message?.includes('already')) {
          toast({
            title: 'Already Processed',
            description: data.message || 'This schedule was already processed',
            variant: 'default'
          });
          
          setPendingPosts(prevPosts => prevPosts.filter(p => p._id !== post._id));
          setTotalPosts(prev => prev - 1);
        } else {
          throw new Error(data.message || 'Failed to approve schedule');
        }
      } else {
        toast({
          title: 'Schedule Approved',
          description: 'Post schedule has been approved successfully',
          variant: 'default'
        });
        
        setPendingPosts(prevPosts => prevPosts.filter(p => p._id !== post._id));
        setTotalPosts(prev => prev - 1);
      }
    } catch (error) {
      console.error('Approve error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve schedule',
        variant: 'destructive'
      });
    } finally {
      setProcessingId(null);
    }
  };
// In the handleReject function, add better refresh logic:
const handleReject = async (post) => {
  const reason = window.prompt('Please enter rejection reason:');
  if (!reason || reason.trim() === '') {
    toast({
      title: 'Cancelled',
      description: 'Rejection was cancelled or reason was empty',
      variant: 'default'
    });
    return;
  }
  
  const postId = post.approvalId || post._id;
  
  setProcessingId(postId);
  try {
    const adminToken = localStorage.getItem('adminToken');
    
    const response = await fetch(`${baseURL}/api/posts/${postId}/reject-schedule`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ rejectionReason: reason })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `Failed to reject schedule (Status: ${response.status})`);
    }
    
    // CRITICAL FIX: Force complete refresh of the list
    toast({
      title: 'Schedule Rejected',
      description: 'Post schedule has been rejected and moved to drafts',
      variant: 'default'
    });
    
    // OPTION 1: Immediate filter from local state
    setPendingPosts(prevPosts => prevPosts.filter(p => {
      // Remove based on all possible identifiers
      return !(
        p._id === post._id || 
        p.approvalId === postId ||
        (post.adminPostId && p.adminPostId === post.adminPostId)
      );
    }));
    
    // OPTION 2: Force complete data refresh after 1 second
    setTimeout(() => {
      fetchPendingApprovals();
    }, 1000);
    
    // Also update total count
    setTotalPosts(prev => Math.max(0, prev - 1));
    
  } catch (error) {
    console.error('Reject error:', error);
    
    toast({
      title: 'Error',
      description: error.message || 'Failed to reject schedule',
      variant: 'destructive',
      duration: 5000
    });
  } finally {
    setProcessingId(null);
  }
};

  const handlePreview = (post) => {
    const previewData = {
      ...post,
      _id: post._id || 'preview',
      status: 'published',
      createdAt: post.createdAt || new Date().toISOString(),
    };
    
    localStorage.setItem('postPreview', JSON.stringify(previewData));
    window.open(`/post/preview`, '_blank');
  };

  const formatDateTime = (dateString) => {
    try {
      if (!dateString) return 'Not scheduled';
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
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

  const handleFilterApply = () => {
    setCurrentPage(1);
    fetchPendingApprovals();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setCurrentPage(1);
    fetchPendingApprovals();
  };

  const handleRefresh = () => {
    fetchPendingApprovals();
  };

  // Error states
  if (error && error.includes('Access denied')) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading && currentPage === 1) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading schedule approvals...</p>
          <p className="text-sm text-gray-500 mt-2">Checking server connection</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Schedule Approvals</h1>
              <p className="text-gray-600 mt-2">Review and approve scheduled posts from admins</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                <CheckSquare className="h-3 w-3 mr-1" />
                Pending: {totalPosts}
              </span>
              <Button
                onClick={handleRefresh}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && !error.includes('Access denied') && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                  <p className="mt-1 text-xs">
                    Check if: 
                    1. Server is running on {baseURL}
                    2. Database is connected
                    3. You have superadmin privileges
                  </p>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    onClick={handleRefresh}
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                  <Button
                    onClick={() => {
                      console.log('Debug info:', {
                        baseURL,
                        userRole: user?.role,
                        adminTokenExists: !!localStorage.getItem('adminToken')
                      });
                      toast({
                        title: 'Debug Info',
                        description: 'Check browser console for details',
                        variant: 'default'
                      });
                    }}
                    size="sm"
                    variant="outline"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Debug
                  </Button>
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
                <h2 className="text-lg font-semibold text-gray-900">Scheduled Posts Pending Approval</h2>
                <p className="text-sm text-gray-600">Review, approve, or reject scheduled posts</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  <Clock className="h-3 w-3 mr-1" />
                  Scheduled Posts
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
                  placeholder="Search by title, author, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleFilterApply()}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleFilterApply}
                  className="px-4 py-2.5 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
                >
                  Apply Search
                </button>
                
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Clear
                </button>
                
                <button
                  onClick={fetchPendingApprovals}
                  disabled={loading}
                  className="px-3 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            
            {/* Results count */}
            <div className="mt-4 flex items-center justify-between text-sm">
              <p className="text-gray-600">
                Showing {pendingPosts.length} of {totalPosts} scheduled posts
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
            {pendingPosts.length === 0 ? (
              <div className="text-center py-12">
                {error ? (
                  <>
                    <ServerOff className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Connection Error
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      {error}
                    </p>
                  </>
                ) : searchQuery ? (
                  <>
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No matching scheduled posts found
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Try adjusting your search
                    </p>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No scheduled posts pending approval
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      All scheduled posts have been approved
                    </p>
                  </>
                )}
              </div>
            ) : (
              pendingPosts.map((post) => (
                <motion.div 
                  key={post._id} 
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{post.title || 'Untitled Post'}</h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                            <Clock className="h-3 w-3 mr-1" />
                            Scheduled
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Pending Approval
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-gray-600 text-sm mb-1">
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-2" />
                            {post.authorId?.name || post.author || 'Unknown Author'}
                          </div>
                          
                          {post.category && (
                            <div className="flex items-center">
                              <Tag className="h-3 w-3 mr-2" />
                              {post.category}
                            </div>
                          )}
                          
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-2" />
                            Scheduled: {formatDateTime(post.publishDateTime)}
                          </div>
                        </div>
                        
                        {post.shortTitle && (
                          <p className="text-gray-600 text-sm mt-1">{post.shortTitle}</p>
                        )}
                        
                        {post.rejectionReason && (
                          <div className="mt-2 p-2 rounded text-xs bg-red-50 text-red-700">
                            <div className="flex items-start">
                              <AlertCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                              <span>Rejection Reason: {post.rejectionReason}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePreview(post)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Preview Post"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      
                      <button
                        onClick={() => handleReject(post)}
                        disabled={processingId === (post.approvalId || post._id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Reject Schedule"
                      >
                        {processingId === (post.approvalId || post._id) ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <ThumbsDown className="h-5 w-5" />
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleApprove(post)}
                        disabled={processingId === (post.approvalId || post._id)}
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Approve Schedule"
                      >
                        {processingId === (post.approvalId || post._id) ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <ThumbsUp className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
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
                    disabled={currentPage === 1}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
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
      </div>
    </div>
  );
};

export default ScheduleApprovals;