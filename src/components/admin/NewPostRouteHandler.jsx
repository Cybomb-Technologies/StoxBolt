import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const NewPostRouteHandler = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [targetRoute, setTargetRoute] = useState(null);

  useEffect(() => {
    if (user) {
      // Determine the correct route based on user's CRUD access
      if (user.role === 'superadmin') {
        // Superadmin always uses direct CRUD editor
        setTargetRoute('/admin/posts/edit/new');
      } else if (user.role === 'admin') {
        if (user.hasCRUDAccess) {
          // Admin with CRUD access uses direct editor
          setTargetRoute('/admin/posts/edit/new');
        } else {
          // Admin without CRUD access uses approval system
          setTargetRoute('/admin/posts/new-approval');
        }
      } else {
        // Fallback for other roles
        setTargetRoute('/admin/posts');
      }
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return <Navigate to={targetRoute} replace />;
};

export default NewPostRouteHandler;