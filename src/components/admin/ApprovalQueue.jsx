import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  MessageSquare, 
  Clock, 
  Loader2, 
  AlertCircle, 
  FileText, 
  RefreshCw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Tag,
  FileEdit,
  AlertTriangle,
  CheckSquare,
  XSquare,
  Send
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ApprovalQueue = () => {
  const [adminPosts, setAdminPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedPost, setSelectedPost] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [notes, setNotes] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();
  
  const itemsPerPage = 10;

  useEffect(() => {
    fetchAdminPosts();
  }, [currentPage]);

  const fetchAdminPosts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${baseURL}/api/approval/posts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch admin posts');
      }

      if (data.success) {
        let filteredPosts = data.data || [];
        
        // Apply filters
        if (filterStatus !== 'all') {
          filteredPosts = filteredPosts.filter(post => 
            post.approvalStatus === filterStatus
          );
        }
        
        if (filterType !== 'all') {
          filteredPosts = filteredPosts.filter(post => 
            filterType === 'update' ? post.isUpdateRequest : !post.isUpdateRequest
          );
        }
        
        // Apply search
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredPosts = filteredPosts.filter(post => 
            post.title.toLowerCase().includes(query) || 
            (post.authorId?.name || post.author || '').toLowerCase().includes(query) ||
            (post.category || '').toLowerCase().includes(query)
          );
        }
        
        // Calculate pagination
        const totalFiltered = filteredPosts.length;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedPosts = filteredPosts.slice(startIndex, endIndex);
        
        setAdminPosts(paginatedPosts);
        setTotalPages(Math.ceil(totalFiltered / itemsPerPage));
        setTotalPosts(totalFiltered);
      } else {
        throw new Error(data.message || 'Failed to load admin posts');
      }
    } catch (error) {
      console.error('Error fetching admin posts:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load admin posts',
        variant: 'destructive'
      });
      setAdminPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (postId) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${baseURL}/api/approval/posts/${postId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to approve post');
      }

      if (data.success) {
        toast({
          title: 'Post Approved',
          description: 'The post has been approved and published'
        });
        fetchAdminPosts();
        setSelectedPost(null);
        setActionType(null);
        setNotes('');
        setShowConfirmDialog(false);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve post',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (postId) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${baseURL}/api/approval/posts/${postId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: notes })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to reject post');
      }

      if (data.success) {
        toast({
          title: 'Post Rejected',
          description: 'The post has been rejected'
        });
        fetchAdminPosts();
        setSelectedPost(null);
        setActionType(null);
        setNotes('');
        setShowConfirmDialog(false);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject post',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestChanges = async (postId) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${baseURL}/api/approval/posts/${postId}/request-changes`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to request changes');
      }

      if (data.success) {
        toast({
          title: 'Changes Requested',
          description: 'The author has been notified to make changes'
        });
        fetchAdminPosts();
        setSelectedPost(null);
        setActionType(null);
        setNotes('');
        setShowConfirmDialog(false);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to request changes',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getApprovalStatusBadge = (status) => {
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
      }
    };

    const config = statusConfig[status] || statusConfig.pending_review;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color} border`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getPostTypeBadge = (isUpdateRequest) => {
    if (isUpdateRequest) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
          <FileEdit className="h-3 w-3 mr-1" />
          Update Request
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
        <FileText className="h-3 w-3 mr-1" />
        New Post
      </span>
    );
  };

  const formatDate = (dateString) => {
    try {
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

  const handleFilterApply = () => {
    setCurrentPage(1);
    fetchAdminPosts();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setFilterType('all');
    setCurrentPage(1);
    fetchAdminPosts();
  };

  const openConfirmDialog = (post, type) => {
    setSelectedPost(post);
    setActionType(type);
    setShowConfirmDialog(true);
  };

  const handleAction = async () => {
    if (!selectedPost || !actionType) return;

    if (actionType === 'approve') {
      await handleApprove(selectedPost._id);
    } else if (actionType === 'reject') {
      if (!notes.trim()) {
        toast({
          title: 'Error',
          description: 'Please provide a rejection reason',
          variant: 'destructive'
        });
        return;
      }
      await handleReject(selectedPost._id);
    } else if (actionType === 'request_changes') {
      if (!notes.trim()) {
        toast({
          title: 'Error',
          description: 'Please provide feedback for changes',
          variant: 'destructive'
        });
        return;
      }
      await handleRequestChanges(selectedPost._id);
    }
  };

  if (loading && currentPage === 1) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading approval queue...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Approval Queue</h1>
              <p className="text-gray-600 mt-2">Review and approve posts submitted by admins</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                <CheckSquare className="h-3 w-3 mr-1" />
                Pending: {totalPosts}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Card Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Posts Pending Approval</h2>
                <p className="text-sm text-gray-600">Review, approve, or request changes for posts</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Review Required
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
                  <option value="changes_requested">Changes Requested</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="new">New Posts</option>
                  <option value="update">Update Requests</option>
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
                
                <button
                  onClick={fetchAdminPosts}
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
                Showing {adminPosts.length} of {totalPosts} posts
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
            {adminPosts.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery || filterStatus !== 'all' || filterType !== 'all'
                    ? 'No matching posts found'
                    : 'No posts pending approval'
                  }
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {searchQuery || filterStatus !== 'all' || filterType !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'All posts have been reviewed'
                  }
                </p>
              </div>
            ) : (
              adminPosts.map((post) => (
                <div key={post._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{post.title}</h3>
                          {getApprovalStatusBadge(post.approvalStatus)}
                          {getPostTypeBadge(post.isUpdateRequest)}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-gray-600 text-sm mb-1">
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-2" />
                            {post.authorId?.name || post.author}
                          </div>
                          
                          {post.category && (
                            <div className="flex items-center">
                              <Tag className="h-3 w-3 mr-2" />
                              {post.category}
                            </div>
                          )}
                          
                          {post.version && (
                            <div className="flex items-center">
                              <span className="font-medium">Version:</span> {post.version}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center text-gray-500 text-sm">
                          <Calendar className="h-3 w-3 mr-2" />
                          Submitted {formatDate(post.createdAt)}
                        </div>
                        
                        {post.shortTitle && (
                          <p className="text-gray-600 text-sm mt-1">{post.shortTitle}</p>
                        )}
                        
                        {(post.reviewerNotes || post.rejectionReason) && (
                          <div className={`mt-2 p-2 rounded text-xs ${post.rejectionReason ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                            <div className="flex items-start">
                              <AlertCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                              <span>{post.rejectionReason || post.reviewerNotes}</span>
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
                      
                      {post.approvalStatus === 'pending_review' && (
                        <>
                          <button
                            onClick={() => openConfirmDialog(post, 'approve')}
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Approve Post"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                          
                          <button
                            onClick={() => openConfirmDialog(post, 'request_changes')}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Request Changes"
                          >
                            <MessageSquare className="h-5 w-5" />
                          </button>
                          
                          <button
                            onClick={() => openConfirmDialog(post, 'reject')}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject Post"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        </>
                      )}
                      
                      {post.approvalStatus === 'changes_requested' && (
                        <button
                          onClick={() => openConfirmDialog(post, 'approve')}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Approve Changes"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
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

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex items-center mb-4">
                <AlertCircle className="h-6 w-6 text-orange-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {actionType === 'approve' && 'Approve Post'}
                  {actionType === 'reject' && 'Reject Post'}
                  {actionType === 'request_changes' && 'Request Changes'}
                </h3>
              </div>
              
              <p className="text-gray-600 mb-4">
                {actionType === 'approve' && (
                  `Are you sure you want to approve "${selectedPost?.title}"?`
                )}
                {actionType === 'reject' && (
                  `Are you sure you want to reject "${selectedPost?.title}"?`
                )}
                {actionType === 'request_changes' && (
                  `Are you sure you want to request changes for "${selectedPost?.title}"?`
                )}
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {actionType === 'approve' ? 'Notes (optional)' :
                   actionType === 'reject' ? 'Rejection Reason *' :
                   'Feedback for Changes *'}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
                  placeholder={actionType === 'approve' 
                    ? 'Add any notes about this approval...' 
                    : actionType === 'reject'
                    ? 'Why is this post being rejected?'
                    : 'What changes need to be made?'}
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowConfirmDialog(false);
                    setSelectedPost(null);
                    setActionType(null);
                    setNotes('');
                  }}
                  disabled={actionLoading}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  disabled={actionLoading}
                  className={`px-4 py-2.5 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 ${
                    actionType === 'approve'
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                      : actionType === 'reject'
                      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                      : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                  }`}
                >
                  {actionLoading ? (
                    <span className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </span>
                  ) : (
                    <>
                      {actionType === 'approve' && 'Approve'}
                      {actionType === 'reject' && 'Reject'}
                      {actionType === 'request_changes' && 'Request Changes'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ApprovalQueue;