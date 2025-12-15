import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  FileText, 
  Users, 
  Activity, 
  Calendar, 
  TrendingUp, 
  Clock,
  Eye,
  CheckCircle,
  AlertCircle,
  CalendarDays,
  UserCheck,
  FileCheck,
  FileX,
  Sparkles,
  BarChart,
  PieChart,
  Download,
  Upload,
  Shield,
  User,
  RefreshCw,
  Loader2,
  Tag,
  Layers,
  FolderOpen,
  TrendingUp as TrendingIcon,
  Hash
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Inline UI Components
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '' }) => (
  <div className={`p-6 border-b ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
);

const CardDescription = ({ children, className = '' }) => (
  <p className={`text-sm text-gray-500 mt-1 ${className}`}>{children}</p>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '' }) => (
  <div className={`p-6 border-t ${className}`}>
    {children}
  </div>
);

const Tabs = ({ defaultValue, children, className = '' }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { activeTab, setActiveTab });
    }
    return child;
  });
  
  return <div className={className}>{childrenWithProps}</div>;
};

const TabsList = ({ children, className = '', activeTab, setActiveTab }) => (
  <div className={`flex space-x-2 bg-gray-100 p-1 rounded-lg ${className}`}>
    {React.Children.map(children, child => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, { activeTab, setActiveTab });
      }
      return child;
    })}
  </div>
);

const TabsTrigger = ({ value, children, className = '', activeTab, setActiveTab }) => (
  <button
    onClick={() => setActiveTab(value)}
    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
      activeTab === value 
        ? 'bg-orange-600 text-white' 
        : 'text-gray-600 hover:text-gray-900'
    } ${className}`}
  >
    {children}
  </button>
);

const TabsContent = ({ value, children, activeTab }) => {
  if (activeTab !== value) return null;
  return <div className="mt-4">{children}</div>;
};

