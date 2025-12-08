import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

const ChangePasswordForm = ({ email, onSuccess }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const { toast } = useToast();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Calculate password strength
  React.useEffect(() => {
    let strength = 0;
    if (newPassword.length >= 6) strength += 25;
    if (/[A-Z]/.test(newPassword)) strength += 25;
    if (/[0-9]/.test(newPassword)) strength += 25;
    if (/[^A-Za-z0-9]/.test(newPassword)) strength += 25;
    setPasswordStrength(strength);
  }, [newPassword]);

  const getStrengthColor = () => {
    if (passwordStrength < 50) return 'bg-red-500';
    if (passwordStrength < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (passwordStrength < 50) return 'Weak';
    if (passwordStrength < 75) return 'Medium';
    return 'Strong';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: 'Validation Error',
        description: 'Please fill all password fields',
        variant: 'destructive'
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Password Too Short',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords Do Not Match',
        description: 'New password and confirm password must match',
        variant: 'destructive'
      });
      return;
    }

    if (passwordStrength < 50) {
      toast({
        title: 'Weak Password',
        description: 'Please choose a stronger password',
        variant: 'destructive'
      });
      return;
    }

    if (currentPassword === newPassword) {
      toast({
        title: 'Same Password',
        description: 'New password must be different from current password',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/user-auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password change failed');
      }

      if (data.success) {
        // Clear form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        toast({
          title: 'Success!',
          description: 'Password changed successfully',
          variant: 'default'
        });
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(data.message || 'Password change failed');
      }
    } catch (error) {
      console.error('Change password error:', error);
      
      toast({
        title: 'Failed to Change Password',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 sm:space-y-6"
    >
      <div className="mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
          Change Password
        </h3>
        <p className="text-gray-600 text-sm sm:text-base">
          Update your password to keep your account secure
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Current Password */}
        <div>
          <Label htmlFor="currentPassword" className="text-gray-700 font-medium">
            Current Password
          </Label>
          <div className="relative mt-1 sm:mt-2">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            <input
              id="currentPassword"
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2 sm:py-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors"
              placeholder="Enter current password"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showCurrentPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <Label htmlFor="newPassword" className="text-gray-700 font-medium">
            New Password
          </Label>
          <div className="relative mt-1 sm:mt-2">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            <input
              id="newPassword"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2 sm:py-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors"
              placeholder="Enter new password"
              required
              disabled={loading}
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showNewPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
            </button>
          </div>
          
          {/* Password Strength Meter */}
          {newPassword && (
            <div className="mt-2 sm:mt-3">
              <div className="flex justify-between text-xs sm:text-sm mb-1">
                <span className="text-gray-600">Password strength:</span>
                <span className={`font-medium ${
                  passwordStrength < 50 ? 'text-red-600' : 
                  passwordStrength < 75 ? 'text-yellow-600' : 
                  'text-green-600'
                }`}>
                  {getStrengthText()}
                </span>
              </div>
              <div className="h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getStrengthColor()} transition-all duration-300`}
                  style={{ width: `${passwordStrength}%` }}
                />
              </div>
              <div className="mt-1 sm:mt-2 text-xs text-gray-500">
                <div className="flex items-center mb-1">
                  <CheckCircle className={`h-3 w-3 mr-1 ${newPassword.length >= 6 ? 'text-green-500' : 'text-gray-300'}`} />
                  <span>At least 6 characters</span>
                </div>
                <div className="flex items-center mb-1">
                  <CheckCircle className={`h-3 w-3 mr-1 ${/[A-Z]/.test(newPassword) ? 'text-green-500' : 'text-gray-300'}`} />
                  <span>At least one uppercase letter</span>
                </div>
                <div className="flex items-center mb-1">
                  <CheckCircle className={`h-3 w-3 mr-1 ${/[0-9]/.test(newPassword) ? 'text-green-500' : 'text-gray-300'}`} />
                  <span>At least one number</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className={`h-3 w-3 mr-1 ${/[^A-Za-z0-9]/.test(newPassword) ? 'text-green-500' : 'text-gray-300'}`} />
                  <span>At least one special character</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
            Confirm New Password
          </Label>
          <div className="relative mt-1 sm:mt-2">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2 sm:py-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors"
              placeholder="Confirm new password"
              required
              disabled={loading}
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
            </button>
          </div>
          
          {/* Password Match Indicator */}
          {confirmPassword && (
            <div className="mt-1 sm:mt-2">
              <div className={`flex items-center text-xs sm:text-sm ${newPassword === confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                {newPassword === confirmPassword ? (
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-green-600" />
                ) : (
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-red-600" />
                )}
                {newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
              </div>
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 py-2 sm:py-3 text-base sm:text-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Changing Password...
            </span>
          ) : 'Change Password'}
        </Button>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs sm:text-sm text-gray-500">
            <strong>Note:</strong> Make sure your new password is strong and different from your current password.
          </p>
        </div>
      </form>
    </motion.div>
  );
};

export default ChangePasswordForm;