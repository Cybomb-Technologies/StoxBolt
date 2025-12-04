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
  Filter
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const MyApprovals = () => {
  const [myPosts, setMyPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const { toast } = useToast();

  const itemsPerPage = 10;

  useEffect(() => {
    fetchMyPosts();
  }, [currentPage]);

  const fetchMyPosts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${baseURL}/api/approval/posts/my-posts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch your posts');
      }

      if (data.success) {
        let filteredPosts = data.data || [];
        
        // Apply filters
        if (filterStatus !== 'all') {
          filteredPosts = filteredPosts.filter(post => 
            post.approvalStatus === filterStatus
          );
        }
        
        // Apply search
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredPosts = filteredPosts.filter(post => 
            post.title.toLowerCase().includes(query) || 
            (post.category || '').toLowerCase().includes(query)
          );
        }
        
        // Calculate pagination
        const totalFiltered = filteredPosts.length;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedPosts = filteredPosts.slice(startIndex, endIndex);
        
        setMyPosts(paginatedPosts);
        setTotalPages(Math.ceil(totalFiltered / itemsPerPage));
        setTotalPosts(totalFiltered);
      } else {
        throw new Error(data.message || 'Failed to load your posts');
      }
    } catch (error) {
      console.error('Error fetching your posts:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load your posts',
        variant: 'destructive'
      });
      setMyPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
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
    fetchMyPosts();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setCurrentPage(1);
    fetchMyPosts();
  };

  if (loading && currentPage === 1) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your submissions...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">My Submissions</h1>
              <p className="text-gray-600 mt-2">Track your posts and approval requests</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                <AlertCircle className="h-3 w-3 mr-1" />
                Total: {totalPosts}
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
                <h2 className="text-lg font-semibold text-gray-900">Your Posts</h2>
                <p className="text-sm text-gray-600">Review status of your submitted posts</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <User className="h-3 w-3 mr-1" />
                  Your Submissions
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
                  placeholder="Search by title or category..."
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
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="changes_requested">Changes Requested</option>
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
                  onClick={fetchMyPosts}
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
                Showing {myPosts.length} of {totalPosts} posts
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
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery || filterStatus !== 'all'
                    ? 'No matching posts found'
                    : 'No submissions yet'
                  }
                </h3>
                <p className="text-gray-600 max-w-md mx-auto mb-6">
                  {searchQuery || filterStatus !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Submit your first post for approval'
                  }
                </p>
              </div>
            ) : (
              myPosts.map((post) => (
                <div key={post._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-6 w-6 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{post.title}</h3>
                          {getStatusBadge(post.approvalStatus)}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-gray-600 text-sm mb-1">
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
                          
                          {post.isUpdateRequest && (
                            <div className="flex items-center">
                              <span className="font-medium">Type:</span> Update Request
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center text-gray-500 text-sm">
                          <Calendar className="h-3 w-3 mr-2" />
                          Submitted {formatDate(post.createdAt)}
                        </div>
                        
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
                      
                      {post.approvalStatus === 'changes_requested' && (
                        <button
                          onClick={() => window.location.href = `/admin/posts/edit/${post._id}`}
                          className="px-3 py-1.5 text-sm bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
                        >
                          Make Changes
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
    </div>
  );
};

export default MyApprovals;