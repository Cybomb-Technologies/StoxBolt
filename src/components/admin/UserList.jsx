import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  Search, 
  RefreshCw, 
  User, 
  Mail, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Shield,
  CheckCircle,
  XCircle,
  Globe
} from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const baseURL = import.meta.env.VITE_API_URL || 'https://api.stoxbolt.com';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      
      if (!adminToken) {
        throw new Error('No authentication token found');
      }

      let url = `${baseURL}/api/users/regular?page=${currentPage}&limit=${itemsPerPage}`;
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to fetch users (${response.status})`);
      }

      if (data.success) {
        setUsers(data.data || []);
        setTotalUsers(data.pagination.total);
        setTotalPages(data.pagination.pages);
      } else {
        throw new Error(data.message || 'Failed to load users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(error.message || 'Failed to load users', {
        position: "top-right",
        autoClose: 5000,
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
    // Needed to trigger refetch since searchQuery state update is async, 
    // but better to just let effect handle it if we depend on it, 
    // or manually call fetchUsers after state update. 
    // Here we'll rely on the user clicking search or just clearing and re-fetching manually 
    // if using a form submit, but for better UX let's call it.
    // However, since state update is async, we'll use a small timeout or just pass empty string to fetch.
    
    // Actually, simpler to just set state and let user hit enter or button, 
    // or debounce. For this simple implementation, let's just reset state.
    // To immediately fetch, we'd need to bypass the state for the call.
    setTimeout(() => {
       // A bit hacky but ensures state is updated. 
       // Better approach is to rely on useEffect if searchQuery was in dep array,
       // but we only want to fetch on specific actions to avoid API spam.
       // So we'll manually call:
       const adminToken = localStorage.getItem('adminToken');
       fetch(`${baseURL}/api/users/regular?page=1&limit=${itemsPerPage}`, {
          headers: {'Authorization': `Bearer ${adminToken}`}
       })
       .then(res => res.json())
       .then(data => {
         if(data.success) {
           setUsers(data.data);
           setTotalUsers(data.pagination.total);
           setTotalPages(data.pagination.pages);
         }
       })
       .catch(console.error);
    }, 0);
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-2">View and manage registered users</p>
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Card Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Registered Users</h2>
                <p className="text-sm text-gray-600">Total {totalUsers} users</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by username or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
                >
                  Search
                </button>
                
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  >
                    Clear
                  </button>
                )}

                <button
                  type="button"
                  onClick={fetchUsers}
                  className="px-3 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </form>
          </div>

          {/* Users List */}
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-orange-600 mx-auto mb-4" />
                  <p className="text-gray-600">Loading users...</p>
                </div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                 <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                 <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
                 <p className="text-gray-600">
                   {searchQuery ? `No users matching "${searchQuery}"` : 'No registered users found.'}
                 </p>
              </div>
            ) : (
              users.map((user) => (
                <div key={user._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 border border-gray-300">
                         {user.googleProfilePicture ? (
                           <img src={user.googleProfilePicture} alt={user.username} className="h-full w-full object-cover" />
                         ) : (
                           <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200 text-blue-700 font-bold text-lg">
                             {user.username?.charAt(0).toUpperCase() || 'U'}
                           </div>
                         )}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{user.username}</h3>
                          {user.googleId && (
                             <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                               <Globe className="h-3 w-3 mr-1" />
                               Google
                             </span>
                          )}
                          {!user.googleId && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              <User className="h-3 w-3 mr-1" />
                              Manual
                            </span>
                          )}
                        </div>
                        <div className="flex items-center text-gray-600 text-sm mb-1">
                          <Mail className="h-3 w-3 mr-2" />
                          {user.email}
                        </div>
                        <div className="flex items-center text-gray-500 text-sm">
                          <Calendar className="h-3 w-3 mr-2" />
                          Joined {formatDate(user.createdAt)}
                        </div>
                      </div>
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
    </div>
  );
};

export default UserList;
