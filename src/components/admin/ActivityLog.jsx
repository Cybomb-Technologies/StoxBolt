
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Edit, 
  Trash2, 
  Upload, 
  Calendar, 
  User, 
  LogIn, 
  Loader2, 
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Hash,
  Tag,
  Globe,
  Type,
  Image as ImageIcon,
  Clock,
  CheckCircle,
  XCircle,
  BookOpen,
  User as UserIcon,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ActivityLog = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalActivities, setTotalActivities] = useState(0);
  const [expandedDetails, setExpandedDetails] = useState({});
  const { toast } = useToast();
  const { user } = useAuth();

  const activityTypes = [
    { value: 'all', label: 'All Activities' },
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Update' },
    { value: 'delete', label: 'Delete' },
    { value: 'publish', label: 'Publish' },
    { value: 'upload', label: 'Upload' },
   
  ];

  useEffect(() => {
    fetchActivityLog();
  }, [currentPage, filterType]);

  const fetchActivityLog = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams({
        page: currentPage,
        limit: 20
      });

      if (filterType !== 'all') {
        params.append('type', filterType);
      }

      const response = await fetch(`${baseURL}/api/activities?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch activity log');
      }

      if (data.success) {
        setActivities(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotalActivities(data.total || 0);
        setExpandedDetails({}); // Reset expanded details
      } else {
        throw new Error(data.message || 'Failed to load activity log');
      }
    } catch (error) {
      console.error('Error fetching activity log:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load activity log',
        variant: 'destructive'
      });
      setActivities([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchActivityLog();
  };

  const handleFilterChange = (type) => {
    setFilterType(type);
    setCurrentPage(1);
  };

  const toggleDetails = (activityId) => {
    setExpandedDetails(prev => ({
      ...prev,
      [activityId]: !prev[activityId]
    }));
  };

  const getActivityIcon = (type) => {
    const icons = {
      create: <FileText className="h-5 w-5 text-green-600" />,
      update: <Edit className="h-5 w-5 text-orange-600" />,
      delete: <Trash2 className="h-5 w-5 text-red-600" />,
      publish: <Upload className="h-5 w-5 text-purple-600" />,
      upload: <Upload className="h-5 w-5 text-blue-600" />,
      login: <LogIn className="h-5 w-5 text-indigo-600" />,
      admin_created: <User className="h-5 w-5 text-teal-600" />,
      admin_updated: <Edit className="h-5 w-5 text-cyan-600" />,
      admin_deactivated: <User className="h-5 w-5 text-gray-600" />,
      admin_reactivated: <User className="h-5 w-5 text-lime-600" />
    };
    return icons[type] || icons.create;
  };

  const getActivityColor = (type) => {
    const colors = {
      create: 'bg-green-50 border-green-200 hover:bg-green-100',
      update: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
      delete: 'bg-red-50 border-red-200 hover:bg-red-100',
      publish: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
      upload: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      login: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
      admin_created: 'bg-teal-50 border-teal-200 hover:bg-teal-100',
      admin_updated: 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100',
      admin_deactivated: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
      admin_reactivated: 'bg-lime-50 border-lime-200 hover:bg-lime-100'
    };
    return colors[type] || colors.create;
  };

  const getUserDisplayName = (activity) => {
    // Use userEmail if available (from backend enhancement)
    if (activity.userEmail) {
      return activity.userEmail;
    }
    
    // Use username if available
    if (activity.username) {
      return activity.username;
    }
    
    // Check if user field contains email
    if (activity.user && activity.user.includes('@')) {
      return activity.user;
    }
    
    // For generic "Admin User", show a generic name
    if (activity.user === 'Admin User' || activity.user === 'adminuser') {
      return 'Admin';
    }
    
    // Return the user field as is
    return activity.user || 'Unknown User';
  };

  const getActivityText = (activity) => {
    const actions = {
      create: 'created',
      update: 'updated',
      delete: 'deleted',
      publish: 'published',
      upload: 'uploaded',
      login: 'logged in',
      admin_created: 'created admin user',
      admin_updated: 'updated admin user',
      admin_deactivated: 'deactivated admin user',
      admin_reactivated: 'reactivated admin user'
    };

    const action = actions[activity.type] || activity.type;
    const userDisplayName = getUserDisplayName(activity);
    
    if (activity.postId) {
      return `${userDisplayName} ${action} "${activity.title}"`;
    } else if (activity.type === 'login') {
      return `${userDisplayName} ${action}`;
    } else if (activity.type.startsWith('admin_')) {
      // For admin activities, show the target user email if available in details
      const targetUser = activity.details?.targetUserEmail || 
                        activity.details?.targetUsername || 
                        activity.details?.targetUser || 
                        activity.title;
      return `${userDisplayName} ${action}: ${targetUser}`;
    } else {
      return `${userDisplayName} ${action} "${activity.title}"`;
    }
  };

  const getActivityDetails = (activity) => {
    if (!activity.details) return null;

    if (activity.type === 'update' && activity.details.from && activity.details.to) {
      return `Changed from ${activity.details.from} to ${activity.details.to}`;
    }

    if (activity.type === 'upload' && activity.details.count) {
      return `Uploaded ${activity.details.count} posts`;
    }

    if (activity.details.category) {
      return `Category: ${activity.details.category}`;
    }

    if (activity.details.status) {
      return `Status: ${activity.details.status}`;
    }

    // Show user email for admin activities
    if (activity.type.startsWith('admin_')) {
      if (activity.details.targetUserEmail) {
        return `User: ${activity.details.targetUserEmail}`;
      } else if (activity.details.targetUsername) {
        return `User: ${activity.details.targetUsername}`;
      }
    }

    return null;
  };

  const formatDateTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

      if (diffInHours < 1) {
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
      } else if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
      } else {
        return date.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (error) {
      return 'Invalid date';
    }
  };

  const renderFormattedDetails = (details, activityType) => {
    if (!details || typeof details !== 'object') {
      return <p className="text-gray-600 text-sm">No additional details available</p>;
    }

    const isUpdate = activityType === 'update';
    const isAdminActivity = activityType.startsWith('admin_');

    // For update activities, show changes in a special format
    if (isUpdate && details.from && details.to) {
      return (
        <div className="space-y-2">
          <div className="flex items-start">
            <AlertCircle className="h-4 w-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium">Field Changed:</span>
              <div className="mt-1 grid grid-cols-2 gap-4">
                <div className="bg-red-50 p-2 rounded">
                  <div className="text-xs text-red-600 font-medium">From:</div>
                  <div className="text-sm truncate">{details.from}</div>
                </div>
                <div className="bg-green-50 p-2 rounded">
                  <div className="text-xs text-green-600 font-medium">To:</div>
                  <div className="text-sm truncate">{details.to}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // For admin activities, highlight user information
    if (isAdminActivity) {
      const adminFields = [
        { key: 'targetUserEmail', icon: <UserIcon className="h-4 w-4" />, label: 'Target User Email' },
        { key: 'targetUsername', icon: <UserIcon className="h-4 w-4" />, label: 'Target Username' },
        { key: 'role', icon: <Hash className="h-4 w-4" />, label: 'Role' },
        { key: 'status', icon: <CheckCircle className="h-4 w-4" />, label: 'Status' },
        { key: 'reason', icon: <AlertCircle className="h-4 w-4" />, label: 'Reason' }
      ];

      return (
        <div className="space-y-3">
          {adminFields.map(field => {
            if (details[field.key]) {
              return (
                <div key={field.key} className="flex items-center">
                  <span className="text-gray-400 mr-2">{field.icon}</span>
                  <span className="font-medium text-gray-700 mr-2">{field.label}:</span>
                  <span className="text-gray-900">{details[field.key]}</span>
                </div>
              );
            }
            return null;
          })}
        </div>
      );
    }

    // Regular post/article details
    const postFields = [
      { key: 'title', icon: <Type className="h-4 w-4" />, label: 'Title' },
      { key: 'shortTitle', icon: <Type className="h-4 w-4" />, label: 'Short Title' },
      { key: 'category', icon: <Hash className="h-4 w-4" />, label: 'Category' },
      { key: 'region', icon: <Globe className="h-4 w-4" />, label: 'Region' },
      { key: 'author', icon: <UserIcon className="h-4 w-4" />, label: 'Author' },
      { key: 'status', icon: activityType === 'publish' ? <CheckCircle className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />, label: 'Status' },
      { key: 'isSponsored', icon: <Tag className="h-4 w-4" />, label: 'Sponsored' },
      { key: 'metaTitle', icon: <Type className="h-4 w-4" />, label: 'Meta Title' },
      { key: 'metaDescription', icon: <Type className="h-4 w-4" />, label: 'Meta Description' },
      { key: 'publishDateTime', icon: <Clock className="h-4 w-4" />, label: 'Publish Date' }
    ];

    const otherDetails = Object.keys(details)
      .filter(key => !postFields.some(field => field.key === key))
      .map(key => ({ key, value: details[key] }));

    return (
      <div className="space-y-4">
        {/* Post Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {postFields.map(field => {
            if (details[field.key] !== undefined && details[field.key] !== null && details[field.key] !== '') {
              let displayValue = details[field.key];
              
              if (field.key === 'isSponsored') {
                displayValue = details[field.key] ? 'Yes' : 'No';
              } else if (field.key === 'status' && activityType === 'publish') {
                displayValue = 'Published';
              }
              
              return (
                <div key={field.key} className="flex items-start">
                  <span className="text-gray-400 mr-2 mt-0.5 flex-shrink-0">{field.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-500">{field.label}</div>
                    <div className="text-sm text-gray-900 truncate">{displayValue}</div>
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>

        {/* Image URL */}
        {details.imageUrl && (
          <div className="border-t pt-3">
            <div className="flex items-center mb-2">
              <ImageIcon className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-xs font-medium text-gray-500">Image</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 truncate">{details.imageUrl}</p>
              </div>
              {details.imageUrl.startsWith('http') && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-8"
                >
                  <a 
                    href={details.imageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs"
                  >
                    View
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        {details.tags && Array.isArray(details.tags) && details.tags.length > 0 && (
          <div className="border-t pt-3">
            <div className="flex items-center mb-2">
              <Tag className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-xs font-medium text-gray-500">Tags</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {details.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Body/Content Preview */}
        {details.body && (
          <div className="border-t pt-3">
            <div className="flex items-center mb-2">
              <BookOpen className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-xs font-medium text-gray-500">Content Preview</span>
            </div>
            <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg max-h-32 overflow-y-auto">
              {details.body.length > 200 
                ? `${details.body.substring(0, 200)}...` 
                : details.body}
            </div>
          </div>
        )}
      </div>
    );
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
      className="bg-white rounded-2xl shadow-xl p-8"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Activity Log</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track all system activities and user actions
          </p>
        </div>
        
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filter Activities
          </h3>
          <span className="text-sm text-gray-600">
            {totalActivities} total activities
          </span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {activityTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => handleFilterChange(type.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === type.value
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activities List */}
      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No activities found</p>
            <p className="text-sm text-gray-500 mt-2">
              {filterType !== 'all' 
                ? `No ${filterType} activities in the selected time period`
                : 'Activities will appear here as they occur'
              }
            </p>
          </div>
        ) : (
          <>
            {activities.map((activity, index) => {
              const activityId = activity._id || activity.id || index;
              const isExpanded = expandedDetails[activityId];
              
              return (
                <motion.div
                  key={activityId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-start space-x-4 p-4 border-2 rounded-xl transition-all duration-200 ${getActivityColor(activity.type)}`}
                >
                  <div className="mt-1 flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                      <div className="mb-2 sm:mb-0">
                        <p className="text-gray-900 font-medium">
                          {getActivityText(activity)}
                        </p>
                        
                        {getActivityDetails(activity) && (
                          <p className="text-sm text-gray-600 mt-1">
                            {getActivityDetails(activity)}
                          </p>
                        )}
                        
                        {/* Show user email separately if available */}
                        {activity.userEmail && activity.user !== activity.userEmail && (
                          <p className="text-xs text-gray-500 mt-1">
                            User: {activity.userEmail}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span className="whitespace-nowrap">
                          {formatDateTime(activity.timestamp || activity.createdAt)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Details Toggle */}
                    {activity.details && Object.keys(activity.details).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <button
                          onClick={() => toggleDetails(activityId)}
                          className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          {isExpanded ? (
                            <>
                              <span className="mr-1">Hide Details</span>
                              <ChevronLeft className="h-4 w-4 rotate-90" />
                            </>
                          ) : (
                            <>
                              <span className="mr-1">View Details</span>
                              <ChevronRight className="h-4 w-4 rotate-90" />
                            </>
                          )}
                        </button>
                        
                        {/* Expanded Details */}
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mt-3 bg-white border border-gray-200 rounded-lg p-4"
                          >
                            {renderFormattedDetails(activity.details, activity.type)}
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 pt-6 border-t">
          <div className="text-sm text-gray-600 mb-4 sm:mb-0">
            Showing {activities.length} of {totalActivities} activities
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
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
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-8 w-8 rounded-md text-sm font-medium ${
                      currentPage === pageNum
                        ? 'bg-orange-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              {totalPages > 5 && (
                <span className="text-gray-500 px-2">...</span>
              )}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="mt-8 pt-8 border-t">
        <h3 className="font-semibold text-gray-900 mb-4">Activity Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-700">
              {activities.filter(a => a.type === 'create').length}
            </div>
            <div className="text-sm text-green-600">Created</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-700">
              {activities.filter(a => a.type === 'update').length}
            </div>
            <div className="text-sm text-orange-600">Updated</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-700">
              {activities.filter(a => a.type === 'publish').length}
            </div>
            <div className="text-sm text-purple-600">Published</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">
              {activities.filter(a => a.type === 'upload').length}
            </div>
            <div className="text-sm text-blue-600">Uploads</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ActivityLog;
