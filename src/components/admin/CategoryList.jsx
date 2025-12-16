import React, { useState, useEffect } from 'react';
import {
  Edit, Trash2, Search, Filter, Loader2, Plus,
  Info, AlertCircle, RefreshCw,
  Calendar,
  Mail,
  User,
  X,
  Eye
} from 'lucide-react';

const baseURL = import.meta.env.VITE_API_URL || 'https://api.stoxbolt.com';

// Simple toast component
const Toast = ({ title, description, variant, onClose }) => {
  const bgColor = variant === 'destructive' ? 'bg-red-100 border-red-200' : 'bg-green-100 border-green-200';
  const textColor = variant === 'destructive' ? 'text-red-800' : 'text-green-800';

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg border ${bgColor} ${textColor} shadow-lg max-w-sm`}>
      <div className="flex justify-between items-start">
        <div>
          {title && <h4 className="font-semibold mb-1">{title}</h4>}
          {description && <p className="text-sm">{description}</p>}
        </div>
        <button onClick={onClose} className="ml-4">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteCategory, setDeleteCategory] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCategories, setTotalCategories] = useState(0);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingCategory, setViewingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Simple toast function
  const toast = ({ title, description, variant = 'default', className = '' }) => {
    const id = Date.now();
    const newToast = { id, title, description, variant, className };

    setToasts(prev => [...prev, newToast]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);

    return id;
  };

  const dismissToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Mock user for now - replace with actual auth context
  const user = { role: 'admin' }; // Default to admin for testing

  useEffect(() => {
    fetchCategories();
  }, [currentPage, searchQuery]);

  // CategoryList.jsx - Update the fetchCategories function
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const adminToken = localStorage.getItem('adminToken');

      if (!adminToken) {
        toast({
          title: 'Authentication Error',
          description: 'No authentication token found. Please log in again.',
          variant: 'destructive'
        });
        return;
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10
      });

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`${baseURL}/api/categories?${params}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('adminToken');
          toast({
            title: 'Session Expired',
            description: 'Your session has expired. Please log in again.',
            variant: 'destructive'
          });
          return;
        }

        if (response.status === 403) {
          setCategories([]);
          setTotalPages(1);
          setTotalCategories(0);
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to view categories.',
            variant: 'destructive'
          });
          return;
        }

        // Check for specific error messages
        if (data.error && data.error.includes('Schema')) {
          toast({
            title: 'Server Configuration Error',
            description: 'Please contact the administrator. Server configuration issue detected.',
            variant: 'destructive'
          });
          return;
        }

        throw new Error(data.message || data.error || `Failed to fetch categories (${response.status})`);
      }

      if (data.success) {
        setCategories(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotalCategories(data.total || 0);
      } else {
        throw new Error(data.message || 'Failed to load categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);

      // Don't show toast for auth errors (already handled above)
      if (!error.message.includes('403') && !error.message.includes('401')) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to load categories',
          variant: 'destructive'
        });
      }

      setCategories([]);
      setTotalPages(1);
      setTotalCategories(0);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Category name is required';
    } else if (formData.name.length > 50) {
      errors.name = 'Category name cannot exceed 50 characters';
    }

    if (formData.description && formData.description.length > 200) {
      errors.description = 'Description cannot exceed 200 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateCategory = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
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

      const response = await fetch(`${baseURL}/api/categories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create category');
      }

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Category created successfully',
        });
        setIsCreateModalOpen(false);
        setFormData({ name: '', description: '' });
        setFormErrors({});
        fetchCategories();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create category',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!validateForm() || !editingCategory) return;

    setSubmitting(true);
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

      const response = await fetch(`${baseURL}/api/categories/${editingCategory._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update category');
      }

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Category updated successfully',
        });
        setIsEditModalOpen(false);
        setEditingCategory(null);
        setFormData({ name: '', description: '' });
        setFormErrors({});
        fetchCategories();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update category',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (categoryId) => {
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

      const response = await fetch(`${baseURL}/api/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete category');
      }

      if (data.success) {
        setCategories((prev) => prev.filter((c) => c._id !== categoryId));
        setTotalCategories(prev => prev - 1);
        toast({
          title: 'Success',
          description: 'Category deleted successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete category',
        variant: 'destructive'
      });
    }
    setIsDeleteModalOpen(false);
    setDeleteCategory(null);
  };

  const handleViewClick = (category) => {
    setViewingCategory(category);
    setIsViewModalOpen(true);
  };

  const handleEditClick = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || ''
    });
    setFormErrors({});
    setIsEditModalOpen(true);
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

  // Check if user can manage categories
  const canManageCategories = user && (user.role === 'admin' || user.role === 'superadmin');

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      {/* Display toasts */}
      {toasts.map((toastItem) => (
        <Toast
          key={toastItem.id}
          title={toastItem.title}
          description={toastItem.description}
          variant={toastItem.variant}
          onClose={() => dismissToast(toastItem.id)}
        />
      ))}

      {/* Header Section */}
      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories by name or description..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canManageCategories && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-sm transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Category
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600">
              Showing <span className="font-semibold">{categories.length}</span> of{' '}
              <span className="font-semibold">{totalCategories}</span> categories
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
                toast({
                  title: 'Filters Cleared',
                  description: 'All filters have been reset',
                });
              }}
              className="flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-4 w-4 mr-1" />
              Clear Filters
            </button>
            <button
              onClick={fetchCategories}
              disabled={loading}
              className="flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wider w-[250px]">
                Category Name
              </th>
              <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wider w-[300px]">
                Description
              </th>
              <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wider w-[150px]">
                Created By
              </th>
              <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wider w-[160px]">
                Created Date
              </th>
              <th className="py-4 px-6 text-right font-semibold text-gray-700 text-sm uppercase tracking-wider w-[120px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {categories.map((category) => (
              <tr key={category._id} className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6">
                  <div className="font-medium text-gray-900">{category.name}</div>
                  <div className="text-xs text-gray-500">ID: {category._id}</div>
                </td>
                <td className="py-4 px-6">
                  <div className="text-sm text-gray-600 line-clamp-2">
                    {category.description || 'No description'}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="text-sm text-gray-900 font-medium flex items-center">
                    <User className="h-3 w-3 mr-1 text-gray-400" />
                    {category.createdBy?.name || 'System'}
                  </div>
                  {category.createdBy?.email && (
                    <div className="text-xs text-gray-500 flex items-center">
                      <Mail className="h-3 w-3 mr-1 text-gray-400" />
                      {category.createdBy.email}
                    </div>
                  )}
                </td>
                <td className="py-4 px-6 text-sm text-gray-600 whitespace-nowrap flex items-center">
                  <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                  {formatDate(category.createdAt)}
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleViewClick(category)}
                      title="View Category"
                      className="p-1.5 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Eye className="h-4 w-4 text-blue-500" />
                    </button>

                    {canManageCategories && (
                      <>
                        <button
                          onClick={() => handleEditClick(category)}
                          title="Edit Category"
                          className="p-1.5 hover:bg-green-50 rounded-md transition-colors"
                        >
                          <Edit className="h-4 w-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteCategory(category);
                            setIsDeleteModalOpen(true);
                          }}
                          title="Delete Category"
                          className="p-1.5 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {categories.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <Info className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-600 text-lg font-medium mb-2">No categories found</p>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
            {searchQuery
              ? 'Try changing your search query'
              : 'Create your first category to organize posts'}
          </p>
          {canManageCategories && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-sm transition-colors mx-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Category
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages} • {totalCategories} total categories
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Previous
            </button>
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
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1.5 min-w-[40px] border rounded-lg text-sm ${currentPage === pageNum
                        ? 'bg-orange-600 text-white border-orange-600 hover:bg-orange-700'
                        : 'border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Create New Category</h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-md"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${formErrors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Enter category name"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({ ...formData, description: e.target.value });
                      if (formErrors.description) setFormErrors({ ...formErrors, description: '' });
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${formErrors.description ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Enter category description (optional)"
                    rows="3"
                  />
                  {formErrors.description && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.description}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 text-right">
                    {formData.description.length}/200 characters
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCategory}
                  disabled={submitting}
                  className="flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Category'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Edit Category</h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-md"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${formErrors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({ ...formData, description: e.target.value });
                      if (formErrors.description) setFormErrors({ ...formErrors, description: '' });
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${formErrors.description ? 'border-red-500' : 'border-gray-300'
                      }`}
                    rows="3"
                  />
                  {formErrors.description && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.description}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 text-right">
                    {formData.description.length}/200 characters
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingCategory(null);
                  }}
                  disabled={submitting}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateCategory}
                  disabled={submitting}
                  className="flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Category'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && viewingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Category Details</h3>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-md"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name
                  </label>
                  <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                    {viewingCategory.name}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 min-h-[80px]">
                    {viewingCategory.description || 'No description'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Created By
                  </label>
                  <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{viewingCategory.createdBy?.name || 'System'}</span>
                    </div>
                    {viewingCategory.createdBy?.email && (
                      <div className="mt-1 flex items-center text-sm text-gray-600">
                        <Mail className="h-3 w-3 mr-1 text-gray-400" />
                        {viewingCategory.createdBy.email}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Created Date
                  </label>
                  <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    {formatDate(viewingCategory.createdAt)}
                  </div>
                </div>
                {viewingCategory.updatedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Updated
                    </label>
                    <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {formatDate(viewingCategory.updatedAt)}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && deleteCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold">Delete Category</h3>
              </div>
              <div className="pt-2">
                <p className="text-gray-600">
                  Are you sure you want to delete the category{" "}
                  <span className="font-semibold text-gray-900">
                    "{deleteCategory?.name}"
                  </span>
                  ? This action cannot be undone and will permanently remove the category.
                </p>
                <div className="mt-3 p-3 bg-yellow-50 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> You can only delete categories that are not being used in any posts.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeleteCategory(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteCategory._id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                >
                  Delete Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryList;