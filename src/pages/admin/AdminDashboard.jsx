import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import {
  FileText,
  Upload,
  Calendar,
  Activity,
  Zap,
  LogOut,
  User,
  Shield,
  Users,
  Home,
  BarChart3,
  Settings,
  Menu,
  X,
  ChevronRight,
  PlusCircle,
  List,
  Eye,
  Clock,
  PieChart,
  CheckCircle,
  Send,
  AlertCircle,
  Bell
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [pendingScheduleApprovals, setPendingScheduleApprovals] = useState(0);
  const [userLastLogin, setUserLastLogin] = useState('');
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [userPendingSubmissions, setUserPendingSubmissions] = useState(0);

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  const mainContentRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL || 'https://api.stoxbolt.com';

  // Check if user is superadmin
  const isSuperadmin = user?.role === 'superadmin';

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch pending approvals count for superadmin
  useEffect(() => {
    if (isSuperadmin) {
      fetchPendingApprovals();
      fetchPendingScheduleApprovals();
    }
  }, [isSuperadmin]);

  // Fetch user data including pending submissions
  useEffect(() => {
    if (user) {
      fetchUserLastLogin();
      if (user.role === 'admin') {
        fetchUserPendingSubmissions();
      }
      // Fetch notifications when user is available
      fetchNotifications();
    }
  }, [user]);

  // Setup Socket.IO for real-time notifications
  useEffect(() => {
    // Check if Socket.IO is available
    if (window.io) {
      console.log('Socket.IO connected');

      // Listen for new notifications
      window.io.on('newNotification', (data) => {
        console.log('New notification received:', data);
        setNotifications(prev => [data.notification, ...prev]);
        setUnreadCount(data.unreadCount);
      });
    }

    // Cleanup on unmount
    return () => {
      if (window.io) {
        window.io.off('newNotification');
      }
    };
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/approval/posts?status=pending_review&limit=1`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setPendingApprovals(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    }
  };

  const fetchPendingScheduleApprovals = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/posts/pending-schedule`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setPendingScheduleApprovals(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching pending schedule approvals:', error);
    }
  };

  const fetchUserLastLogin = async () => {
    try {
      if (user?.lastLogin) {
        setUserLastLogin(new Date(user.lastLogin).toLocaleString());
        return;
      }

      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/auth/user`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const data = await response.json();
      if (data.success && data.user?.lastLogin) {
        setUserLastLogin(new Date(data.user.lastLogin).toLocaleString());
      } else {
        setUserLastLogin('First login');
      }
    } catch (error) {
      console.error('Error fetching user last login:', error);
      setUserLastLogin('First login');
    }
  };

  const fetchUserPendingSubmissions = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');

      const response = await fetch(`${API_URL}/api/approval/posts/my-pending`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setUserPendingSubmissions(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching user pending submissions:', error);
    }
  };

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      console.log('Fetching notifications...');
      const token = localStorage.getItem('adminToken');

      if (!token) {
        console.error('No token found');
        return;
      }

      const response = await fetch(`${API_URL}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Notifications data:', data);

      if (data.success) {
        // Sort notifications by date (newest first)
        const sortedNotifications = data.notifications.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setNotifications(sortedNotifications);
        setUnreadCount(data.unreadCount || 0);
      } else {
        console.error('API returned error:', data.message);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setUnreadCount(data.unreadCount);
        setNotifications((prev) =>
          prev.map((notif) =>
            notif._id === notificationId ? { ...notif, isRead: true } : notif
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Handle notification click with updated routing
  const handleNotificationClick = (notification) => {
    markAsRead(notification._id);

    // Redirect based on notification type with new mapping
    switch (notification.type) {
      case 'create-post':
        navigate('/admin/posts/list');
        break;
      case 'rss-feed':
        navigate('/admin/rss-import');
        break;
      case 'create-category':
        navigate('/admin/categories');
        break;
      case 'admin-post':
        navigate('/admin/approval');
        break;
      case 'newsletter':
        // Handle newsletter if needed
        break;
      case 'coupon':
        // Handle coupon if needed
        break;
      case 'user':
        // Handle user if needed
        break;
      default:
        // Default navigation or stay
        break;
    }

    setShowNotifications(false);
  };

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Auth context will redirect
  }

  // Dynamic navigation items based on user role
  const getNavItems = () => {
    const baseNavItems = [
      {
        title: 'Overview',
        path: '/admin/overview',
        icon: <PieChart className="h-5 w-5" />,
        roles: ['admin', 'superadmin'],
        description: 'Dashboard analytics'
      },
      {
        title: 'All Posts',
        path: '/admin/posts/list',
        icon: <List className="h-5 w-5" />,
        roles: ['admin', 'superadmin'],
        description: 'Manage all posts'
      },
      {
        title: 'Create Post',
        path: user?.role === 'admin' ? '/admin/posts/new-approval' : '/admin/posts/new',
        icon: <PlusCircle className="h-5 w-5" />,
        roles: ['admin', 'superadmin'],
        description: user?.role === 'admin' ? 'Create post (needs approval)' : 'Create new post'
      },
      {
        title: 'RSS Import',
        path: '/admin/rss-import',
        icon: <PlusCircle className="h-5 w-5" />,
        roles: ['admin', 'superadmin'],
        description: 'Import posts from RSS feed'
      },
      {
        title: 'Categories',
        path: '/admin/categories',
        icon: <PlusCircle className="h-5 w-5" />,
        roles: ['admin', 'superadmin'],
        description: 'Manage categories'
      },
      {
        title: 'My Submissions',
        path: '/admin/my-approvals',
        icon: <Send className="h-5 w-5" />,
        roles: ['admin'],
        description: 'Track your approval requests',
        showBadge: true,
        badgeCount: userPendingSubmissions
      },
      {
        title: 'Approval Queue',
        path: '/admin/approval',
        icon: <CheckCircle className="h-5 w-5" />,
        roles: ['superadmin'],
        description: 'Review pending approvals',
        showBadge: true,
        badgeCount: pendingApprovals
      },
      {
        title: 'Schedule Approvals',
        path: '/admin/schedule-approvals',
        icon: <Clock className="h-5 w-5" />,
        roles: ['superadmin'],
        description: 'Approve scheduled posts',
        showBadge: true,
        badgeCount: pendingScheduleApprovals
      },
      {
        title: 'Bulk Upload',
        path: '/admin/bulk-upload',
        icon: <Upload className="h-5 w-5" />,
        roles: ['superadmin'],
        description: 'Upload multiple posts'
      },
      {
        title: 'Scheduler',
        path: '/admin/scheduler',
        icon: <Calendar className="h-5 w-5" />,
        roles: ['admin', 'superadmin'],
        description: 'Schedule publications'
      },
      {
        title: 'Activity Log',
        path: '/admin/activity',
        icon: <Activity className="h-5 w-5" />,
        roles: ['superadmin'],
        description: 'View system activities'
      },
      {
        title: 'Preview',
        path: '/admin/preview',
        icon: <Eye className="h-5 w-5" />,
        roles: ['admin', 'superadmin'],
        description: 'Preview posts'
      },
    ];

    // Admin management items (superadmin only)
    const adminManagementItems = {
      title: 'Admin Management',
      path: '/admin/users',
      icon: <Shield className="h-5 w-5" />,
      roles: ['superadmin'],
      description: 'Manage admin users',
      subItems: [
        {
          title: 'All Admins',
          path: '/admin/users',
          icon: <Users className="h-4 w-4" />,
        },
        {
          title: 'Create Admin',
          path: '/admin/users/create',
          icon: <User className="h-4 w-4" />,
        },
      ],
    };

    // Filter nav items based on user role
    const filteredNavItems = baseNavItems.filter(item =>
      item.roles.includes(user?.role)
    );

    // Add admin management if user is superadmin
    if (isSuperadmin) {
      filteredNavItems.push(adminManagementItems);
    }

    return filteredNavItems;
  };

  const navItems = getNavItems();

  const getPageTitle = () => {
    const currentPath = location.pathname;

    // Check main items
    for (const item of navItems) {
      if (currentPath === item.path) {
        return item.title;
      }
      // Check if it's a sub-item path
      if (item.subItems) {
        for (const subItem of item.subItems) {
          if (currentPath === subItem.path) {
            return subItem.title;
          }
        }
      }
    }

    // Check for nested routes
    if (currentPath.includes('/admin/posts/edit/')) {
      return 'Edit Post';
    }
    if (currentPath.includes('/admin/users/edit/')) {
      return 'Edit Admin';
    }
    if (currentPath === '/admin') {
      return 'Overview';
    }

    // Default title
    return 'Dashboard';
  };

  const getPageDescription = () => {
    const currentPath = location.pathname;

    for (const item of navItems) {
      if (currentPath === item.path) {
        return item.description;
      }
      if (item.subItems) {
        for (const subItem of item.subItems) {
          if (currentPath === subItem.path) {
            return item.description;
          }
        }
      }
    }

    if (currentPath.includes('/admin/posts/edit/')) {
      return 'Edit existing post';
    }
    if (currentPath.includes('/admin/users/edit/')) {
      return 'Edit admin user details';
    }
    if (currentPath === '/admin') {
      return 'Dashboard analytics';
    }

    return 'StoxBolt Content Management System';
  };

  const isActive = (path) => {
    if (path === '/admin/overview' && location.pathname === '/admin') return false;
    if (location.pathname === path) return true;
    // Check if current path starts with this path (for nested routes)
    if (path !== '/admin' && path !== '/admin/overview' &&
      location.pathname.startsWith(path) && path !== '/admin/approval') {
      return true;
    }
    return false;
  };

  const isSubActive = (subItems) => {
    if (!subItems) return false;
    return subItems.some(subItem => location.pathname === subItem.path || location.pathname.startsWith(subItem.path));
  };

  return (
    <>
      <Helmet>
        <title>{getPageTitle()} - StoxBolt Admin</title>
        <meta name="description" content={getPageDescription()} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Fixed Sidebar - Starts from top */}
        <motion.aside
          initial={false}
          animate={{
            width: sidebarOpen ? (isMobile ? '280px' : '280px') : '0px',
            opacity: sidebarOpen ? 1 : 0,
            left: sidebarOpen ? '0px' : '-280px',
          }}
          transition={{ duration: 0.3 }}
          className={`fixed h-screen bg-white shadow-xl border-r border-gray-200 overflow-hidden z-40 ${sidebarOpen ? 'block' : 'hidden lg:block'
            }`}
          style={{
            top: '0px',
            height: '100vh',
          }}
        >
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 rounded-xl flex items-center justify-center shrink-0">
                <Zap className="text-white h-6 w-6" />
              </div>
              {sidebarOpen && (
                <div className="overflow-hidden">
                  <h1 className="text-lg font-bold text-gray-900 whitespace-nowrap">StoxBolt Admin</h1>
                  <p className="text-xs text-gray-600 whitespace-nowrap">Content Management System</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto" style={{
            maxHeight: 'calc(100vh - 180px)',
            minHeight: '500px'
          }}>
            {navItems.map((item) => {
              const active = isActive(item.path) || (item.subItems && isSubActive(item.subItems));
              const badgeCount = item.badgeCount || 0;

              return (
                <div key={item.path || item.title}>
                  <Link
                    to={item.path}
                    onClick={() => isMobile && setSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all group relative ${active
                        ? 'bg-gradient-to-r from-orange-50 to-red-50 text-orange-700 border-l-4 border-orange-500'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    title={sidebarOpen ? '' : item.title}
                  >
                    <div className={`${active ? 'text-orange-600' : 'text-gray-500 group-hover:text-gray-700'}`}>
                      {item.icon}
                    </div>
                    {sidebarOpen && (
                      <>
                        <span className="font-medium flex-1">{item.title}</span>
                        {/* Dynamic badge for pending items */}
                        {item.showBadge && badgeCount > 0 && (
                          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                            {badgeCount}
                          </span>
                        )}
                        {item.showBadge && badgeCount === 0 && (
                          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-gray-400 bg-gray-200 rounded-full">
                            0
                          </span>
                        )}
                        {active && item.subItems && (
                          <ChevronRight className="h-4 w-4 text-orange-500" />
                        )}
                      </>
                    )}
                    {/* Badge for collapsed sidebar */}
                    {!sidebarOpen && item.showBadge && badgeCount > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
                        {badgeCount > 9 ? '9+' : badgeCount}
                      </span>
                    )}
                  </Link>

                  {/* Sub-items (only show when sidebar is open) */}
                  {sidebarOpen && item.subItems && active && (
                    <div className="ml-10 mt-1 space-y-1">
                      {item.subItems.map((subItem) => {
                        const subActive = location.pathname === subItem.path || location.pathname.startsWith(subItem.path);
                        return (
                          <Link
                            key={subItem.path}
                            to={subItem.path}
                            onClick={() => isMobile && setSidebarOpen(false)}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all ${subActive
                                ? 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }`}
                          >
                            <div className={`${subActive ? 'text-orange-600' : 'text-gray-500'}`}>
                              {subItem.icon}
                            </div>
                            <span>{subItem.title}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Logout Button - Always visible and properly positioned */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white">
            <button
              onClick={handleLogout}
              className={`flex items-center ${sidebarOpen ? 'justify-start space-x-3 px-3' : 'justify-center'} w-full py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors`}
              title={sidebarOpen ? '' : 'Logout'}
            >
              <LogOut className="h-5 w-5" />
              {sidebarOpen && <span className="font-medium">Logout</span>}
            </button>
          </div>
        </motion.aside>

        {/* Fixed Header - Starts after sidebar */}
        <header
          className="fixed top-0 right-0 bg-white shadow-sm border-b z-30"
          style={{
            left: sidebarOpen && !isMobile ? '280px' : '0px',
            transition: 'left 0.3s ease',
            height: '64px'
          }}
        >
          <div className="h-full px-6">
            <div className="flex items-center justify-between h-full">
              <div className="flex items-center space-x-4">
                {/* Mobile toggle button */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden flex p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                  <Menu className="h-5 w-5 text-gray-600" />
                </button>

                {/* Desktop toggle button */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                  <Menu className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              {/* Page title and description */}
              <div className="flex-1 text-center">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  {getPageTitle()}
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  {getPageDescription()}
                </p>
              </div>

              {/* User info and notifications */}
              <div className="flex items-center space-x-4">
                {/* Notification Button */}
                <div className="relative" ref={notificationRef}>
                  <button
                    className="relative flex items-center justify-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={() => setShowNotifications(!showNotifications)}
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Popup */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                      <div className="p-4 border-b border-gray-100">
                        <div className="flex justify-between items-center">
                          <h3 className="font-bold text-gray-900">Notifications</h3>
                          {unreadCount > 0 && (
                            <span className="text-xs text-red-600 font-medium">
                              {unreadCount} unread
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            No notifications
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification._id}
                              className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.isRead ? 'bg-blue-50' : ''
                                }`}
                              onClick={() => handleNotificationClick(notification)}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex justify-between items-center mb-1">
                                    <h4 className="font-medium text-gray-900">{notification.title}</h4>
                                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full capitalize">
                                      {notification.type?.replace(/-/g, ' ')}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                                  <span className="text-xs text-gray-500">
                                    {new Date(notification.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                {!notification.isRead && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {isSuperadmin && pendingApprovals > 0 && (
                  <Link
                    to="/admin/approval"
                    className="relative flex items-center space-x-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">{pendingApprovals} pending</span>
                    <span className="absolute -top-1 -right-1 inline-flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                  </Link>
                )}
                {user.role === 'admin' && userPendingSubmissions > 0 && (
                  <Link
                    to="/admin/my-approvals"
                    className="relative flex items-center space-x-2 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
                  >
                    <Send className="h-5 w-5" />
                    <span className="font-medium">{userPendingSubmissions} pending</span>
                    <span className="absolute -top-1 -right-1 inline-flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                    </span>
                  </Link>
                )}
                {isSuperadmin && pendingScheduleApprovals > 0 && (
                  <Link
                    to="/admin/schedule-approvals"
                    className="relative flex items-center space-x-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <Clock className="h-5 w-5" />
                    <span className="font-medium">{pendingScheduleApprovals} schedule</span>
                    <span className="absolute -top-1 -right-1 inline-flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                    </span>
                  </Link>
                )}
                <div className="hidden md:flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${user.role === 'superadmin'
                      ? 'bg-gradient-to-br from-purple-100 to-purple-200'
                      : 'bg-gradient-to-br from-orange-100 to-red-100'
                    }`}>
                    {user.role === 'superadmin' ? (
                      <Shield className="h-4 w-4 text-purple-600" />
                    ) : (
                      <User className="h-4 w-4 text-orange-600" />
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className={`text-xs capitalize ${user.role === 'superadmin' ? 'text-purple-600' : 'text-orange-600'
                      }`}>
                      {user.role === 'superadmin' ? 'Superadmin' : 'Admin'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main
          ref={mainContentRef}
          className="flex-1 min-h-screen overflow-auto"
          style={{
            marginTop: '64px',
            marginLeft: sidebarOpen && !isMobile ? '280px' : '0px',
            transition: 'margin-left 0.3s ease'
          }}
        >
          {/* Page Content */}
          <div className="p-4 md:p-6">
            <Outlet />
          </div>

          {/* Mobile Overlay */}
          {sidebarOpen && isMobile && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-20"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </main>
      </div>
    </>
  );
};

export default AdminDashboard;