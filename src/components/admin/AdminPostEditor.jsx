// AdminPostEditor.jsx - Updated version with dynamic categories
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import {
  Save, Eye, Upload, Loader2, Send, Clock, Calendar,
  FileCheck, CheckCircle, AlertCircle, Plus, X
} from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const baseURL = import.meta.env.VITE_API_URL || 'https://api.stoxbolt.com';

const AdminPostEditor = () => {
  const { id } = useParams();
  const location = useLocation();
  const isEditMode = !!id;
  const isUpdateRequest = new URLSearchParams(location.search).get('updateRequest') === 'true';
  const isNewPost = !isEditMode;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    shortTitle: '',
    body: '',
    category: '',
    tags: '',
    region: 'India',
    author: '',
    publishDateTime: '',
    isSponsored: false,
    metaTitle: '',
    metaDescription: '',
    imageUrl: '',
  });
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [originalPost, setOriginalPost] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [fetchingCategories, setFetchingCategories] = useState(true);
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [postStatus, setPostStatus] = useState('draft');
  const [postDetails, setPostDetails] = useState({
    isScheduled: false,
    scheduleApproved: false,
    isScheduledPost: false
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    if (isEditMode && isUpdateRequest) {
      fetchOriginalPost();
    } else if (isEditMode) {
      fetchAdminPost();
    }
  }, [id]);

  useEffect(() => {
    // Set default author name when user is available
    if (user?.name && !formData.author) {
      setFormData(prev => ({
        ...prev,
        author: user.name
      }));
    }
  }, [user]);

  const fetchCategories = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${baseURL}/api/categories`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();

      if (data.success) {
        setCategories(data.data);

        // Set default category if none selected and categories exist
        if (!formData.category && data.data.length > 0 && !isEditMode) {
          setFormData(prev => ({
            ...prev,
            category: data.data[0]._id
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive',
      });
    } finally {
      setFetchingCategories(false);
    }
  };

  const handleAddNewCategory = async () => {
    if (!newCategory.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a category name',
        variant: 'destructive',
      });
      return;
    }

    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${baseURL}/api/categories`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newCategory.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create category');
      }

      // Add new category to the list
      const newCat = data.data;
      setCategories(prev => [...prev, newCat]);

      // Select the new category
      setFormData(prev => ({
        ...prev,
        category: newCat._id
      }));

      // Reset and hide new category input
      setNewCategory('');
      setShowNewCategoryInput(false);

      toast({
        title: 'Success',
        description: 'Category added successfully',
      });
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add category',
        variant: 'destructive',
      });
    }
  };

  // Check if user can schedule directly (superadmin or admin with CRUD access)
  const canScheduleDirectly = user?.role === 'superadmin' || (user?.role === 'admin' && user.hasCRUDAccess);

  // Check if user can publish directly
  const canPublishDirectly = user?.role === 'superadmin' || (user?.role === 'admin' && user.hasCRUDAccess);

  // Check if user needs to use approval system
  const needsApprovalSystem = user?.role === 'admin' && !user.hasCRUDAccess;

  // Check if publish date is in the future
  const isFutureDate = formData.publishDateTime && new Date(formData.publishDateTime) > new Date();

  const fetchOriginalPost = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${baseURL}/api/posts/${id}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
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
          category: post.category?._id || post.category || '',
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
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${baseURL}/api/approval/posts/${id}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch admin post');
      }

      const data = await response.json();

      if (data.success) {
        const adminPost = data.data;
        setOriginalPost(adminPost);
        setPostStatus(adminPost.status || 'draft');

        // Pre-fill form with admin post data
        setFormData({
          title: adminPost.title || '',
          shortTitle: adminPost.shortTitle || '',
          body: adminPost.body || '',
          category: adminPost.category?._id || adminPost.category || '',
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

      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${baseURL}/api/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
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
      // Validate category
      if (!formData.category) {
        throw new Error('Please select a category');
      }

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

      // Handle tags
      if (formData.tags.trim()) {
        postData.tags = formData.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean);
      }

      // Check if publish date is in future
      const publishDate = formData.publishDateTime ? new Date(formData.publishDateTime) : null;
      const now = new Date();
      const isFutureDate = publishDate && publishDate > now;

      console.log('User role:', user?.role);
      console.log('User hasCRUDAccess:', user?.hasCRUDAccess);
      console.log('Is future date?', isFutureDate);
      console.log('Publish date:', publishDate);

      // Determine endpoint and method based on user permissions and post type
      let endpoint = '';
      let method = 'POST';

      if (isFutureDate) {
        // Scheduled post
        postData.publishDateTime = formData.publishDateTime;
        postData.isScheduled = true;

        if (user?.role === 'superadmin' || (user?.role === 'admin' && user.hasCRUDAccess)) {
          // User can schedule directly
          postData.scheduleApproved = true;
          postData.status = 'scheduled';

          if (isUpdateRequest) {
            endpoint = `${baseURL}/api/approval/posts/${originalPost._id}/request-update`;
            method = 'POST';
          } else if (isEditMode) {
            endpoint = `${baseURL}/api/approval/posts/${id}`;
            method = 'PUT';
          } else {
            endpoint = `${baseURL}/api/posts`;
            method = 'POST';
          }
        } else {
          // Needs approval
          postData.scheduleApproved = false;
          postData.status = 'pending_approval';

          if (isUpdateRequest) {
            endpoint = `${baseURL}/api/approval/posts/${originalPost._id}/request-update`;
            method = 'POST';
          } else if (isEditMode) {
            endpoint = `${baseURL}/api/approval/posts/${id}`;
            method = 'PUT';
          } else {
            endpoint = `${baseURL}/api/approval/posts`;
            method = 'POST';
          }
        }
      } else {
        // Not scheduled - immediate publication
        if (publishDate) {
          postData.publishDateTime = formData.publishDateTime;
        }

        if (user?.role === 'superadmin' || (user?.role === 'admin' && user.hasCRUDAccess)) {
          // User can publish directly
          postData.status = 'published';

          if (isUpdateRequest) {
            endpoint = `${baseURL}/api/approval/posts/${originalPost._id}/request-update`;
            method = 'POST';
          } else if (isEditMode) {
            endpoint = `${baseURL}/api/approval/posts/${id}`;
            method = 'PUT';
          } else {
            endpoint = `${baseURL}/api/posts`;
            method = 'POST';
          }
        } else {
          // Needs approval
          postData.status = 'pending_approval';

          if (isUpdateRequest) {
            endpoint = `${baseURL}/api/approval/posts/${originalPost._id}/request-update`;
            method = 'POST';
          } else if (isEditMode) {
            endpoint = `${baseURL}/api/approval/posts/${id}`;
            method = 'PUT';
          } else {
            endpoint = `${baseURL}/api/approval/posts`;
            method = 'POST';
          }
        }
      }

      const adminToken = localStorage.getItem('adminToken');

      console.log('Making request to:', endpoint);
      console.log('Method:', method);
      console.log('Post data:', JSON.stringify(postData, null, 2));

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to submit post');
      }

      // Determine success message based on user permissions
      let successMessage = '';
      let needsApproval = false;

      if (isFutureDate) {
        if (user?.role === 'superadmin' || (user?.role === 'admin' && user.hasCRUDAccess)) {
          successMessage = `Post scheduled for ${new Date(postData.publishDateTime).toLocaleString()}`;
        } else {
          successMessage = 'Your scheduled post has been submitted for superadmin approval';
          needsApproval = true;
        }
      } else {
        if (user?.role === 'superadmin' || (user?.role === 'admin' && user.hasCRUDAccess)) {
          successMessage = 'Post published successfully';
        } else {
          successMessage = 'Your post has been submitted for superadmin approval';
          needsApproval = true;
        }
      }

      if (isUpdateRequest) {
        successMessage = 'Update request submitted for superadmin approval';
        needsApproval = true;
      }

      toast({
        title: 'Success!',
        description: successMessage,
      });

      setTimeout(() => {
        if (needsApproval) {
          navigate('/admin/my-approvals');
        } else {
          navigate('/admin/posts/list');
        }
      }, 1500);

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
      category: categories.find(cat => cat._id === formData.category)?.name || formData.category
    };

    localStorage.setItem('postPreview', JSON.stringify(previewData));
    window.open(`/post/preview`, '_blank');
  };

  if (fetching || fetchingCategories) {
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
            {user?.role === 'admin' && !user.hasCRUDAccess
              ? 'Your posts require superadmin approval'
              : user?.role === 'admin'
                ? 'You have direct CRUD access - can publish directly'
                : 'Superadmin - Full access to all features'}
          </p>
          {user?.role === 'admin' && (
            <div className={`mt-2 px-3 py-1 rounded-full text-xs font-medium inline-flex items-center ${user.hasCRUDAccess
                ? 'bg-green-100 text-green-800'
                : 'bg-blue-100 text-blue-800'
              }`}>
              {user.hasCRUDAccess ? 'CRUD Mode' : 'Approval Mode'}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={handlePreview}
            disabled={!formData.title || !formData.body || !formData.category}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>

      {/* Mode Banner */}
      {user?.role === 'admin' && !user.hasCRUDAccess && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-blue-500 mr-2" />
            <span className="font-medium text-blue-800">Approval Mode</span>
          </div>
          <p className="text-sm text-blue-600 mt-1">
            You are in Approval Mode. All posts and updates require superadmin approval.
            {isFutureDate && ' Scheduled posts will be submitted for approval.'}
          </p>
        </div>
      )}

      {user?.role === 'admin' && user.hasCRUDAccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <span className="font-medium text-green-800">CRUD Mode</span>
          </div>
          <p className="text-sm text-green-600 mt-1">
            You have direct CRUD access. You can publish posts directly without approval.
          </p>
        </div>
      )}

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
            {canScheduleDirectly
              ? 'Post will be scheduled automatically'
              : 'Note: Scheduled posts require superadmin approval'}
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
            <div className="flex space-x-2">
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full mt-2 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                required
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewCategoryInput(!showNewCategoryInput)}
                className="mt-2"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {showNewCategoryInput && (
              <div className="mt-2 flex space-x-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Enter new category name"
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                />
                <Button
                  type="button"
                  onClick={handleAddNewCategory}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Add
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowNewCategoryInput(false);
                    setNewCategory('');
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
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
                  {canScheduleDirectly ? 'Will be scheduled' : 'Will require approval'}
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
                {canScheduleDirectly
                  ? 'Post will be scheduled automatically'
                  : 'Post will be submitted for schedule approval'}
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
            disabled={loading || !formData.category}
            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isFutureDate ? 'Processing...' : 'Submitting...'}
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {isFutureDate
                  ? canScheduleDirectly ? 'Schedule Post' : 'Submit for Schedule Approval'
                  : isUpdateRequest
                    ? 'Submit Update Request'
                    : isEditMode
                      ? canPublishDirectly ? 'Update Post' : 'Submit Update for Approval'
                      : canPublishDirectly ? 'Publish Post' : 'Submit for Approval'}
              </>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default AdminPostEditor;