
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Edit, Trash2, Upload, Calendar } from 'lucide-react';

const ActivityLog = () => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    fetchActivityLog();
  }, []);

  const fetchActivityLog = async () => {
    // API call: GET /api/activity-log
    const mockActivities = Array.from({ length: 20 }, (_, i) => ({
      id: `activity-${i + 1}`,
      type: ['create', 'update', 'delete', 'publish'][i % 4],
      user: 'Admin User',
      title: `StoxBolt Post Title ${i + 1}`,
      timestamp: new Date(Date.now() - i * 3600000).toISOString()
    }));
    setActivities(mockActivities);
  };

  const getActivityIcon = (type) => {
    const icons = {
      create: <FileText className="h-5 w-5 text-green-600" />,
      update: <Edit className="h-5 w-5 text-orange-600" />,
      delete: <Trash2 className="h-5 w-5 text-red-600" />,
      publish: <Upload className="h-5 w-5 text-purple-600" />
    };
    return icons[type] || icons.create;
  };

  const getActivityColor = (type) => {
    const colors = {
      create: 'bg-green-50 border-green-200',
      update: 'bg-orange-50 border-orange-200',
      delete: 'bg-red-50 border-red-200',
      publish: 'bg-purple-50 border-purple-200'
    };
    return colors[type] || colors.create;
  };

  const getActivityText = (activity) => {
    const actions = {
      create: 'created',
      update: 'updated',
      delete: 'deleted',
      publish: 'published'
    };
    return `${activity.user} ${actions[activity.type]} "${activity.title}"`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-2xl shadow-xl p-8"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Activity Log</h2>

      <div className="space-y-3">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex items-start space-x-4 p-4 border-2 rounded-xl ${getActivityColor(activity.type)}`}
          >
            <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
            <div className="flex-1">
              <p className="text-gray-900 font-medium">{getActivityText(activity)}</p>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(activity.timestamp).toLocaleString()}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ActivityLog;
