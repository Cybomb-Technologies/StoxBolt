
import React, { useState, useEffect } from 'react';
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
  PieChart
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check if user is superadmin
  const isSuperadmin = user?.role === 'superadmin';

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
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

  // Navigation items that map to your existing pages
  const navItems = [
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
      path: '/admin/posts/new',
      icon: <PlusCircle className="h-5 w-5" />,
      roles: ['admin', 'superadmin'],
      description: 'Create new content'
    },
    {
      title: 'Bulk Upload',
      path: '/admin/bulk-upload',
      icon: <Upload className="h-5 w-5" />,
      roles: ['admin', 'superadmin'],
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

  // Add admin management if user is superadmin
  const filteredNavItems = [...navItems];
  if (isSuperadmin) {
    filteredNavItems.push(adminManagementItems);
  }

  const getPageTitle = () => {
    const currentPath = location.pathname;
    
    // Check main items
    for (const item of navItems) {
      if (currentPath === item.path || (item.path === '/admin' && currentPath === '/admin')) {
        return item.title;
      }
    }
    
    // Check admin management sub-items
    if (adminManagementItems.subItems) {
      for (const subItem of adminManagementItems.subItems) {
        if (currentPath === subItem.path) {
          return subItem.title;
        }
      }
    }
    
    // Default title
    return 'Dashboard';
  };

  const getPageDescription = () => {
    const currentPath = location.pathname;
    
    for (const item of navItems) {
      if (currentPath === item.path || (item.path === '/admin' && currentPath === '/admin')) {
        return item.description;
      }
    }
    
    return 'StoxBolt Content Management System';
  };

  const isActive = (path) => {
    if (path === '/admin' && location.pathname === '/admin') return true;
    return location.pathname === path;
  };

  const isSubActive = (subItems) => {
    if (!subItems) return false;
    return subItems.some(subItem => location.pathname === subItem.path);
  };

  return (
    <>
      <Helmet>
        <title>{getPageTitle()} - StoxBolt Admin</title>
        <meta name="description" content={getPageDescription()} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white shadow-sm border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <Zap className="text-white h-5 w-5" />
              </div>
              <span className="font-bold text-gray-900">StoxBolt</span>
            </div>
            <div className="w-10"></div>
          </div>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <motion.aside
            initial={false}
            animate={{
              width: sidebarOpen ? (isMobile ? '280px' : '280px') : '0px',
              opacity: sidebarOpen ? 1 : 0,
            }}
            transition={{ duration: 0.3 }}
            className={`fixed lg:relative h-screen bg-white shadow-xl border-r border-gray-200 overflow-hidden z-50 ${
              sidebarOpen ? 'block' : 'hidden lg:block lg:w-20'
            }`}
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

            {/* User Profile */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  user.role === 'superadmin' 
                    ? 'bg-gradient-to-br from-purple-100 to-purple-200' 
                    : 'bg-gradient-to-br from-orange-100 to-red-100'
                }`}>
                  {user.role === 'superadmin' ? (
                    <Shield className="h-5 w-5 text-purple-600" />
                  ) : (
                    <User className="h-5 w-5 text-orange-600" />
                  )}
                </div>
                {sidebarOpen && (
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                    <p className={`text-xs font-medium capitalize truncate ${
                      user.role === 'superadmin' ? 'text-purple-600' : 'text-orange-600'
                    }`}>
                      {user.role === 'superadmin' ? 'Superadmin' : 'Admin'}
                    </p>
                  </div>
                )}
              </div>
              {sidebarOpen && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 truncate">
                    Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'First login'}
                  </p>
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {filteredNavItems.map((item) => {
                const active = isActive(item.path) || (item.subItems && isSubActive(item.subItems));
                
                return (
                  <div key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => isMobile && setSidebarOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all group ${
                        active
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
                          {active && item.subItems && (
                            <ChevronRight className="h-4 w-4 text-orange-500" />
                          )}
                        </>
                      )}
                    </Link>
                    
                    {/* Sub-items (only show when sidebar is open) */}
                    {sidebarOpen && item.subItems && active && (
                      <div className="ml-10 mt-1 space-y-1">
                        {item.subItems.map((subItem) => {
                          const subActive = location.pathname === subItem.path;
                          return (
                            <Link
                              key={subItem.path}
                              to={subItem.path}
                              onClick={() => isMobile && setSidebarOpen(false)}
                              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all ${
                                subActive
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

            {/* Logout Button */}
            <div className="p-4 border-t border-gray-100">
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

          {/* Main Content */}
          <main className="flex-1 min-h-screen overflow-auto">
            {/* Top Bar */}
            <div className="bg-white shadow-sm border-b">
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                   <div className="flex items-center space-x-4">
                    {/* Toggle sidebar button for desktop */}
                    <button
                      onClick={() => setSidebarOpen(!sidebarOpen)}
                      className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                    >
                      <Menu className="h-5 w-5 text-gray-600" />
                    </button>   
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                      {getPageTitle()}
                    </h1>
                    <p className="text-gray-600 text-sm mt-1">
                      {getPageDescription()}
                    </p>
                  </div>
                  
                 
                </div>
              </div>
            </div>

            {/* Page Content */}
            <div className="p-4 md:p-6">
              <Outlet />
            </div>

            {/* Mobile Overlay */}
            {sidebarOpen && isMobile && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
