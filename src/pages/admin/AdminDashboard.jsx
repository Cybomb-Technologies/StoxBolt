import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PostEditor from '@/components/admin/PostEditor';
import PostList from '@/components/admin/PostList';
import BulkUpload from '@/components/admin/BulkUpload';
import PostScheduler from '@/components/admin/PostScheduler';
import ActivityLog from '@/components/admin/ActivityLog';
import { FileText, Upload, Calendar, Activity, Zap, LogOut, User } from 'lucide-react';

const AdminDashboard = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login'); // Navigate after logout
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
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - StoxBolt</title>
        <meta name="description" content="Manage your StoxBolt content and posts" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                  <Zap className="text-white h-6 w-6 fill-current" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">StoxBolt Admin</h1>
                  <p className="text-sm text-gray-600">Content Management System</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
              Dashboard Overview
            </h1>
            <p className="text-gray-600">
              Welcome back, <span className="font-semibold text-gray-900">{user.name}</span>
              <span className="mx-2">•</span>
              <span className="px-2 py-1 bg-gradient-to-r from-orange-50 to-red-50 text-orange-700 text-xs font-medium rounded-full">
                {user.role.toUpperCase()}
              </span>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'First login'}
            </p>
          </motion.div>

          <Tabs defaultValue="posts" className="space-y-6">
            <TabsList className="bg-white shadow-md p-2 rounded-xl border">
              <TabsTrigger 
                value="posts" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600 data-[state=active]:text-white transition-all"
              >
                <FileText className="h-4 w-4 mr-2" />
                Posts
              </TabsTrigger>
              <TabsTrigger 
                value="editor" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600 data-[state=active]:text-white transition-all"
              >
                <FileText className="h-4 w-4 mr-2" />
                New Post
              </TabsTrigger>
              
              {user.isAdmin && (
                <>
                  <TabsTrigger 
                    value="bulk" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600 data-[state=active]:text-white transition-all"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Bulk Upload
                  </TabsTrigger>
                  <TabsTrigger 
                    value="scheduler" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600 data-[state=active]:text-white transition-all"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Scheduler
                  </TabsTrigger>
                  <TabsTrigger 
                    value="activity" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600 data-[state=active]:text-white transition-all"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Activity Log
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="posts">
              <PostEditor />
            </TabsContent>

            <TabsContent value="editor">
              <PostList />
            </TabsContent>

            {user.isAdmin && (
              <>
                <TabsContent value="bulk">
                  <BulkUpload />
                </TabsContent>

                <TabsContent value="scheduler">
                  <PostScheduler />
                </TabsContent>

                <TabsContent value="activity">
                  <ActivityLog />
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;