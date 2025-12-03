import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Edit, Trash2, Eye, Search, FileUp, Filter, Loader2, Plus, Info } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [deletePost, setDeletePost] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [debugInfo, setDebugInfo] = useState(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const categories = ['all', 'Indian', 'US', 'Global', 'Commodities', 'Forex', 'Crypto', 'IPOs'];

  useEffect(() => {
    fetchPosts();
  }, [currentPage, filterStatus, filterCategory, searchQuery]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      if (!userData) {
        throw new Error('User data not found');
      }

      // Debug: Log user info
      const parsedUser = JSON.parse(userData);
      console.log('Current user:', parsedUser);
      console.log('User role:', parsedUser.role);
      console.log('User ID:', parsedUser._id);

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10
      });
      
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterCategory !== 'all') params.append('category', filterCategory);
      if (searchQuery) params.append('search', searchQuery);

      console.log('Fetching posts with params:', params.toString());

      const response = await fetch(`${baseURL}/api/posts?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      console.log('Posts API response status:', response.status);
      console.log('Posts API response data:', data);

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 403) {
          // Admin trying to access posts but none exist
          setPosts([]);
          setTotalPages(1);
          setTotalPosts(0);
          setDebugInfo({
            message: 'Admin has no posts yet or access denied',
            userRole: parsedUser.role,
            userId: parsedUser._id
          });
          return;
        }
        throw new Error(data.message || `Failed to fetch posts (${response.status})`);
      }

      if (data.success) {
        setPosts(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotalPosts(data.total || 0);
        setDebugInfo({
          message: 'Successfully loaded posts',
          userRole: parsedUser.role,
          userId: parsedUser._id,
          count: data.data?.length || 0
        });
      } else {
        throw new Error(data.message || 'Failed to load posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      
      // Don't show error toast for empty admin posts
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
      setDebugInfo({
        message: error.message,
        error: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
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
        setPosts((prev) => prev.filter((p) => p._id !== postId));
        setTotalPosts(prev => prev - 1);
        toast({
          title: 'Post Deleted',
          description: 'The post has been deleted successfully'
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
          description: 'The post has been published successfully'
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

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      scheduled: 'bg-yellow-100 text-yellow-700',
      published: 'bg-green-100 text-green-700',
      archived: 'bg-red-100 text-red-700'
    };
    return colors[status] || colors.draft;
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handlePreview = (post) => {
    // Store post data in localStorage for preview component
    localStorage.setItem('postPreview', JSON.stringify(post));
    
    // Navigate to the admin preview page within the same layout
    navigate('/admin/preview');
  };

  // Check if user can edit a specific post
  const canEditPost = (post) => {
    if (!user) return false;
    
    // Superadmin can edit all posts
    if (user.role === 'superadmin') return true;
    
    // Admin can only edit their own posts
    if (user.role === 'admin') {
      // Check both possible formats of authorId
      const authorId = post.authorId?._id || post.authorId;
      return authorId === user._id || authorId?.toString() === user._id;
    }
    
    return false;
  };

  // Check if user can delete a specific post
  const canDeletePost = (post) => {
    if (!user) return false;
    
    // Only superadmin can delete posts
    return user.role === 'superadmin';
  };

  // Check if user can publish a specific post
  const canPublishPost = (post) => {
    if (!user) return false;
    
    // Only superadmin can publish posts
    // And only if post is not already published
    return user.role === 'superadmin' && post.status !== 'published';
  };

  // Test API connection
  const testAPIConnection = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      const response = await fetch(`${baseURL}/api/posts/debug`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      console.log('Debug API response:', data);
      
      toast({
        title: 'Debug Info',
        description: `User: ${data.user?.name || 'Unknown'}, Role: ${data.user?.role || 'Unknown'}`,
        variant: data.success ? 'default' : 'destructive'
      });
      
      return data;
    } catch (error) {
      console.error('Debug API error:', error);
      toast({
        title: 'Debug Error',
        description: error.message,
        variant: 'destructive'
      });
    }
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
      className="bg-white rounded-2xl shadow-xl p-6"
    >
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
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>

            {user && (user.role === 'admin' || user.role === 'superadmin') && (
              <Button
                asChild
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Link to="/admin/posts/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Post
                </Link>
              </Button>
            )}

            {/* Debug button (remove in production) */}
            <Button
              variant="outline"
              size="sm"
              onClick={testAPIConnection}
              title="Debug API Connection"
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing {posts.length} of {totalPosts} posts
            {user && (
              <span className={`ml-2 px-2 py-1 text-xs rounded ${
                user.role === 'admin' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-purple-100 text-purple-700'
              }`}>
                {user.role === 'admin' ? 'Admin View' : 'Superadmin View'}
              </span>
            )}
            {debugInfo && (
              <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                {debugInfo.message}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('all');
                setFilterCategory('all');
                setCurrentPage(1);
              }}
            >
              <Filter className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPosts}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Refresh'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Admin Info Banner */}
      {user?.role === 'admin' && posts.length === 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-800">Admin Post Permissions</h3>
              <p className="text-sm text-blue-600 mt-1">
                As an admin, you can only see and edit posts that you have created. 
                {totalPosts === 0 ? ' You haven\'t created any posts yet.' : ''}
              </p>
              <p className="text-xs text-blue-500 mt-2">
                Note: Only superadmin can publish posts and see all posts.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Title</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Author</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-4 px-4">
                  <div className="font-medium text-gray-900">{post.title}</div>
                  <div className="text-sm text-gray-500 truncate max-w-xs">{post.shortTitle}</div>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-gray-700">{post.category}</span>
                </td>
                <td className="py-4 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(post.status)}`}>
                    {post.status?.charAt(0).toUpperCase() + post.status?.slice(1) || 'Unknown'}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="text-sm text-gray-700">{post.author}</div>
                  {post.authorId?.name && (
                    <div className="text-xs text-gray-500">{post.authorId.name}</div>
                  )}
                  {post.authorId?._id && user?.role === 'admin' && (
                    <div className="text-xs text-gray-400 mt-1">
                      Author ID: {post.authorId._id.toString().substring(0, 8)}...
                    </div>
                  )}
                </td>
                <td className="py-4 px-4 text-sm text-gray-600">
                  {formatDate(post.publishDateTime || post.createdAt)}
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePreview(post)}
                      title="Preview Post"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {/* Edit Button - Show if user can edit this post */}
                    {canEditPost(post) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                      >
                        <Link to={`/admin/posts/edit/${post._id}`} title="Edit Post">
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    
                    {/* Publish Button - Only for superadmin and non-published posts */}
                    {canPublishPost(post) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePublish(post._id)}
                        className="hover:text-green-600"
                        title="Publish Post"
                      >
                        <FileUp className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {/* Delete Button - Only for superadmin */}
                    {canDeletePost(post) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletePost(post)}
                        className="hover:text-red-600"
                        title="Delete Post"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {posts.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="mb-6">
            <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No posts found</p>
            <p className="text-sm text-gray-500 mt-2">
              {user?.role === 'admin' 
                ? 'Create your first post or check if you have existing posts'
                : 'Try changing your filters or create a new post'}
            </p>
          </div>
          {user?.role === 'admin' && (
            <>
              <p className="text-sm text-gray-500 mb-4">
                As an admin, you can only see posts that you have created.
              </p>
              <Button
                asChild
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Link to="/admin/posts/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Post
                </Link>
              </Button>
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testAPIConnection}
                >
                  <Info className="h-4 w-4 mr-2" />
                  Check User Permissions
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6 pt-6 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      <AlertDialog open={!!deletePost} onOpenChange={() => setDeletePost(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the post "{deletePost?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(deletePost._id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default PostList;