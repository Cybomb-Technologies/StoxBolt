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
  Loader2
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
    warning: 'bg-yellow-100 text-yellow-800'
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
      trending: 0
    },
    users: {
      total: 0,
      active: 0,
      admins: 0,
      superadmins: 0
    },
    activities: {
      total: 0,
      recent: 0,
      today: 0
    },
    performance: {
      views: 0,
      engagement: 0,
      completionRate: 0
    },
    recentActivities: [],
    trendingPosts: [],
    userStats: []
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
    
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Create headers object
    const headers = {
      'Authorization': `Bearer ${token}`
    };

    // Fetch all data sequentially instead of Promise.allSettled to avoid response reuse
    const responses = {};

    try {
      // Fetch posts
      const postsRes = await fetch(`${baseURL}/api/posts?limit=100`, { headers });
      responses.posts = await postsRes.json();
    } catch (postsError) {
      console.error('Error fetching posts:', postsError);
      responses.posts = { success: false, data: [], total: 0 };
    }

    try {
      // Fetch admin stats
      const statsRes = await fetch(`${baseURL}/api/users/admins/stats`, { headers });
      responses.stats = await statsRes.json();
    } catch (statsError) {
      console.error('Error fetching stats:', statsError);
      responses.stats = { success: false, data: {} };
    }

    try {
      // Fetch admin users
      const usersRes = await fetch(`${baseURL}/api/users/admins`, { headers });
      responses.users = await usersRes.json();
    } catch (usersError) {
      console.error('Error fetching users:', usersError);
      responses.users = { success: false, data: {} };
    }

    try {
      // Fetch activities (limit to 20 for recent activities)
      const activitiesRes = await fetch(`${baseURL}/api/activities`, { headers });
      responses.activities = await activitiesRes.json();
    } catch (activitiesError) {
      console.error('Error fetching activities:', activitiesError);
      responses.activities = { success: false, data: [] };
    }

    try {
      // Fetch scheduled posts
      const scheduledRes = await fetch(`${baseURL}/api/scheduler/posts`, { headers });
      responses.scheduled = await scheduledRes.json();
    } catch (scheduledError) {
      console.error('Error fetching scheduled posts:', scheduledError);
      responses.scheduled = { success: false, count: 0 };
    }

    // Process posts data
    let postsData = { total: 0, published: 0, draft: 0 };
    if (responses.posts.success) {
      const allPosts = responses.posts.data || [];
      postsData = {
        total: responses.posts.total || allPosts.length,
        published: allPosts.filter(post => post.status === 'published').length,
        draft: allPosts.filter(post => post.status === 'draft').length,
        scheduled: 0 // Will be updated from scheduled response
      };
    }

    // Process scheduled posts
    let scheduledCount = 0;
    if (responses.scheduled.success) {
      scheduledCount = responses.scheduled.count || 0;
    }

    // Process stats data
    const statsData = responses.stats.success ? responses.stats.data : {};

    // Process users data
    const usersData = responses.users.success ? responses.users.data : {};

    // Process activities data
    let activitiesData = [];
    let todayActivitiesCount = 0;
    if (responses.activities.success) {
      activitiesData = responses.activities.data || [];
      
      // Calculate today's activities
      const today = new Date().toISOString().split('T')[0];
      todayActivitiesCount = activitiesData.filter(activity => {
        if (!activity.timestamp && !activity.createdAt) return false;
        const activityDate = activity.timestamp || activity.createdAt;
        try {
          return new Date(activityDate).toISOString().split('T')[0] === today;
        } catch (e) {
          return false;
        }
      }).length;
    }

    // Get trending posts (most recent published posts)
    let trendingPosts = [];
    if (responses.posts.success) {
      trendingPosts = (responses.posts.data || [])
        .filter(post => post.status === 'published')
        .sort((a, b) => {
          try {
            const dateA = new Date(a.createdAt || a.publishDateTime || 0);
            const dateB = new Date(b.createdAt || b.publishDateTime || 0);
            return dateB - dateA;
          } catch (e) {
            return 0;
          }
        })
        .slice(0, 5);
    }

    // Get last 5 activities
    const recentActivities = activitiesData.slice(0, 5);

    // Calculate user stats
    const totalAdmins = statsData.totalAdmins || usersData.total || 0;
    const superadminCount = statsData.superadminCount || 0;
    const activeAdmins = statsData.activeAdmins || 0;

    setStats({
      posts: {
        ...postsData,
        scheduled: scheduledCount,
        trending: trendingPosts.length
      },
      users: {
        total: totalAdmins,
        active: activeAdmins,
        admins: totalAdmins - superadminCount,
        superadmins: superadminCount
      },
      activities: {
        total: activitiesData.length,
        recent: recentActivities.length,
        today: todayActivitiesCount
      },
      performance: {
        // These are calculated from actual data
        views: postsData.total * 100, // You should replace with actual view tracking
        engagement: postsData.total > 0 ? Math.round((postsData.published / postsData.total) * 100) : 0,
        completionRate: postsData.published > 0 ? Math.round((trendingPosts.length / postsData.published) * 100) : 0
      },
      recentActivities,
      trendingPosts,
      userStats: []
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
      'login': <User className="h-4 w-4" />
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
      'login': 'bg-indigo-100 text-indigo-800'
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
          day: 'numeric'
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
      admin_reactivated: 'reactivated admin user'
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
    } else {
      return `${userDisplayName} ${action} "${activity.title || 'item'}"`;
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
            onChange={(e) => setTimeRange(e.target.value)}
            className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
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
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Posts
            </CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(stats.posts.total)}</div>
            <div className="flex items-center justify-between mt-4">
              <div className="space-y-1">
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

        {/* Users Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Users & Admins
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(stats.users.total)}</div>
            <div className="flex items-center justify-between mt-4">
              <div className="space-y-1">
                <div className="flex items-center">
                  <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                  <span className="text-sm">Active: {stats.users.active}</span>
                </div>
                <div className="flex items-center">
                  <Shield className="h-3 w-3 text-orange-500 mr-2" />
                  <span className="text-sm">Admins: {stats.users.admins}</span>
                </div>
                <div className="flex items-center">
                  <Sparkles className="h-3 w-3 text-purple-500 mr-2" />
                  <span className="text-sm">Superadmins: {stats.users.superadmins}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activities Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Activities Today
            </CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(stats.activities.today)}</div>
            <div className="mt-4 space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Total Activities</span>
                  
                </div>
                
              </div>
              <div className="flex items-center text-sm">
                <Clock className="h-3 w-3 mr-2 text-gray-500" />
                <span>Recent: {stats.activities.recent} activities</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Performance
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(stats.performance.views)}</div>
            <p className="text-sm text-gray-500">Total Views</p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-lg font-semibold">{stats.performance.engagement || 0}%</div>
                <p className="text-xs text-gray-500">Engagement</p>
              </div>
              <div>
                <div className="text-lg font-semibold">{stats.performance.completionRate || 0}%</div>
                <p className="text-xs text-gray-500">Read Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
                      className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
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
                            <span className="hidden md:inline">•</span>
                            {post.category && (
                              <Badge variant="outline" className="text-xs">
                                {post.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 md:mt-0">
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
                        <Badge variant={stats.posts.total > 0 ? "success" : "warning"}>
                          {stats.posts.total > 0 ? "Connected" : "Warning"}
                        </Badge>
                      </div>
                      <Progress value={stats.posts.total > 0 ? 100 : 50} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Active Users</span>
                        <span className="text-sm font-medium">{stats.users.active}</span>
                      </div>
                      <Progress value={Math.min((stats.users.active / Math.max(stats.users.total, 1)) * 100, 100)} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Content Published</span>
                        <span className="text-sm font-medium">{stats.posts.published}</span>
                      </div>
                      <Progress value={Math.min((stats.posts.published / Math.max(stats.posts.total, 1)) * 100, 100)} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Activity Distribution Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Activity Distribution</CardTitle>
                  <CardDescription>Breakdown of recent activities</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.recentActivities.length > 0 ? (
                    <div className="space-y-3">
                      {['create', 'update', 'publish', 'delete', 'upload', 'login'].map((type) => {
                        const count = stats.recentActivities.filter(a => a.type === type).length;
                        const percentage = (count / Math.max(stats.recentActivities.length, 1)) * 100;
                        
                        return (
                          <div key={type} className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-sm capitalize">{type}</span>
                              <span className="text-sm font-medium">{count} ({percentage.toFixed(0)}%)</span>
                            </div>
                            <Progress value={percentage} />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No activity data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Last Updated Time */}
      <div className="text-center text-sm text-gray-500">
        <p>Last updated: {new Date().toLocaleTimeString()}</p>
        <p className="text-xs mt-1">Updates every 30 seconds</p>
      </div>
    </div>
  );
};

export default Overview;