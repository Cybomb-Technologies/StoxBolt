import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  UserPlus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Loader2, 
  UserCheck, 
  UserX, 
  Shield,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  KeyRound,
  MoreVertical,
  AlertCircle,
  Eye,
  Lock,
  Users,
  Activity,
  ToggleLeft,
  ToggleRight,
  Key,
  Unlock
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdminList = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filterCRUD, setFilterCRUD] = useState('all');
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [actionType, setActionType] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [stats, setStats] = useState({
    totalAdmins: 0,
    activeAdmins: 0,
    inactiveAdmins: 0,
    superadminCount: 0,
    adminsWithCRUD: 0,
    adminsWithoutCRUD: 0
  });
  const navigate = useNavigate();
  const itemsPerPage = 10;

  useEffect(() => {
    fetchAdmins();
    fetchStats();
  }, [currentPage]);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${baseURL}/api/users/admins`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `Failed to fetch admins (${response.status})`);
      }

      if (data.success) {
        let filteredAdmins = data.data || [];
        
        // Apply filters
        if (filterStatus !== 'all') {
          filteredAdmins = filteredAdmins.filter(admin => 
            filterStatus === 'active' ? admin.isActive : !admin.isActive
          );
        }
        
        if (filterRole !== 'all') {
          filteredAdmins = filteredAdmins.filter(admin => admin.role === filterRole);
        }
        
        // Apply CRUD filter
        if (filterCRUD !== 'all') {
          filteredAdmins = filteredAdmins.filter(admin => 
            filterCRUD === 'with' ? admin.curdAccess : !admin.curdAccess
          );
        }
        
        // Apply search
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredAdmins = filteredAdmins.filter(admin => 
            admin.name.toLowerCase().includes(query) || 
            admin.email.toLowerCase().includes(query)
          );
        }
        
        // Calculate pagination
        const totalFiltered = filteredAdmins.length;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedAdmins = filteredAdmins.slice(startIndex, endIndex);
        
        setAdmins(paginatedAdmins);
        setTotalPages(Math.ceil(totalFiltered / itemsPerPage));
        setTotalAdmins(totalFiltered);
      } else {
        throw new Error(data.message || 'Failed to load admins');
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error(error.message || 'Failed to load admins', {
        position: "top-right",
        autoClose: 5000,
      });
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${baseURL}/api/users/admins/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // No toast for stats failure as it's not critical
    }
  };

  const handleAction = async () => {
    if (!selectedAdmin || !actionType) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = '';
      let method = 'PUT';
      let successMessage = '';

      switch (actionType) {
        case 'deactivate':
          url = `${baseURL}/api/users/admins/${selectedAdmin._id}/deactivate`;
          successMessage = `${selectedAdmin.name} has been deactivated`;
          break;
        case 'reactivate':
          url = `${baseURL}/api/users/admins/${selectedAdmin._id}/reactivate`;
          successMessage = `${selectedAdmin.name} has been reactivated`;
          break;
        case 'delete':
          // Note: You need to implement DELETE endpoint in backend
          url = `${baseURL}/api/users/admins/${selectedAdmin._id}`;
          method = 'DELETE';
          successMessage = `${selectedAdmin.name} has been deleted`;
          break;
        case 'toggle-curd':
          url = `${baseURL}/api/users/admins/${selectedAdmin._id}/toggle-curd`;
          successMessage = `CRUD access ${selectedAdmin.curdAccess ? 'disabled' : 'enabled'} for ${selectedAdmin.name}`;
          break;
        default:
          return;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `Failed to ${actionType} admin`);
      }

      if (data.success) {
        // Show success toast
        if (actionType === 'toggle-curd') {
          toast.info(successMessage, {
            position: "top-right",
            autoClose: 4000,
          });
        } else {
          toast.success(successMessage, {
            position: "top-right",
            autoClose: 3000,
          });
        }
        
        // Refresh data
        fetchAdmins();
        fetchStats();
      }
    } catch (error) {
      toast.error(error.message || 'Operation failed', {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setActionLoading(false);
      setShowConfirmDialog(false);
      setSelectedAdmin(null);
      setActionType('');
    }
  };

  const handleToggleCRUD = (admin) => {
    setSelectedAdmin(admin);
    setActionType('toggle-curd');
    setShowConfirmDialog(true);
  };

  const handleResetPassword = async (adminId, adminName) => {
    toast.info(`Password reset for ${adminName} will be available soon`, {
      position: "top-right",
      autoClose: 3000,
    });
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
        <XCircle className="h-3 w-3 mr-1" />
        Inactive
      </span>
    );
  };

  const getRoleBadge = (role) => {
    if (role === 'superadmin') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
          <Shield className="h-3 w-3 mr-1" />
          Super Admin
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
        <Shield className="h-3 w-3 mr-1" />
        Admin
      </span>
    );
  };

  const getCRUDBadge = (curdAccess, role) => {
    if (role === 'superadmin') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
          <Lock className="h-3 w-3 mr-1" />
          Full Access
        </span>
      );
    }
    
    if (curdAccess) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          <Unlock className="h-3 w-3 mr-1" />
          CRUD Mode
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
        <Key className="h-3 w-3 mr-1" />
        Approval Mode
      </span>
    );
  };

  const handleFilterApply = () => {
    setCurrentPage(1);
    fetchAdmins();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setFilterRole('all');
    setFilterCRUD('all');
    setCurrentPage(1);
    fetchAdmins();
  };

  const openConfirmDialog = (admin, type) => {
    setSelectedAdmin(admin);
    setActionType(type);
    setShowConfirmDialog(true);
  };

  if (loading && currentPage === 1) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading admins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Management</h1>
              <p className="text-gray-600 mt-2">Manage and monitor system administrators</p>
            </div>
            <button
              onClick={() => navigate('/admin/users/create')}
              className="inline-flex items-center px-4 py-2.5 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Create Admin
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Admins</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalAdmins}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.activeAdmins}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.inactiveAdmins}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
                <UserX className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">CRUD Access</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.adminsWithCRUD || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Direct CRUD Mode</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <Unlock className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approval Mode</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.adminsWithoutCRUD || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Requires Approval</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Key className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Card Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Admin Users</h2>
                <p className="text-sm text-gray-600">Manage all system administrators</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  <Shield className="h-3 w-3 mr-1" />
                  Superadmin View
                </span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
                
                <select
                  value={filterCRUD}
                  onChange={(e) => setFilterCRUD(e.target.value)}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
                >
                  <option value="all">All Modes</option>
                  <option value="with">CRUD Mode</option>
                  <option value="without">Approval Mode</option>
                </select>
                
                <button
                  onClick={handleFilterApply}
                  className="px-4 py-2.5 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
                >
                  Apply Filters
                </button>
                
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Clear
                </button>
                
                <button
                  onClick={fetchAdmins}
                  disabled={loading}
                  className="px-3 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            
            {/* Results count */}
            <div className="mt-4 flex items-center justify-between text-sm">
              <p className="text-gray-600">
                Showing {admins.length} of {totalAdmins} admins
              </p>
              {loading && (
                <div className="flex items-center text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </div>
              )}
            </div>
          </div>

          {/* Admins List */}
          <div className="divide-y divide-gray-200">
            {admins.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery || filterStatus !== 'all' || filterRole !== 'all' || filterCRUD !== 'all'
                    ? 'No matching admins found'
                    : 'No admins yet'
                  }
                </h3>
                <p className="text-gray-600 max-w-md mx-auto mb-6">
                  {searchQuery || filterStatus !== 'all' || filterRole !== 'all' || filterCRUD !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Get started by creating your first admin user'
                  }
                </p>
                <button
                  onClick={() => navigate('/admin/users/create')}
                  className="inline-flex items-center px-4 py-2.5 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
                >
                  <UserPlus className="h-5 w-5 mr-2" />
                  Create New Admin
                </button>
              </div>
            ) : (
              admins.map((admin) => (
                <div key={admin._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center flex-shrink-0">
                        <Shield className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{admin.name}</h3>
                          {getRoleBadge(admin.role)}
                          {getStatusBadge(admin.isActive)}
                          {getCRUDBadge(admin.curdAccess, admin.role)}
                        </div>
                        <div className="flex items-center text-gray-600 text-sm mb-1">
                          <Mail className="h-3 w-3 mr-2" />
                          {admin.email}
                        </div>
                        <div className="flex items-center text-gray-500 text-sm">
                          <Calendar className="h-3 w-3 mr-2" />
                          Created {formatDate(admin.createdAt)}
                          {admin.role === 'admin' && (
                            <span className="ml-4">
                              Mode: {admin.curdAccess ? 'CRUD' : 'Approval'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* CRUD Toggle Button - Only for regular admins */}
                      {admin.role === 'admin' && (
                        <button
                          onClick={() => handleToggleCRUD(admin)}
                          className={`p-2 rounded-lg transition-colors ${admin.curdAccess 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          }`}
                          title={admin.curdAccess ? "Switch to Approval Mode" : "Switch to CRUD Mode"}
                        >
                          {admin.curdAccess ? (
                            <ToggleRight className="h-5 w-5" />
                          ) : (
                            <ToggleLeft className="h-5 w-5" />
                          )}
                        </button>
                      )}
                      
                      <button
                        onClick={() => navigate(`/admin/users/edit/${admin._id}`)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Admin"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      
                      {admin.isActive ? (
                        <button
                          onClick={() => openConfirmDialog(admin, 'deactivate')}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Deactivate Admin"
                        >
                          <UserX className="h-5 w-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => openConfirmDialog(admin, 'reactivate')}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Reactivate Admin"
                        >
                          <UserCheck className="h-5 w-5" />
                        </button>
                      )}
                      
                      {admin.role !== 'superadmin' && (
                        <button
                          onClick={() => openConfirmDialog(admin, 'delete')}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Admin"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex items-center mb-4">
                <AlertCircle className="h-6 w-6 text-orange-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {actionType === 'deactivate' && 'Deactivate Admin'}
                  {actionType === 'reactivate' && 'Reactivate Admin'}
                  {actionType === 'delete' && 'Delete Admin'}
                  {actionType === 'toggle-curd' && (selectedAdmin?.curdAccess ? 'Disable CRUD Access' : 'Enable CRUD Access')}
                </h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                {actionType === 'deactivate' && (
                  `Are you sure you want to deactivate ${selectedAdmin?.name}? They will lose access to the admin panel.`
                )}
                {actionType === 'reactivate' && (
                  `Are you sure you want to reactivate ${selectedAdmin?.name}? They will regain access to the admin panel.`
                )}
                {actionType === 'delete' && (
                  `Are you sure you want to permanently delete ${selectedAdmin?.name}? This action cannot be undone.`
                )}
                {actionType === 'toggle-curd' && (
                  selectedAdmin?.curdAccess 
                    ? `Are you sure you want to disable CRUD access for ${selectedAdmin?.name}? They will switch to Approval Mode and need approval for published posts.`
                    : `Are you sure you want to enable CRUD access for ${selectedAdmin?.name}? They will switch to CRUD Mode and can directly create, update, and delete posts.`
                )}
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={actionLoading}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  disabled={actionLoading}
                  className={`px-4 py-2.5 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 ${
                    actionType === 'delete'
                      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                      : actionType === 'toggle-curd'
                      ? selectedAdmin?.curdAccess
                        ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                        : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                      : 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
                  }`}
                >
                  {actionLoading ? (
                    <span className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </span>
                  ) : (
                    <>
                      {actionType === 'deactivate' && 'Deactivate'}
                      {actionType === 'reactivate' && 'Reactivate'}
                      {actionType === 'delete' && 'Delete'}
                      {actionType === 'toggle-curd' && (
                        selectedAdmin?.curdAccess ? 'Disable CRUD' : 'Enable CRUD'
                      )}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminList;