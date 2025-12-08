import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Edit, Trash2, Eye, Search, FileUp, Filter, Loader2, Plus, Info, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Send } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PostList = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [deletePost, setDeletePost] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const { toast } = useToast();
  const { user, hasCRUDAccess } = useAuth();

  // Fetch categories from backend
  const fetchCategories = async () => {
    try {
      const adminadminToken = localStorage.getItem('adminadminToken');
      
      if (!adminadminToken) {
        console.warn('No adminadminToken found for fetching categories');
        return;
      }

      const response = await fetch(`${baseURL}/api/categories`, {
        headers: {
          'Authorization': `Bearer ${adminadminToken}`
        }
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // Transform the categories data for the dropdown
        const formattedCategories = data.data.map(category => ({
          id: category._id,
          name: category.name,
          slug: category.slug
        }));
        setCategories(formattedCategories);
      } else {
        console.error('Failed to fetch categories:', data.message);
        // Fallback to default categories if API fails
        setCategories([
          { id: 'indian', name: 'Indian' },
          { id: 'us', name: 'US' },
          { id: 'global', name: 'Global' },
          { id: 'commodities', name: 'Commodities' },
          { id: 'forex', name: 'Forex' },
          { id: 'crypto', name: 'Crypto' },
          { id: 'ipos', name: 'IPOs' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback to default categories on error
      setCategories([
        { id: 'indian', name: 'Indian' },
        { id: 'us', name: 'US' },
        { id: 'global', name: 'Global' },
        { id: 'commodities', name: 'Commodities' },
        { id: 'forex', name: 'Forex' },
        { id: 'crypto', name: 'Crypto' },
        { id: 'ipos', name: 'IPOs' }
      ]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchPosts();
  }, [currentPage, filterStatus, filterCategory, searchQuery]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      
      if (!adminToken) {
        toast({
          title: 'Authentication Error',
          description: 'No authentication adminToken found. Please log in again.',
          variant: 'destructive'
        });
        return;
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10
      });
      
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterCategory !== 'all') params.append('category', filterCategory);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`${baseURL}/api/posts?${params}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 403) {
          setPosts([]);
          setTotalPages(1);
          setTotalPosts(0);
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to view these posts.',
            variant: 'destructive'
          });
          return;
        }
        throw new Error(data.message || `Failed to fetch posts (${response.status})`);
      }

      if (data.success) {
        setPosts(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotalPosts(data.total || 0);
      } else {
        throw new Error(data.message || 'Failed to load posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      
      if (!error.message.includes('403')) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to load posts',
          variant: 'destructive'
        });
      }
      
      setPosts([]);
      setTotalPages(1);
      setTotalPosts(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      
      if (!adminToken) {
        toast({
          title: 'Authentication Error',
          description: 'Please log in again to perform this action.',
          variant: 'destructive'
        });
        return;
      }

      const response = await fetch(`${baseURL}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete post');
      }

      if (data.success) {
        setPosts((prev) => prev.filter((p) => p._id !== postId));
        setTotalPosts(prev => prev - 1);
        toast({
          title: 'Success',
          description: 'The post has been deleted successfully',
          className: 'bg-green-100 text-green-800 border-green-200'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete post',
        variant: 'destructive'
      });
    }
    setDeletePost(null);
  };

  const handlePublish = async (postId) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      
      if (!adminToken) {
        toast({
          title: 'Authentication Error',
          description: 'Please log in again to perform this action.',
          variant: 'destructive'
        });
        return;
      }

      const response = await fetch(`${baseURL}/api/posts/${postId}/publish`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to publish post');
      }

      if (data.success) {
        toast({
          title: 'Success',
          description: 'The post has been published successfully',
          className: 'bg-green-100 text-green-800 border-green-200'
        });
        fetchPosts(); // Refresh the list
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to publish post',
        variant: 'destructive'
      });
    }
  };

  const handleRequestUpdate = async (postId) => {
    try {
      // Navigate to edit page for update request
      navigate(`/admin/posts/edit/${postId}?updateRequest=true`);
      toast({
        title: 'Update Request',
        description: 'You are now editing in update request mode. Changes will require approval.',
        className: 'bg-blue-100 text-blue-800 border-blue-200'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to request update',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      scheduled: 'bg-yellow-100 text-yellow-700',
      published: 'bg-green-100 text-green-700',
      pending_approval: 'bg-blue-100 text-blue-700',
      archived: 'bg-red-100 text-red-700'
    };
    return colors[status] || colors.draft;
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
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

  const handlePreview = (post) => {
    localStorage.setItem('postPreview', JSON.stringify(post));
    navigate('/admin/preview');
    toast({
      title: 'Preview Mode',
      description: 'You are now previewing the post',
      className: 'bg-blue-100 text-blue-800 border-blue-200'
    });
  };

  // Truncate long text with ellipsis
  const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Get category name by ID
  const getCategoryName = (categoryId) => {
    if (!categoryId || categoryId === 'all') return 'Uncategorized';
    const category = categories.find(cat => cat.id === categoryId || cat._id === categoryId);
    return category ? category.name : 'Uncategorized';
  };

  // Check if user can edit a specific post directly (CRUD access or own draft)
  const canEditPostDirectly = (post) => {
    if (!user) return false;
    
    // Superadmin can edit all posts directly
    if (user.role === 'superadmin') return true;
    
    // Admin with CRUD access can edit their own posts
    if (user.role === 'admin' && hasCRUDAccess) {
      const authorId = post.authorId?._id || post.authorId;
      const isOwnPost = authorId === user._id || authorId?.toString() === user._id;
      return isOwnPost; // Admin with CRUD can edit their own posts regardless of status
    }
    
    // Admin without CRUD access can only edit their own drafts
    if (user.role === 'admin' && !hasCRUDAccess) {
      const authorId = post.authorId?._id || post.authorId;
      const isOwnPost = authorId === user._id || authorId?.toString() === user._id;
      return isOwnPost && post.status === 'draft';
    }
    
    return false;
  };

  // Check if user can request update for a published post
  const canRequestUpdate = (post) => {
    if (!user) return false;
    
    const authorId = post.authorId?._id || post.authorId;
    const isOwnPost = authorId === user._id || authorId?.toString() === user._id;
    
    // Admin without CRUD access can request updates for their own published posts
    if (user.role === 'admin' && !hasCRUDAccess) {
      return isOwnPost && post.status === 'published';
    }
    
    // Admin with CRUD access can edit published posts directly (no need for request)
    if (user.role === 'admin' && hasCRUDAccess) {
      return false; // They edit directly
    }
    
    // Superadmin can edit published posts directly
    if (user.role === 'superadmin') {
      return false; // They edit directly
    }
    
    return false;
  };

  // Check if user can delete a specific post
  const canDeletePost = (post) => {
    if (!user) return false;
    
    // Superadmin can delete any post
    if (user.role === 'superadmin') return true;
    
    // Admin with CRUD access can delete their own posts
    if (user.role === 'admin' && hasCRUDAccess) {
      const authorId = post.authorId?._id || post.authorId;
      const isOwnPost = authorId === user._id || authorId?.toString() === user._id;
      return isOwnPost;
    }
    
    return false;
  };

  // Check if user can publish a specific post
  const canPublishPost = (post) => {
    if (!user) return false;
    
    // Superadmin can publish any draft post
    if (user.role === 'superadmin') {
      return post.status === 'draft' || post.status === 'pending_approval';
    }
    
    // Admin with CRUD access can publish their own draft posts
    if (user.role === 'admin' && hasCRUDAccess) {
      const authorId = post.authorId?._id || post.authorId;
      const isOwnPost = authorId === user._id || authorId?.toString() === user._id;
      return isOwnPost && (post.status === 'draft' || post.status === 'pending_approval');
    }
    
    return false;
  };

  // Determine the new post button route based on user access
  const getNewPostRoute = () => {
    if (user?.role === 'superadmin') {
      return "/admin/posts/new";
    }
    if (user?.role === 'admin') {
      if (hasCRUDAccess) {
        return "/admin/posts/new"; // Direct CRUD access
      } else {
        return "/admin/posts/new-approval"; // Approval system
      }
    }
    return "/admin/posts/new";
  };

  // Get user mode display
  const getUserMode = () => {
    if (user?.role === 'superadmin') return 'Superadmin Mode';
    if (user?.role === 'admin') {
      return hasCRUDAccess ? 'Admin (CRUD Mode)' : 'Admin (Approval Mode)';
    }
    return '';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-2xl shadow-xl p-6"
    >
      {/* Header Section */}
      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search posts by title or content..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none transition-all min-w-[140px]"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="archived">Archived</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setCurrentPage(1);
              }}
              disabled={categoriesLoading}
              className="px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none transition-all min-w-[140px]"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.id || category._id} value={category.id || category._id}>
                  {category.name}
                </option>
              ))}
              {categories.length === 0 && !categoriesLoading && (
                <option value="" disabled>No categories available</option>
              )}
            </select>

            {user && (user.role === 'admin' || user.role === 'superadmin') && (
              <Button
                asChild
                className="bg-orange-600 hover:bg-orange-700 shadow-sm"
              >
                <Link to={getNewPostRoute()}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Post
                </Link>
              </Button>
            )}

            {/* Approval queue button for superadmin */}
            {user?.role === 'superadmin' && (
              <Button
                asChild
                variant="outline"
                className="border-purple-600 text-purple-600 hover:bg-purple-50 shadow-sm"
              >
                <Link to="/admin/approval">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approval Queue
                </Link>
              </Button>
            )}

            {/* My approvals button for admin without CRUD access */}
            {user?.role === 'admin' && !hasCRUDAccess && (
              <Button
                asChild
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50 shadow-sm"
              >
                <Link to="/admin/my-approvals">
                  <Clock className="h-4 w-4 mr-2" />
                  My Submissions
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600">
              Showing <span className="font-semibold">{posts.length}</span> of{' '}
              <span className="font-semibold">{totalPosts}</span> posts
            </span>
            <span className={`px-3 py-1.5 text-xs rounded-full font-medium ${
              user?.role === 'superadmin' 
                ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                : hasCRUDAccess 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-blue-100 text-blue-700 border border-blue-200'
            }`}>
              {getUserMode()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('all');
                setFilterCategory('all');
                setCurrentPage(1);
                toast({
                  title: 'Filters Cleared',
                  description: 'All filters have been reset',
                  className: 'bg-gray-100 text-gray-800 border-gray-200'
                });
              }}
              className="border-gray-300"
            >
              <Filter className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchCategories();
                fetchPosts();
              }}
              disabled={loading || categoriesLoading}
              className="border-gray-300"
            >
              {loading || categoriesLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* User Mode Info Banner */}
      {user?.role === 'admin' && (
        <div className={`mb-6 p-4 rounded-lg border ${
          hasCRUDAccess 
            ? 'bg-green-50 border-green-200' 
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-start">
            <Info className={`h-5 w-5 mr-3 flex-shrink-0 mt-0.5 ${
              hasCRUDAccess ? 'text-green-500' : 'text-blue-500'
            }`} />
            <div className="flex-1">
              <h3 className={`font-semibold mb-1 ${
                hasCRUDAccess ? 'text-green-800' : 'text-blue-800'
              }`}>
                {hasCRUDAccess ? 'CRUD Mode' : 'Approval Mode'}
              </h3>
              <p className={`text-sm ${
                hasCRUDAccess ? 'text-green-600' : 'text-blue-600'
              }`}>
                {hasCRUDAccess 
                  ? '• You can create, edit, publish, and delete your own posts directly\n• Can edit all statuses (draft, scheduled, published)\n• No approval required for your actions\n• Scheduled posts are auto-approved'
                  : '• You can create and edit draft posts directly\n• To publish a post or update a published post, it needs superadmin approval\n• Use the "Request Update" button for published posts\n• Check "My Submissions" for approval status'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Posts Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wider w-[300px] max-w-[300px]">
                <div className="flex items-center">
                  <span className="truncate">Title</span>
                </div>
              </th>
              <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wider w-[120px]">
                Category
              </th>
              <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wider w-[140px]">
                Status
              </th>
              <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wider w-[150px]">
                Author
              </th>
              <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wider w-[160px]">
                Date
              </th>
              <th className="py-4 px-6 text-right font-semibold text-gray-700 text-sm uppercase tracking-wider w-[100px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {posts.map((post) => (
              <tr key={post._id} className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6 w-[300px] max-w-[300px]">
                  <div className="flex flex-col space-y-1">
                    <div className="font-medium text-gray-900 line-clamp-2 min-h-[2.5rem] break-words">
                      {truncateText(post.title, 80)}
                    </div>
                    {post.shortTitle && (
                      <div className="text-sm text-gray-500 line-clamp-1 break-words">
                        {truncateText(post.shortTitle, 60)}
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-4 px-6 w-[120px]">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 truncate max-w-full">
                    {post.category?.name || getCategoryName(post.category)}
                  </span>
                </td>
                <td className="py-4 px-6 w-[140px]">
                  <div className="flex flex-col space-y-1">
                    <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                      {post.status?.replace('_', ' ')?.toUpperCase() || 'Unknown'}
                    </span>
                    {post.lastApprovedBy && post.status === 'published' && (
                      <span className="text-xs text-gray-500 truncate max-w-[120px]">
                        Approved by: {post.lastApprovedBy?.name || 'Superadmin'}
                      </span>
                    )}
                    {post.isScheduled && post.scheduleApproved && (
                      <span className="text-xs text-gray-500">
                        {formatDate(post.publishDateTime)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-4 px-6 w-[150px]">
                  <div className="text-sm text-gray-900 font-medium truncate max-w-[140px]">
                    {post.author || post.authorId?.name || 'Unknown'}
                  </div>
                  {post.authorId?.email && (
                    <div className="text-xs text-gray-500 truncate max-w-[140px]">
                      {post.authorId.email}
                    </div>
                  )}
                </td>
                <td className="py-4 px-6 text-sm text-gray-600 whitespace-nowrap w-[160px]">
                  {formatDate(post.publishDateTime || post.createdAt)}
                </td>
                <td className="py-4 px-6 w-[100px]">
                  <div className="flex items-center justify-end space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(post)}
                      title="Preview Post"
                      className="h-8 w-8 p-0 hover:bg-blue-50"
                    >
                      <Eye className="h-4 w-4 text-gray-500" />
                    </Button>
                    
                    {/* Edit Button - Show if user can edit this post directly */}
                    {canEditPostDirectly(post) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        title="Edit Post"
                        className="h-8 w-8 p-0 hover:bg-green-50"
                      >
                        <Link to={`/admin/posts/edit/${post._id}`}>
                          <Edit className="h-4 w-4 text-gray-500" />
                        </Link>
                      </Button>
                    )}
                    
                    {/* Request Update Button - For published posts when in approval mode */}
                    {canRequestUpdate(post) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRequestUpdate(post._id)}
                        title="Request Update (Needs Approval)"
                        className="h-8 w-8 p-0 hover:bg-yellow-50"
                      >
                        <Send className="h-4 w-4 text-yellow-600" />
                      </Button>
                    )}
                    
                    {/* Publish Button - For draft posts when user has publish rights */}
                    {canPublishPost(post) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePublish(post._id)}
                        title="Publish Post"
                        className="h-8 w-8 p-0 hover:bg-green-50"
                      >
                        <FileUp className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                    
                    {/* Delete Button */}
                    {canDeletePost(post) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletePost(post)}
                        title="Delete Post"
                        className="h-8 w-8 p-0 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {posts.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <Info className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-600 text-lg font-medium mb-2">No posts found</p>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
            {user?.role === 'admin' 
              ? 'Create your first post or check if you have existing posts'
              : 'Try changing your filters or create a new post'}
          </p>
          {user?.role === 'admin' && (
            <>
              <p className="text-sm text-gray-500 mb-6 max-w-lg mx-auto">
                {hasCRUDAccess 
                  ? 'As an admin with CRUD access, you can create and publish posts directly without approval.'
                  : 'As an admin in Approval Mode, you can create draft posts that require superadmin approval before publishing.'}
              </p>
              <Button
                asChild
                className="bg-orange-600 hover:bg-orange-700 shadow-sm"
              >
                <Link to={getNewPostRoute()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Post
                </Link>
              </Button>
            </>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages} • {totalPosts} total posts
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4"
            >
              Previous
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 min-w-[40px] ${
                      currentPage === pageNum ? 'bg-orange-600 hover:bg-orange-700' : ''
                    }`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePost} onOpenChange={() => setDeletePost(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center space-x-3 mb-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <AlertDialogTitle>Delete Post</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-2">
              Are you sure you want to delete the post{" "}
              <span className="font-semibold text-gray-900">
                "{truncateText(deletePost?.title, 50)}"
              </span>
              ? This action cannot be undone and will permanently remove the post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(deletePost?._id)}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete Post
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default PostList;