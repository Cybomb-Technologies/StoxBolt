import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Save, Eye, Upload, Loader2, Send, Clock, FileCheck, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PostEditor = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    shortTitle: '',
    body: '',
    category: 'Indian',
    tags: '',
    region: 'India',
    author: '',
    publishDateTime: '',
    isSponsored: false,
    metaTitle: '',
    metaDescription: '',
    imageUrl: '',
    status: 'draft'
  });
  const [originalPost, setOriginalPost] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [postStatus, setPostStatus] = useState('draft');
  const [postDetails, setPostDetails] = useState({
    isScheduled: false,
    scheduleApproved: false,
    isScheduledPost: false
  });
  const { toast } = useToast();

  const categories = [
    'Indian',
    'US',
    'Global',
    'Commodities',
    'Forex',
    'Crypto',
    'IPOs',
  ];

  useEffect(() => {
    if (isEditMode) {
      fetchPost();
    }
  }, [id]);

  const fetchPost = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${baseURL}/api/posts/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch post');
      }

      const data = await response.json();

      if (data.success) {
        const post = data.data;
        setOriginalPost(post);
        setPostStatus(post.status || 'draft');
        setPostDetails({
          isScheduled: post.isScheduled || false,
          scheduleApproved: post.scheduleApproved || false,
          isScheduledPost: post.isScheduledPost || false
        });
        
        // Pre-fill form with existing post data
        setFormData({
          title: post.title || '',
          shortTitle: post.shortTitle || '',
          body: post.body || '',
          category: post.category || 'Indian',
          tags: post.tags?.join(', ') || '',
          region: post.region || 'India',
          author: post.author || user?.name || '',
          publishDateTime: post.publishDateTime
            ? new Date(post.publishDateTime).toISOString().slice(0, 16)
            : '',
          isSponsored: post.isSponsored || false,
          metaTitle: post.metaTitle || '',
          metaDescription: post.metaDescription || '',
          imageUrl: post.imageUrl || '',
          status: post.status || 'draft'
        });
        
        if (post.imageUrl) {
          setExistingImageUrl(post.imageUrl);
          setPreviewImage(post.imageUrl);
        }
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load post',
        variant: 'destructive',
      });
      navigate('/admin/posts');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        setPreviewImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const token = localStorage.getItem('token');
      const response = await fetch(`${baseURL}/api/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload error response:', errorText);
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Image Upload Failed',
        description: 'Failed to upload image. Please try again or use a different image.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = existingImageUrl;
      
      // Upload new image if exists
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else if (!imageUrl && isEditMode) {
          imageUrl = existingImageUrl;
        }
      }

      // Prepare post data
      const postData = {
        title: formData.title,
        shortTitle: formData.shortTitle,
        body: formData.body,
        category: formData.category,
        region: formData.region,
        author: formData.author || user?.name || 'Admin',
        isSponsored: formData.isSponsored,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        imageUrl: imageUrl,
        status: formData.status
      };

      // Handle publish date time for scheduling
      if (formData.publishDateTime) {
        postData.publishDateTime = formData.publishDateTime;
        
        // Check if it's a future date (scheduled post)
        const publishDate = new Date(formData.publishDateTime);
        const now = new Date();
        
        if (publishDate > now) {
          // This is a scheduled post
          postData.isScheduled = true;
          
          if (user?.role === 'superadmin') {
            // Superadmin can schedule directly
            postData.scheduleApproved = true;
            postData.status = 'scheduled';
          } else if (user?.role === 'admin') {
            // Admin needs approval for scheduled posts
            postData.scheduleApproved = false;
            postData.status = 'pending_approval';
          }
        }
      }

      // Handle tags
      if (formData.tags.trim()) {
        postData.tags = formData.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean);
      }

      const token = localStorage.getItem('token');
      let url = `${baseURL}/api/posts`;
      let method = 'POST';
      
      if (isEditMode) {
        url = `${baseURL}/api/posts/${id}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || `Failed to ${isEditMode ? 'update' : 'create'} post`);
      }

      const isScheduled = postData.isScheduled || false;
      const needsApproval = isScheduled && user?.role === 'admin' && !postData.scheduleApproved;
      
      toast({
        title: isEditMode ? 'Post Updated!' : 'Post Created!',
        description: needsApproval 
          ? 'Scheduled post created - pending superadmin approval'
          : isScheduled
            ? `Post scheduled for ${new Date(postData.publishDateTime).toLocaleString()}`
            : responseData.message || `Post ${isEditMode ? 'updated' : 'created'} successfully`,
      });

      if (isEditMode) {
        // If editing, stay on the page
        fetchPost(); // Refresh data
      } else {
        // If creating new, navigate to appropriate page
        setTimeout(() => {
          if (needsApproval) {
            navigate('/admin/my-approvals');
          } else {
            navigate('/admin/posts');
          }
        }, 1000);
      }

    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit post',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!id) {
      toast({
        title: 'Error',
        description: 'Post must be saved as draft first',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${baseURL}/api/posts/${id}/submit-for-approval`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to submit for approval');
      }

      const isScheduledPost = responseData.data?.post?.isScheduled || false;
      
      toast({
        title: 'Submitted for Approval!',
        description: isScheduledPost 
          ? 'Scheduled post submitted for superadmin approval'
          : 'Your post has been submitted for superadmin approval',
      });
      
      setTimeout(() => {
        navigate('/admin/posts');
      }, 1000);
    } catch (error) {
      console.error('Submit for approval error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit for approval',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestUpdate = () => {
    navigate(`/admin/post-editor/${id}?updateRequest=true`);
  };

  const handleCancelSchedule = async () => {
    if (!id || !postDetails.isScheduled) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${baseURL}/api/posts/${id}/cancel-schedule`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to cancel schedule');
      }

      toast({
        title: 'Schedule Cancelled!',
        description: 'Post has been moved back to drafts',
      });
      
      // Refresh post data
      fetchPost();
    } catch (error) {
      console.error('Cancel schedule error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel schedule',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    const previewData = {
      ...formData,
      _id: 'preview',
      createdAt: new Date().toISOString(),
      status: 'published',
      tags: formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      imageUrl: previewImage || formData.imageUrl || existingImageUrl,
    };

    localStorage.setItem('postPreview', JSON.stringify(previewData));
    window.open(`/post/preview`, '_blank');
  };

  // Check if publish date is in the future
  const isFutureDate = formData.publishDateTime && new Date(formData.publishDateTime) > new Date();
  
  // Check if user can schedule
  const canSchedule = user?.role === 'superadmin' || (user?.role === 'admin' && postStatus !== 'published');

  if (fetching) {
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
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Post' : 'Create New Post'}
          </h2>
          <p className="text-gray-600 mt-1">
            {user?.role === 'admin' && isEditMode && postStatus === 'published' 
              ? 'This post is published. Use "Request Update" to make changes.' 
              : user?.role === 'admin' 
                ? 'Admins can create drafts and schedule posts (requires approval)'
                : 'Superadmins can create, publish, and schedule posts directly'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={handlePreview}
            disabled={!formData.title || !formData.body}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>

      {/* Status Banners */}
      {user?.role === 'admin' && isEditMode && postStatus === 'published' && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <FileCheck className="h-5 w-5 text-blue-500 mr-2" />
            <span className="font-medium text-blue-800">Published Post</span>
          </div>
          <p className="text-sm text-blue-600 mt-1">
            This post is already published. To make changes, you need to request an update.
          </p>
          <div className="mt-3">
            <Button
              type="button"
              onClick={handleRequestUpdate}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Request Update
            </Button>
          </div>
        </div>
      )}

      {user?.role === 'admin' && isEditMode && postStatus === 'pending_approval' && postDetails.isScheduled && !postDetails.scheduleApproved && (
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-purple-500 mr-2" />
            <span className="font-medium text-purple-800">Schedule Pending Approval</span>
          </div>
          <p className="text-sm text-purple-600 mt-1">
            This scheduled post is waiting for superadmin approval to be published on{' '}
            {new Date(formData.publishDateTime).toLocaleString()}.
          </p>
        </div>
      )}

      {isEditMode && postStatus === 'pending_approval' && !postDetails.isScheduled && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-yellow-500 mr-2" />
            <span className="font-medium text-yellow-800">Pending Approval</span>
          </div>
          <p className="text-sm text-yellow-600 mt-1">
            This draft has been submitted for superadmin approval and cannot be edited.
          </p>
        </div>
      )}

      {isEditMode && postStatus === 'scheduled' && postDetails.scheduleApproved && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <span className="font-medium text-green-800">Scheduled and Approved</span>
          </div>
          <p className="text-sm text-green-600 mt-1">
            This post is scheduled to be published on{' '}
            {new Date(formData.publishDateTime).toLocaleString()}.
          </p>
          {user?.role === 'admin' && (
            <p className="text-xs text-green-500 mt-2">
              Note: Only superadmin can cancel approved scheduled posts.
            </p>
          )}
          {user?.role === 'superadmin' && (
            <div className="mt-3">
              <Button
                type="button"
                onClick={handleCancelSchedule}
                className="bg-red-600 hover:bg-red-700"
                disabled={loading}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Schedule
              </Button>
            </div>
          )}
        </div>
      )}

      {user?.role === 'admin' && isEditMode && postStatus === 'draft' && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <FileCheck className="h-5 w-5 text-green-500 mr-2" />
            <span className="font-medium text-green-800">Draft Mode</span>
          </div>
          <p className="text-sm text-green-600 mt-1">
            You can edit this draft. When ready, submit it for approval.
            {isFutureDate && ' Set a future publish date to schedule this post.'}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="title">Title *</Label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              className="w-full mt-2 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
              required
              disabled={user?.role === 'admin' && postStatus === 'pending_approval'}
            />
          </div>

          <div>
            <Label htmlFor="shortTitle">Short Title *</Label>
            <input
              id="shortTitle"
              name="shortTitle"
              type="text"
              value={formData.shortTitle}
              onChange={handleChange}
              className="w-full mt-2 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
              required
              maxLength={100}
              disabled={user?.role === 'admin' && postStatus === 'pending_approval'}
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="body">Body Text *</Label>
            <textarea
              id="body"
              name="body"
              value={formData.body}
              onChange={handleChange}
              rows={10}
              className="w-full mt-2 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none resize-y"
              required
              disabled={user?.role === 'admin' && postStatus === 'pending_approval'}
            />
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full mt-2 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
              required
              disabled={user?.role === 'admin' && postStatus === 'pending_approval'}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <input
              id="tags"
              name="tags"
              type="text"
              value={formData.tags}
              onChange={handleChange}
              placeholder="tag1, tag2, tag3"
              className="w-full mt-2 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
              disabled={user?.role === 'admin' && postStatus === 'pending_approval'}
            />
          </div>

          <div>
            <Label htmlFor="region">Region</Label>
            <input
              id="region"
              name="region"
              type="text"
              value={formData.region}
              onChange={handleChange}
              className="w-full mt-2 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
              disabled={user?.role === 'admin' && postStatus === 'pending_approval'}
            />
          </div>

          <div>
            <Label htmlFor="author">Author *</Label>
            <input
              id="author"
              name="author"
              type="text"
              value={formData.author}
              onChange={handleChange}
              className="w-full mt-2 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
              required
              disabled={user?.role === 'admin' && postStatus === 'pending_approval'}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="publishDateTime">Publish Date & Time</Label>
              {isFutureDate && canSchedule && (
                <span className="text-xs text-orange-600 font-medium flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {user?.role === 'superadmin' ? 'Will be scheduled' : 'Will require approval'}
                </span>
              )}
            </div>
            <input
              id="publishDateTime"
              name="publishDateTime"
              type="datetime-local"
              value={formData.publishDateTime}
              onChange={handleChange}
              className="w-full mt-2 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
              disabled={user?.role === 'admin' && postStatus === 'pending_approval'}
            />
            {isFutureDate && (
              <p className="text-xs text-gray-500 mt-1">
                {user?.role === 'superadmin' 
                  ? 'Superadmin: Post will be scheduled automatically'
                  : 'Admin: Post will be submitted for schedule approval'}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="image">Featured Image</Label>
            <div className="mt-2">
              <input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                disabled={user?.role === 'admin' && postStatus === 'pending_approval'}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('image').click()}
                className="w-full"
                disabled={user?.role === 'admin' && postStatus === 'pending_approval'}
              >
                <Upload className="h-4 w-4 mr-2" />
                {previewImage || existingImageUrl ? 'Change Image' : 'Upload Image'}
              </Button>
              {(previewImage || existingImageUrl) && (
                <div className="mt-4">
                  <img
                    src={previewImage || existingImageUrl}
                    alt="Preview"
                    className="w-full max-h-64 object-contain rounded-lg border border-gray-200"
                  />
                  {(previewImage && previewImage.startsWith('data:')) && (
                    <p className="text-sm text-gray-500 mt-2">
                      New image selected
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                name="isSponsored"
                checked={formData.isSponsored}
                onChange={handleChange}
                className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                disabled={user?.role === 'admin' && postStatus === 'pending_approval'}
              />
              <span className="text-gray-700 font-medium">
                Sponsored Post
              </span>
            </label>
          </div>

          <div className="md:col-span-2 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              SEO Settings
            </h3>
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="metaTitle">Meta Title</Label>
            <input
              id="metaTitle"
              name="metaTitle"
              type="text"
              value={formData.metaTitle}
              onChange={handleChange}
              placeholder="Leave empty to use post title"
              className="w-full mt-2 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
              disabled={user?.role === 'admin' && postStatus === 'pending_approval'}
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="metaDescription">Meta Description</Label>
            <textarea
              id="metaDescription"
              name="metaDescription"
              value={formData.metaDescription}
              onChange={handleChange}
              rows={3}
              placeholder="Leave empty to use post excerpt"
              className="w-full mt-2 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
              disabled={user?.role === 'admin' && postStatus === 'pending_approval'}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/posts')}
          >
            Cancel
          </Button>
          
          {user?.role === 'admin' && isEditMode && postStatus === 'draft' && !isFutureDate && (
            <Button
              type="button"
              onClick={handleSubmitForApproval}
              className="bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit for Approval
                </>
              )}
            </Button>
          )}
          
          {(user?.role !== 'admin' || (postStatus !== 'published' && postStatus !== 'pending_approval')) && (
            <Button
              type="submit"
              disabled={loading || (user?.role === 'admin' && postStatus === 'pending_approval')}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isFutureDate ? 'Scheduling...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isFutureDate ? 'Schedule Post' : (isEditMode ? 'Update Post' : 'Save as Draft')}
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </motion.div>
  );
};

export default PostEditor;