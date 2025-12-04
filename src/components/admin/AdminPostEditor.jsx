import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Save, Eye, Upload, Loader2, Send, Clock, Calendar } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdminPostEditor = () => {
  const { id } = useParams();
  const location = useLocation();
  const isEditMode = !!id;
  const isUpdateRequest = new URLSearchParams(location.search).get('updateRequest') === 'true';
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
  });
  const [originalPost, setOriginalPost] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [existingImageUrl, setExistingImageUrl] = useState('');
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
    if (isEditMode && isUpdateRequest) {
      fetchOriginalPost();
    } else if (isEditMode) {
      // If it's edit mode but not an update request, fetch the admin post
      fetchAdminPost();
    }
  }, [id]);

  const fetchOriginalPost = async () => {
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

  const fetchAdminPost = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${baseURL}/api/approval/posts/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch admin post');
      }

      const data = await response.json();

      if (data.success) {
        const adminPost = data.data;
        setOriginalPost(adminPost);
        
        // Pre-fill form with admin post data
        setFormData({
          title: adminPost.title || '',
          shortTitle: adminPost.shortTitle || '',
          body: adminPost.body || '',
          category: adminPost.category || 'Indian',
          tags: adminPost.tags?.join(', ') || '',
          region: adminPost.region || 'India',
          author: adminPost.author || user?.name || '',
          publishDateTime: adminPost.publishDateTime
            ? new Date(adminPost.publishDateTime).toISOString().slice(0, 16)
            : '',
          isSponsored: adminPost.isSponsored || false,
          metaTitle: adminPost.metaTitle || '',
          metaDescription: adminPost.metaDescription || '',
          imageUrl: adminPost.imageUrl || '',
        });
        
        if (adminPost.imageUrl) {
          setExistingImageUrl(adminPost.imageUrl);
          setPreviewImage(adminPost.imageUrl);
        }
      }
    } catch (error) {
      console.error('Error fetching admin post:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load post',
        variant: 'destructive',
      });
      navigate('/admin/my-approvals');
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
          postData.scheduleApproved = false; // Admin needs approval
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
      
      if (isUpdateRequest && originalPost) {
        // Submit update request for published post
        const response = await fetch(`${baseURL}/api/approval/posts/${originalPost._id}/request-update`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData),
        });

        const responseData = await response.json();
        
        if (!response.ok) {
          throw new Error(responseData.message || 'Failed to submit update request');
        }

        const isScheduled = postData.isScheduled || false;
        
        toast({
          title: 'Update Request Submitted!',
          description: isScheduled
            ? 'Your scheduled update request has been submitted for superadmin approval'
            : 'Your update request has been submitted for superadmin approval',
        });
        setTimeout(() => {
          navigate('/admin/my-approvals');
        }, 1000);
      } else if (isEditMode) {
        // Update existing admin post
        const response = await fetch(`${baseURL}/api/approval/posts/${id}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData),
        });

        const responseData = await response.json();
        
        if (!response.ok) {
          throw new Error(responseData.message || 'Failed to update post');
        }

        const isScheduled = postData.isScheduled || false;
        
        toast({
          title: 'Post Updated!',
          description: isScheduled
            ? 'Scheduled post updated and resubmitted for approval'
            : 'Post updated and resubmitted for review',
        });
        setTimeout(() => {
          navigate('/admin/my-approvals');
        }, 1000);
      } else {
        // Submit new post for approval
        const response = await fetch(`${baseURL}/api/approval/posts`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData),
        });

        const responseData = await response.json();
        
        if (!response.ok) {
          throw new Error(responseData.message || 'Failed to submit post for approval');
        }

        const isScheduled = postData.isScheduled || false;
        
        toast({
          title: 'Post Submitted for Approval!',
          description: isScheduled
            ? 'Your scheduled post has been submitted for superadmin approval'
            : 'Your post has been submitted for superadmin approval',
        });
        setTimeout(() => {
          navigate('/admin/my-approvals');
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
            {isUpdateRequest ? 'Request Post Update' : (isEditMode ? 'Edit Post' : 'Create New Post')}
          </h2>
          <p className="text-gray-600 mt-1">
            {isUpdateRequest 
              ? 'Request changes to a published post (requires superadmin approval)'
              : isEditMode
                ? 'Edit your submitted post'
                : 'Create a new post (requires superadmin approval)'}
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

      {isUpdateRequest && originalPost && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-yellow-500 mr-2" />
            <span className="font-medium text-yellow-800">Update Request</span>
          </div>
          <p className="text-sm text-yellow-600 mt-1">
            You are requesting updates to: <strong>{originalPost.title}</strong>
          </p>
          <p className="text-xs text-yellow-500 mt-2">
            Note: Changes will only take effect after superadmin approval
          </p>
        </div>
      )}

      {isFutureDate && (
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-purple-500 mr-2" />
            <span className="font-medium text-purple-800">Scheduled Post</span>
          </div>
          <p className="text-sm text-purple-600 mt-1">
            This post will be scheduled for {new Date(formData.publishDateTime).toLocaleString()}
          </p>
          <p className="text-xs text-purple-500 mt-2">
            Note: Scheduled posts require superadmin approval
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
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="publishDateTime">Publish Date & Time</Label>
              {isFutureDate && (
                <span className="text-xs text-purple-600 font-medium flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  Scheduled post
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
            />
            {isFutureDate && (
              <p className="text-xs text-gray-500 mt-1">
                Post will be scheduled and require superadmin approval
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
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('image').click()}
                className="w-full"
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
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(isUpdateRequest || isEditMode ? '/admin/my-approvals' : '/admin/posts/list')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isFutureDate ? 'Scheduling...' : 'Submitting...'}
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {isFutureDate 
                  ? 'Schedule for Approval'
                  : isUpdateRequest 
                    ? 'Submit Update Request' 
                    : isEditMode
                      ? 'Update Post'
                      : 'Submit for Approval'}
              </>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default AdminPostEditor;