
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
import { FileText, Upload, Calendar, Activity, Zap } from 'lucide-react';

const AdminDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
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

      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">Welcome back, {user.name}</p>
          </motion.div>

          <Tabs defaultValue="posts" className="space-y-6">
            <TabsList className="bg-white shadow-md p-2 rounded-xl">
              <TabsTrigger value="posts" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                <FileText className="h-4 w-4 mr-2" />
                Posts
              </TabsTrigger>
              <TabsTrigger value="editor" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                <FileText className="h-4 w-4 mr-2" />
                New Post
              </TabsTrigger>
              {user.isAdmin && (
                <>
                  <TabsTrigger value="bulk" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                    <Upload className="h-4 w-4 mr-2" />
                    Bulk Upload
                  </TabsTrigger>
                  <TabsTrigger value="scheduler" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                    <Calendar className="h-4 w-4 mr-2" />
                    Scheduler
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                    <Activity className="h-4 w-4 mr-2" />
                    Activity Log
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="posts">
              <PostList />
            </TabsContent>

            <TabsContent value="editor">
              <PostEditor />
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
