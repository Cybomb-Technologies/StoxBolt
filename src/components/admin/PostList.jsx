import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Edit, Trash2, Eye, Search, FileUp, Filter, Loader2 } from 'lucide-react';
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
import { Link } from 'react-router-dom';
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PostList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [deletePost, setDeletePost] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
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
      if (!token) {
        throw new Error('No authentication token found');
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
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch posts');
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
      toast({
        title: 'Error',
        description: error.message || 'Failed to load posts',
        variant: 'destructive'
      });
      setPosts([]);
      setTotalPages(1);
      setTotalPosts(0);
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
    // Store post in localStorage for preview
    localStorage.setItem('postPreview', JSON.stringify(post));
    window.open(`/post/preview`, '_blank');
  };

  // Check if user can edit a specific post
  const canEditPost = (post) => {
    if (!user) return false;
    
    // Superadmin can edit all posts
    if (user.role === 'superadmin') return true;
    
    // Admin can only edit their own posts
    if (user.role === 'admin') {
      return post.authorId?._id === user._id || post.authorId?.toString() === user._id;
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

          <div className="flex flex-wrap gap-2">
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
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing {posts.length} of {totalPosts} posts
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
          <p className="text-gray-600">No posts found</p>
          <p className="text-sm text-gray-500 mt-2">Try changing your filters or create a new post</p>
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