const Button = ({ children, variant = 'default', size = 'default', className = '', ...props }) => {
  const variantClasses = {
    default: 'bg-orange-600 text-white hover:bg-orange-700',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-700 hover:bg-gray-100'
  };
  
  const sizeClasses = {
    default: 'px-4 py-2 text-sm',
    sm: 'px-3 py-1.5 text-xs',
    lg: 'px-6 py-3 text-base'
  };
  
  return (
    <button
      className={`rounded-lg font-medium transition-colors ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Badge = ({ children, variant = 'default', className = '' }) => {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    outline: 'border border-gray-300 text-gray-700',
    destructive: 'bg-red-100 text-red-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    orange: 'bg-orange-100 text-orange-800',
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    pink: 'bg-pink-100 text-pink-800',
    indigo: 'bg-indigo-100 text-indigo-800',
    teal: 'bg-teal-100 text-teal-800',
    cyan: 'bg-cyan-100 text-cyan-800',
    rose: 'bg-rose-100 text-rose-800'
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

const Progress = ({ value, className = '' }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
    <div 
      className="bg-orange-600 h-2 rounded-full transition-all duration-300" 
      style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
    />
  </div>
);

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Overview = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    posts: {
      total: 0,
      published: 0,
      draft: 0,
      scheduled: 0,
      trending: 0,
      pendingApproval: 0,
      approved: 0
    },
    users: {
      total: 0,
      active: 0,
      admins: 0,
      superadmins: 0,
      editors: 0
    },
    categories: {
      total: 0,
      active: 0,
      postsPerCategory: 0,
      trendingCategories: []
    },
    activities: {
      total: 0,
      recent: [],
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      thisYear: 0,
      allTime: 0
    },
    recentActivities: [],
    trendingPosts: [],
    pendingApprovals: [],
    systemHealth: {
      database: 'healthy',
      api: 'healthy',
      storage: 'healthy'
    },
    lastUpdated: new Date()
  });
  const [timeRange, setTimeRange] = useState('today');
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    // Refresh data every 30 seconds for real-time updates
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error('No authentication adminToken found');
      }

      // Create headers object
      const headers = {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      };

      // Fetch all data in parallel
      const fetchPromises = [
        fetchPostStats(headers),
        fetchCategories(headers),
        fetchUsers(headers),
        fetchActivities(headers),
        fetchScheduledPosts(headers),
        fetchAdminStats(headers),
        fetchPendingApprovals(headers)
      ];

      const [
        postsStatsData,
        categoriesData,
        usersData,
        activitiesData,
        scheduledData,
        adminStats,
        pendingApprovals
      ] = await Promise.all(fetchPromises.map(p => p.catch(err => {
        console.error('Error in parallel fetch:', err);
        return null;
      })));

      // Process all data
      processDashboardData({
        postsStats: postsStatsData,
        categories: categoriesData,
        users: usersData,
        activities: activitiesData,
        scheduled: scheduledData,
        adminStats: adminStats,
        pendingApprovals: pendingApprovals
      });
      
    } catch (error) {
      console.error('Error in fetchDashboardData:', error);
      setError('Failed to load dashboard data. Please try again.');
      if (toast) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to load dashboard data',
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPostStats = async (headers) => {
    try {
      const res = await fetch(`${baseURL}/api/posts/stats`, { headers });
      if (!res.ok) throw new Error('Failed to fetch post stats');
      return await res.json();
    } catch (error) {
      console.error('Error fetching post stats:', error);
      return { success: false, data: {} };
    }
  };

  const fetchCategories = async (headers) => {
    try {
      const res = await fetch(`${baseURL}/api/categories`, { headers });
      if (!res.ok) throw new Error('Failed to fetch categories');
      return await res.json();
    } catch (error) {
      console.error('Error fetching categories:', error);
      return { success: false, data: [] };
    }
  };

  const fetchUsers = async (headers) => {
    try {
      const res = await fetch(`${baseURL}/api/users/admins`, { headers });
      if (!res.ok) throw new Error('Failed to fetch users');
      return await res.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      return { success: false, data: {} };
    }
  };

  const fetchActivities = async (headers) => {
    try {
      const res = await fetch(`${baseURL}/api/activities`, { headers });
      if (!res.ok) throw new Error('Failed to fetch activities');
      return await res.json();
    } catch (error) {
      console.error('Error fetching activities:', error);
      return { success: false, data: [] };
    }
  };

  const fetchScheduledPosts = async (headers) => {
    try {
      const res = await fetch(`${baseURL}/api/scheduler/posts`, { headers });
      if (!res.ok) throw new Error('Failed to fetch scheduled posts');
      return await res.json();
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
      return { success: false, count: 0, data: [] };
    }
  };

  const fetchAdminStats = async (headers) => {
    try {
      const res = await fetch(`${baseURL}/api/users/admins/stats`, { headers });
      if (!res.ok) throw new Error('Failed to fetch admin stats');
      return await res.json();
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      return { success: false, data: {} };
    }
  };

  const fetchPendingApprovals = async (headers) => {
    try {
      const res = await fetch(`${baseURL}/api/approval/pending-schedule`, { headers });
      if (!res.ok) throw new Error('Failed to fetch pending approvals');
      return await res.json();
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      return { success: false, data: [] };
    }
  };

  const processDashboardData = (responses) => {
    // Process posts stats
    const postsStatsResponse = responses.postsStats || {};
    const postsStats = postsStatsResponse.data || {};
    
    // Process scheduled posts
    const scheduledResponse = responses.scheduled || {};
    const scheduledCount = scheduledResponse.count || (scheduledResponse.data ? scheduledResponse.data.length : 0);

    // Process categories data
    const categoriesResponse = responses.categories || {};
    const allCategories = categoriesResponse.data || categoriesResponse.categories || [];
    
    const activeCategories = allCategories.filter(cat => 
      cat.status === 'active' || 
      cat.isActive === true || 
      cat.postCount > 0
    ).length;

    // Process admin stats
    const adminStatsResponse = responses.adminStats || {};
    const adminStatsData = adminStatsResponse.data || {};

    // Process users data
    const usersResponse = responses.users || {};
    const usersData = usersResponse.data || usersResponse.users || [];
    
    // Calculate user stats
    const totalUsers = adminStatsData.totalUsers || 0;
    
    const totalAdmins = adminStatsData.totalAdmins || usersData.length || 0;
    const superadminCount = adminStatsData.superadminCount || usersData.filter(u => u.role === 'superadmin').length;
    const adminCount = adminStatsData.totalAdmins ? (adminStatsData.totalAdmins - (adminStatsData.superadminCount || 0)) : usersData.filter(u => u.role === 'admin').length;
    const activeAdmins = adminStatsData.activeAdmins || usersData.filter(u => u.status === 'active' || u.isActive === true).length;

    // Process activities data
    const activitiesResponse = responses.activities || {};
    const allActivities = activitiesResponse.data || activitiesResponse.activities || [];
    const activityStats = responses.activities.stats || {};

    // Get daily stats from backend
    const dailyStats = activityStats.dailyStats || [];

    // Calculate today's activities
    const todayStr = new Date().toISOString().split('T')[0];
    const todayStat = dailyStats.find(stat => stat._id === todayStr);
    const todayActivitiesCount = todayStat ? todayStat.count : 0;

    // Calculate this week's activities
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekStr = oneWeekAgo.toISOString().split('T')[0];
    const weekStats = dailyStats.filter(stat => stat._id >= weekStr);
    const weekActivitiesCount = weekStats.reduce((sum, stat) => sum + stat.count, 0);

    // Calculate this month's activities
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const monthStr = oneMonthAgo.toISOString().split('T')[0];
    const monthStats = dailyStats.filter(stat => stat._id >= monthStr);
    const monthActivitiesCount = monthStats.reduce((sum, stat) => sum + stat.count, 0);

    // Calculate this year's activities
    const currentYear = new Date().getFullYear().toString();
    const yearStats = dailyStats.filter(stat => stat._id.startsWith(currentYear));
    const yearActivitiesCount = yearStats.reduce((sum, stat) => sum + stat.count, 0);

    // Get all time total (from backend stats)
    const totalActivitiesCount = activityStats.totalActivities || 0;

    // Get recent activities (last 5)
    const recentActivities = activityStats.recentActivities || allActivities.slice(0, 5);

    // Get trending posts from stats
    const trendingPosts = postsStats.trending || [];

    // Process pending approvals
    const pendingApprovalsResponse = responses.pendingApprovals || {};
    const pendingApprovals = pendingApprovalsResponse.data || pendingApprovalsResponse.approvals || [];

    // Stats direct mapping
    const postsTotal = postsStats.total || 0;
    const publishedCount = postsStats.published || 0;
    const draftCount = postsStats.draft || 0;
    const pendingCount = postsStats.pendingApproval || 0;
    const approvedCount = postsStats.approved || 0;

    // Calculate approval rate
    const approvalRate = (pendingCount + approvedCount) > 0
      ? Math.round((approvedCount / (pendingCount + approvedCount)) * 100)
      : 100;

    // Posts per category (average)
    const postsPerCategory = allCategories.length > 0 
      ? Math.round(postsTotal / allCategories.length) 
      : 0;

    // Update state with all processed data
    setStats({
      posts: {
        total: postsTotal,
        published: publishedCount,
        draft: draftCount,
        scheduled: scheduledCount,
        trending: trendingPosts.length,
        pendingApproval: pendingCount,
        approved: approvedCount
      },
      users: {
        total: totalUsers,
        active: activeAdmins,
        admins: adminCount,
        superadmins: superadminCount,
      },
      categories: {
        total: allCategories.length,
        active: activeCategories,
        postsPerCategory: postsPerCategory,
      },
      activities: {
        total: totalActivitiesCount,
        recent: recentActivities,
        today: todayActivitiesCount,
        thisWeek: weekActivitiesCount,
        thisMonth: monthActivitiesCount,
        thisYear: yearActivitiesCount,
        allTime: totalActivitiesCount
      },
      recentActivities: recentActivities,
      trendingPosts: trendingPosts,
      pendingApprovals: pendingApprovals,
      systemHealth: {
        database: postsTotal > 0 ? 'healthy' : 'warning',
        api: (totalActivitiesCount || 0) > 0 ? 'healthy' : 'warning',
        storage: 'healthy'
      },
      lastUpdated: new Date()
    });
  };

  const calculateCategoryDistribution = (categories, posts) => {
    const categoryMap = {};
    
    // Initialize category map
    categories.forEach(category => {
      const categoryId = category._id || category.id;
      categoryMap[categoryId] = {
        id: categoryId,
        name: category.name || category.title || 'Unnamed',
        count: 0,
        color: category.color || getCategoryColor(category.name || '')
      };
    });
    
    // Count posts per category
    posts.forEach(post => {
      if (post.category) {
        if (typeof post.category === 'string') {
          // Find category by name or ID
          const category = categories.find(cat => 
            cat.name?.toLowerCase() === post.category.toLowerCase() ||
            cat.title?.toLowerCase() === post.category.toLowerCase() ||
            cat._id === post.category ||
            cat.id === post.category
          );
          if (category) {
            const catId = category._id || category.id;
            if (categoryMap[catId]) {
              categoryMap[catId].count++;
            }
          }
        } else if (post.category._id) {
          // Category is an object with _id
          if (categoryMap[post.category._id]) {
            categoryMap[post.category._id].count++;
          }
        } else if (post.category.id) {
          // Category is an object with id
          if (categoryMap[post.category.id]) {
            categoryMap[post.category.id].count++;
          }
        }
      }
    });
    
    // Convert to array and sort by count
    return Object.values(categoryMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 categories
  };

  // Helper function to generate category colors
  const getCategoryColor = (categoryName) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-yellow-100 text-yellow-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-red-100 text-red-800',
      'bg-teal-100 text-teal-800',
      'bg-cyan-100 text-cyan-800',
      'bg-rose-100 text-rose-800'
    ];
    
    // Simple hash function for consistent colors
    let hash = 0;
    for (let i = 0; i < categoryName.length; i++) {
      hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const formatNumber = (num) => {
    if (!num && num !== 0) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getActivityIcon = (type) => {
    const iconMap = {
      'create': <FileCheck className="h-4 w-4" />,
      'update': <Activity className="h-4 w-4" />,
      'delete': <FileX className="h-4 w-4" />,
      'publish': <Sparkles className="h-4 w-4" />,
      'upload': <Upload className="h-4 w-4" />,
      'admin_created': <UserCheck className="h-4 w-4" />,
      'admin_updated': <UserCheck className="h-4 w-4" />,
      'admin_deactivated': <User className="h-4 w-4" />,
      'admin_reactivated': <UserCheck className="h-4 w-4" />,
      'system': <Activity className="h-4 w-4" />,
      'login': <User className="h-4 w-4" />,
      'category_created': <Tag className="h-4 w-4" />,
      'category_updated': <Tag className="h-4 w-4" />,
      'category_deleted': <Tag className="h-4 w-4" />,
      'schedule_created': <Calendar className="h-4 w-4" />,
      'schedule_approved': <CheckCircle className="h-4 w-4" />,
      'schedule_rejected': <AlertCircle className="h-4 w-4" />,
      'bulk_upload': <Upload className="h-4 w-4" />,
      'approval_requested': <FileCheck className="h-4 w-4" />
    };
    return iconMap[type] || <Activity className="h-4 w-4" />;
  };

  const getActivityColor = (type) => {
    const colorMap = {
      'create': 'bg-green-100 text-green-800',
      'update': 'bg-blue-100 text-blue-800',
      'delete': 'bg-red-100 text-red-800',
      'publish': 'bg-purple-100 text-purple-800',
      'upload': 'bg-orange-100 text-orange-800',
      'admin_created': 'bg-green-100 text-green-800',
      'admin_updated': 'bg-blue-100 text-blue-800',
      'admin_deactivated': 'bg-red-100 text-red-800',
      'admin_reactivated': 'bg-green-100 text-green-800',
      'system': 'bg-gray-100 text-gray-800',
      'login': 'bg-indigo-100 text-indigo-800',
      'category_created': 'bg-teal-100 text-teal-800',
      'category_updated': 'bg-cyan-100 text-cyan-800',
      'category_deleted': 'bg-rose-100 text-rose-800',
      'schedule_created': 'bg-purple-100 text-purple-800',
      'schedule_approved': 'bg-green-100 text-green-800',
      'schedule_rejected': 'bg-red-100 text-red-800',
      'bulk_upload': 'bg-orange-100 text-orange-800',
      'approval_requested': 'bg-yellow-100 text-yellow-800'
    };
    return colorMap[type] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

      if (diffInHours < 1) {
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        return `${diffInMinutes}m ago`;
      } else if (diffInHours < 24) {
        return `${diffInHours}h ago`;
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (error) {
      return 'Recently';
    }
  };

  const getUserDisplayName = (activity) => {
    if (activity.userEmail) return activity.userEmail;
    if (activity.username) return activity.username;
    if (activity.user && activity.user.includes('@')) return activity.user;
    if (activity.user === 'Admin User' || activity.user === 'adminuser') return 'Admin';
    if (activity.userId && activity.userId.name) return activity.userId.name;
    return activity.user || 'System';
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
      admin_reactivated: 'reactivated admin user',
      category_created: 'created category',
      category_updated: 'updated category',
      category_deleted: 'deleted category',
      schedule_created: 'created schedule',
      schedule_approved: 'approved schedule',
      schedule_rejected: 'rejected schedule',
      bulk_upload: 'performed bulk upload',
      approval_requested: 'requested approval for'
    };

    const action = actions[activity.type] || activity.type;
    const userDisplayName = getUserDisplayName(activity);
    
    if (activity.postId) {
      return `${userDisplayName} ${action} "${activity.title || 'post'}"`;
    } else if (activity.type === 'login') {
      return `${userDisplayName} ${action}`;
    } else if (activity.type.startsWith('admin_')) {
      const targetUser = activity.details?.targetUserEmail || 
                        activity.details?.targetUsername || 
                        activity.details?.targetUser || 
                        activity.title;
      return `${userDisplayName} ${action}: ${targetUser}`;
    } else if (activity.type.startsWith('category_')) {
      const categoryName = activity.details?.categoryName || 
                          activity.title || 
                          'category';
      return `${userDisplayName} ${action}: "${categoryName}"`;
    } else if (activity.type.startsWith('schedule_')) {
      return `${userDisplayName} ${action} schedule`;
    } else {
      return `${userDisplayName} ${action} "${activity.title || 'item'}"`;
    }
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    toast({
      title: 'Filter Applied',
      description: `Showing data for ${range}`,
      variant: 'default'
    });
  };

  // Function to get activity count based on selected time range
  const getActivityCountForTimeRange = () => {
    switch (timeRange) {
      case 'today':
        return stats.activities.today;
      case 'week':
        return stats.activities.thisWeek;
      case 'month':
        return stats.activities.thisMonth;
      case 'year':
        return stats.activities.thisYear;
      case 'all':
        return stats.activities.allTime;
      default:
        return stats.activities.today;
    }
  };

  // Function to get comparison value for progress bar
  const getComparisonValue = () => {
    const currentValue = getActivityCountForTimeRange();
    
    switch (timeRange) {
      case 'today':
        // Compare today with weekly average
        const weeklyAvg = stats.activities.thisWeek / 7;
        return (currentValue / Math.max(weeklyAvg, 1)) * 100;
      case 'week':
        // Compare this week with monthly average
        const monthlyAvg = stats.activities.thisMonth / 4;
        return (currentValue / Math.max(monthlyAvg, 1)) * 100;
      case 'month':
        // Compare this month with yearly average
        const yearlyAvg = stats.activities.thisYear / 12;
        return (currentValue / Math.max(yearlyAvg, 1)) * 100;
      case 'year':
        // Compare this year with previous (assuming similar to current)
        return (currentValue / Math.max(stats.activities.thisYear, 1)) * 100;
      case 'all':
        // Show 100% for all time
        return 100;
      default:
        return 0;
    }
  };

  if (loading && !refreshing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading real-time dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard Overview
            </h1>
            <Badge variant="success" className="animate-pulse">
              <RefreshCw className="h-3 w-3 mr-1" />
              Live Data
            </Badge>
          </div>
          <p className="text-gray-600 mt-2">
            Welcome back, <span className="font-semibold text-gray-900">{user?.name || 'Admin'}</span>. 
            Real-time dashboard updates every 30 seconds.
          </p>
          {error && (
            <p className="text-sm text-red-600 mt-1 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {error}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <select 
            value={timeRange}
            onChange={(e) => handleTimeRangeChange(e.target.value)}
            className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </select>
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchDashboardData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Now'}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Posts Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          <Card className="hover:shadow-md transition-shadow hover:border-orange-300 h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Posts
              </CardTitle>
              <FileText className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatNumber(stats.posts.total)}</div>
              <div className="flex items-center justify-between mt-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-sm">Published: {stats.posts.published}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                    <span className="text-sm">Draft: {stats.posts.draft}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                    <span className="text-sm">Scheduled: {stats.posts.scheduled}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Categories Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="h-full"
        >
          <Card className="hover:shadow-md transition-shadow hover:border-teal-300 h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Categories
              </CardTitle>
              <Layers className="h-4 w-4 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatNumber(stats.categories.total)}</div>
              <div className="flex items-center justify-between mt-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                    <span className="text-sm">Active: {stats.categories.active}</span>
                  </div>
                  <div className="flex items-center">
                    <FileText className="h-3 w-3 text-blue-500 mr-2" />
                    <span className="text-sm">Posts per category: {stats.categories.postsPerCategory}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Activities Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="h-full"
        >
          <Card className="hover:shadow-md transition-shadow hover:border-green-300 h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Activities ({timeRange === 'today' ? 'Today' : 
                           timeRange === 'week' ? 'This Week' : 
                           timeRange === 'month' ? 'This Month' : 
                           timeRange === 'year' ? 'This Year' : 'All Time'})
              </CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatNumber(getActivityCountForTimeRange())}</div>
              <div className="mt-4 space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Comparison</span>
                    <span>
                      {timeRange === 'today' ? 'vs weekly avg' : 
                       timeRange === 'week' ? 'vs monthly avg' : 
                       timeRange === 'month' ? 'vs yearly avg' : 
                       timeRange === 'year' ? 'vs previous year' : 'All time'}
                    </span>
                  </div>
                  <Progress value={getComparisonValue()} />
                </div>
                <div className="flex items-center text-sm">
                  <Clock className="h-3 w-3 mr-2 text-gray-500" />
                  <span>Recent: {stats.activities.recent.length} activities</span>
                </div>
                
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Users Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="h-full"
        >
          <Card className="hover:shadow-md transition-shadow hover:border-indigo-300 h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Users
              </CardTitle>
              <Users className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatNumber(stats.users.total)}</div>
              <div className="flex items-center justify-between mt-4">
                 <p className="text-sm text-gray-500">Total Registered Users</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts and Detailed Views */}
      <Tabs defaultValue="activities">
        <TabsList>
          <TabsTrigger value="activities">
            <Activity className="h-4 w-4 mr-2" />
            Recent Activities
          </TabsTrigger>
          <TabsTrigger value="trending">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trending Posts
          </TabsTrigger>

          {user?.role === 'superadmin' && (
            <TabsTrigger value="insights">
              <BarChart className="h-4 w-4 mr-2" />
              Insights
            </TabsTrigger>
          )}
        </TabsList>

        {/* Recent Activities Tab */}
        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Latest 5 actions from all users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentActivities.length > 0 ? (
                  stats.recentActivities.map((activity, index) => (
                    <motion.div
                      key={activity._id || activity.id || index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{getActivityText(activity)}</p>
                          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-3 text-sm text-gray-500">
                            <span className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {getUserDisplayName(activity)}
                            </span>
                            <span className="hidden md:inline">•</span>
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDate(activity.timestamp || activity.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 md:mt-0">
                        <Badge className={getActivityColor(activity.type)}>
                          {activity.type || 'system'}
                        </Badge>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No recent activities</p>
                    <p className="text-sm mt-2">Activities will appear here as users interact with the system</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trending Posts Tab */}
        <TabsContent value="trending">
          <Card>
            <CardHeader>
              <CardTitle>Trending Posts</CardTitle>
              <CardDescription>Most recent published posts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.trendingPosts.length > 0 ? (
                  stats.trendingPosts.map((post, index) => (
                    <motion.div
                      key={post._id || index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => {
                        toast({
                          title: post.title || 'Untitled Post',
                          description: `Status: ${post.status} | Views: ${post.views || 0}`,
                          variant: 'default'
                        });
                      }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl font-bold text-gray-300">{index + 1}</div>
                        <div>
                          <p className="font-medium">{post.title || 'Untitled Post'}</p>
                          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-3 text-sm text-gray-500">
                            <span className="flex items-center">
                              <CalendarDays className="h-3 w-3 mr-1" />
                              {post.publishDateTime || post.createdAt 
                                ? new Date(post.publishDateTime || post.createdAt).toLocaleDateString() 
                                : 'Unknown date'}
                            </span>
                            <span className="hidden md:inline">•</span>
                            <span className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {post.authorId?.name || post.author || 'Unknown Author'}
                            </span>
                            {post.category && (
                              <>
                                <span className="hidden md:inline">•</span>
                                <Badge variant="outline" className="text-xs">
                                  <Tag className="h-2 w-2 mr-1" />
                                  {typeof post.category === 'object' ? post.category.name : post.category}
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 md:mt-0 flex items-center space-x-2">
                        {post.views > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <Eye className="h-2 w-2 mr-1" />
                            {post.views} views
                          </Badge>
                        )}
                        <Badge className={post.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                          {post.status || 'draft'}
                        </Badge>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No published posts available</p>
                    <p className="text-sm mt-2">Publish some posts to see them here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab (Superadmin Only) */}
        {user?.role === 'superadmin' && (
          <TabsContent value="insights">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Health Card */}
              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                  <CardDescription>Real-time system metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Database Connection</span>
                        <Badge variant={stats.systemHealth.database === 'healthy' ? "success" : "warning"}>
                          {stats.systemHealth.database === 'healthy' ? "Connected" : "Warning"}
                        </Badge>
                      </div>
                      <Progress value={stats.systemHealth.database === 'healthy' ? 100 : 50} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">API Performance</span>
                        <Badge variant={stats.systemHealth.api === 'healthy' ? "success" : "warning"}>
                          {stats.systemHealth.api === 'healthy' ? "Optimal" : "Degraded"}
                        </Badge>
                      </div>
                      <Progress value={stats.systemHealth.api === 'healthy' ? 100 : 60} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Category Coverage</span>
                        <span className="text-sm font-medium">{stats.categories.active}/{stats.categories.total}</span>
                      </div>
                      <Progress value={Math.min((stats.categories.active / Math.max(stats.categories.total, 1)) * 100, 100)} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Active Users</span>
                        <span className="text-sm font-medium">{stats.users.active}/{stats.users.total}</span>
                      </div>
                      <Progress value={Math.min((stats.users.active / Math.max(stats.users.total, 1)) * 100, 100)} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Pending Approvals Section (for Superadmin) */}
      {user?.role === 'superadmin' && stats.pendingApprovals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">
              <AlertCircle className="inline h-5 w-5 mr-2" />
              Pending Approvals ({stats.pendingApprovals.length})
            </CardTitle>
            <CardDescription>Items requiring your attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.pendingApprovals.slice(0, 3).map((approval, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-medium">{approval.title || 'Pending Approval'}</p>
                      <p className="text-sm text-gray-600">
                        Submitted by: {approval.author?.name || 'Unknown'} • 
                        Type: {approval.type || 'post'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="destructive">Pending</Badge>
                </div>
              ))}
              {stats.pendingApprovals.length > 3 && (
                <p className="text-sm text-center text-gray-500 mt-2">
                  + {stats.pendingApprovals.length - 3} more pending approvals
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Updated Time */}
      <div className="text-center text-sm text-gray-500">
        <p>Last updated: {stats.lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
        <p className="text-xs mt-1">Updates every 30 seconds • Data for {timeRange}</p>
        <div className="flex justify-center items-center mt-2 space-x-4">
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
            <span className="text-xs">Live</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-orange-500 mr-1"></div>
            <span className="text-xs">Refreshing</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
            <span className="text-xs">Error</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;