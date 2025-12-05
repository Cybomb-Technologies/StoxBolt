import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false, requireSuperadmin = false, requireCRUD = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is admin if required
  if (requireAdmin && !['admin', 'superadmin'].includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // Check if user is superadmin if required
  if (requireSuperadmin && user.role !== 'superadmin') {
    return <Navigate to="/admin/overview" replace />;
  }

  // Check CRUD access if required
  if (requireCRUD && user.role === 'admin' && !user.hasCRUDAccess) {
    return <Navigate to="/admin/my-approvals" replace />;
  }

  return children;
};

export default ProtectedRoute;