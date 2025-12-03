import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Save, Eye, Upload, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// Use Vite env
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
    status: 'draft',
    isSponsored: false,
    metaTitle: '',
    metaDescription: '',
    imageUrl: '',
  });
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

  const statuses =
    user?.role === 'superadmin'
      ? ['draft', 'scheduled', 'published', 'archived']
      : ['draft', 'scheduled'];

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
        console.log('Fetched post:', post); // Debug log
        
        // Check if admin can edit this post
        if (user?.role === 'admin' && post.authorId?._id !== user?._id) {
          toast({
            title: 'Access Denied',
            description: 'You can only edit your own posts',
            variant: 'destructive',
          });
          navigate('/admin/posts');
          return;
        }

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
          status: post.status || 'draft',
          isSponsored: post.isSponsored || false,
          metaTitle: post.metaTitle || '',
          metaDescription: post.metaDescription || '',
          imageUrl: post.imageUrl || '',
        });
        
        // Store the original image URL separately
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
    let imageUrl = existingImageUrl; // Start with existing image URL
    
    // Upload new image if exists
    if (imageFile) {
      const uploadedUrl = await uploadImage();
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      } else {
        // If upload failed but we have an existing image, keep it
        if (!imageUrl && isEditMode) {
          // If editing and upload failed, keep the existing one
          imageUrl = existingImageUrl;
        }
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
      status: formData.status,
      isSponsored: formData.isSponsored,
      metaTitle: formData.metaTitle,
      metaDescription: formData.metaDescription,
      imageUrl: imageUrl, // Use the determined image URL
    };

    // Only add publishDateTime if it has a value
    if (formData.publishDateTime) {
      postData.publishDateTime = formData.publishDateTime;
    }

    // Handle tags
    if (formData.tags.trim()) {
      postData.tags = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
    }

    // For new posts, add authorId
    if (!isEditMode) {
      postData.authorId = user?._id;
    }

    console.log('Submitting post data:', postData); // Debug log

    const token = localStorage.getItem('token');
    const url = isEditMode
      ? `${baseURL}/api/posts/${id}`
      : `${baseURL}/api/posts`;
    const method = isEditMode ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });

    const responseData = await response.json();
    console.log('Server response:', responseData); // Debug log

    if (!response.ok) {
      throw new Error(responseData.message || `Failed to save post (${response.status})`);
    }

    if (responseData.success) {
      toast({
        title: 'Success!',
        description: isEditMode
          ? 'Post updated successfully'
          : 'Post created successfully',
      });

      if (!isEditMode) {
        // Reset form if creating new post
        setFormData({
          title: '',
          shortTitle: '',
          body: '',
          category: 'Indian',
          tags: '',
          region: 'India',
          author: user?.name || '',
          publishDateTime: '',
          status: 'draft',
          isSponsored: false,
          metaTitle: '',
          metaDescription: '',
          imageUrl: '',
        });
        setImageFile(null);
        setPreviewImage(null);
        setExistingImageUrl('');
      } else {
        // Navigate back to posts list
        setTimeout(() => {
          navigate('/admin/posts');
        }, 1000);
      }
    } else {
      throw new Error(responseData.message || 'Failed to save post');
    }
  } catch (error) {
    console.error('Submit error:', error);
    toast({
      title: 'Error',
      description: error.message || 'Failed to save post',
      variant: 'destructive',
    });
  } finally {
    setLoading(false);
  }
};

  const handlePreview = () => {
    // Create a preview object
    const previewData = {
      ...formData,
      _id: isEditMode ? id : 'preview',
      createdAt: new Date().toISOString(),
      tags: formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      imageUrl: previewImage || formData.imageUrl || existingImageUrl,
    };

    // Store in localStorage for preview page
    localStorage.setItem('postPreview', JSON.stringify(previewData));
    
    // Open in new tab
    window.open(`/post/preview`, '_blank');
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-orange-600" />
      </div>
    );
  }
// Add a debug button (temporary - remove in production)
const debugData = () => {
  console.log('Current form data:', formData);
  console.log('Existing image URL:', existingImageUrl);
  console.log('Preview image:', previewImage);
  console.log('Image file:', imageFile);
  console.log('User:', user);
  console.log('Is edit mode:', isEditMode);
  console.log('Post ID:', id);
};
  return (
    
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-2xl shadow-xl p-8"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Edit Post' : 'Create New Post'}
        </h2>
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
            <Label htmlFor="publishDateTime">Publish Date & Time</Label>
            <input
              id="publishDateTime"
              name="publishDateTime"
              type="datetime-local"
              value={formData.publishDateTime}
              onChange={handleChange}
              className="w-full mt-2 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <Label htmlFor="status">Status *</Label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full mt-2 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
              required
              disabled={user?.role === 'admin' && formData.status === 'published'}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
            {user?.role === 'admin' && formData.status === 'published' && (
              <p className="text-sm text-gray-500 mt-1">
                Note: Admin cannot change published status. Contact superadmin.
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
                      New image selected. Click "Update Post" to save it.
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
            onClick={() => navigate('/admin/posts')}
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
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditMode ? 'Update Post' : 'Create Post'}
              </>
            )}
          </Button>
        </div>
      </form>
      
    </motion.div>
  );
};

export default PostEditor;