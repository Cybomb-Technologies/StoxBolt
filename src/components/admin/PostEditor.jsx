
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Save, Eye, Upload } from 'lucide-react';

const PostEditor = ({ post = null, onSave = null }) => {
  const [formData, setFormData] = useState({
    title: post?.title || '',
    shortTitle: post?.shortTitle || '',
    body: post?.body || '',
    category: post?.category || 'Indian',
    tags: post?.tags?.join(', ') || '',
    region: post?.region || 'India',
    author: post?.author || '',
    publishDateTime: post?.publishDateTime || '',
    status: post?.status || 'draft',
    isSponsored: post?.isSponsored || false,
    metaTitle: post?.metaTitle || '',
    metaDescription: post?.metaDescription || '',
    imageUrl: post?.image || ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const categories = ['Indian', 'US', 'Global', 'Commodities', 'Forex', 'Crypto', 'IPOs'];
  const statuses = ['draft', 'scheduled', 'published'];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // API call: POST /api/posts or PUT /api/posts/${post.id}
      const postData = {
        ...formData,
        tags: formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
      };

      if (imageFile) {
        // API call: POST /api/upload (upload image first)
        // Then attach image URL to postData
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: 'Success!',
        description: post ? 'Post updated successfully' : 'Post created successfully'
      });

      if (onSave) {
        onSave(postData);
      }

      // Reset form if creating new post
      if (!post) {
        setFormData({
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
          imageUrl: ''
        });
        setImageFile(null);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save post',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-2xl shadow-xl p-8"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {post ? 'Edit Post' : 'Create New Post'}
      </h2>

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
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
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
                Upload Image
              </Button>
              {formData.imageUrl && (
                <div className="mt-4">
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
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
              <span className="text-gray-700 font-medium">Sponsored Post</span>
            </label>
          </div>

          <div className="md:col-span-2 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Settings</h3>
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
            onClick={() => toast({ title: '🚧 This feature isn\'t implemented yet—but don\'t worry! You can request it in your next prompt! 🚀' })}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : post ? 'Update Post' : 'Create Post'}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default PostEditor;
