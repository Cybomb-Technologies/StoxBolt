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

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.stoxbolt.com';

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

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  const inputVariants = {
    focus: {
      scale: 1.01,
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="space-y-4 sm:space-y-6"
    >
      <motion.div
        className="mb-4 sm:mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
          Change Password
        </h3>
        <p className="text-gray-600 text-sm sm:text-base md:text-lg">
          Update your password to keep your account secure
        </p>
      </motion.div>

      <motion.form
        onSubmit={handleSubmit}
        className="space-y-4 sm:space-y-6"
        variants={formVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Current Password */}
        <motion.div
          whileHover={{ scale: 1.005 }}
          transition={{ duration: 0.2 }}
        >
          <Label htmlFor="currentPassword" className="text-gray-700 font-medium text-sm sm:text-base">
            Current Password
          </Label>
          <div className="relative mt-1 sm:mt-2">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 transition-colors duration-200" />
            <motion.input
              id="currentPassword"
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 sm:py-3 md:py-3.5 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all duration-300 ease-in-out"
              placeholder="Enter current password"
              required
              disabled={loading}
              whileFocus="focus"
              variants={inputVariants}
            />
            <motion.button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {showCurrentPassword ? (
                <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200" />
              ) : (
                <Eye className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200" />
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* New Password */}
        <motion.div
          whileHover={{ scale: 1.005 }}
          transition={{ duration: 0.2 }}
        >
          <Label htmlFor="newPassword" className="text-gray-700 font-medium text-sm sm:text-base">
            New Password
          </Label>
          <div className="relative mt-1 sm:mt-2">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 transition-colors duration-200" />
            <motion.input
              id="newPassword"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 sm:py-3 md:py-3.5 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all duration-300 ease-in-out"
              placeholder="Enter new password"
              required
              disabled={loading}
              minLength={6}
              whileFocus="focus"
              variants={inputVariants}
            />
            <motion.button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {showNewPassword ? (
                <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200" />
              ) : (
                <Eye className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200" />
              )}
            </motion.button>
          </div>

          {/* Password Strength Meter */}
          {newPassword && (
            <motion.div
              className="mt-2 sm:mt-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between text-xs sm:text-sm mb-1">
                <span className="text-gray-600">Password strength:</span>
                <span className={`font-medium transition-colors duration-300 ${passwordStrength < 50 ? 'text-red-600' :
                    passwordStrength < 75 ? 'text-yellow-600' :
                      'text-green-600'
                  }`}>
                  {getStrengthText()}
                </span>
              </div>
              <div className="h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${getStrengthColor()} transition-all duration-500 ease-out`}
                  initial={{ width: 0 }}
                  animate={{ width: `${passwordStrength}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="mt-1 sm:mt-2 text-xs text-gray-500 space-y-1">
                <motion.div
                  className="flex items-center"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <CheckCircle className={`h-3 w-3 mr-1 transition-colors duration-300 ${newPassword.length >= 6 ? 'text-green-500' : 'text-gray-300'
                    }`} />
                  <span>At least 6 characters</span>
                </motion.div>
                <motion.div
                  className="flex items-center"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <CheckCircle className={`h-3 w-3 mr-1 transition-colors duration-300 ${/[A-Z]/.test(newPassword) ? 'text-green-500' : 'text-gray-300'
                    }`} />
                  <span>At least one uppercase letter</span>
                </motion.div>
                <motion.div
                  className="flex items-center"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <CheckCircle className={`h-3 w-3 mr-1 transition-colors duration-300 ${/[0-9]/.test(newPassword) ? 'text-green-500' : 'text-gray-300'
                    }`} />
                  <span>At least one number</span>
                </motion.div>
                <motion.div
                  className="flex items-center"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <CheckCircle className={`h-3 w-3 mr-1 transition-colors duration-300 ${/[^A-Za-z0-9]/.test(newPassword) ? 'text-green-500' : 'text-gray-300'
                    }`} />
                  <span>At least one special character</span>
                </motion.div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Confirm Password */}
        <motion.div
          whileHover={{ scale: 1.005 }}
          transition={{ duration: 0.2 }}
        >
          <Label htmlFor="confirmPassword" className="text-gray-700 font-medium text-sm sm:text-base">
            Confirm New Password
          </Label>
          <div className="relative mt-1 sm:mt-2">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 transition-colors duration-200" />
            <motion.input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 sm:py-3 md:py-3.5 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all duration-300 ease-in-out"
              placeholder="Confirm new password"
              required
              disabled={loading}
              minLength={6}
              whileFocus="focus"
              variants={inputVariants}
            />
            <motion.button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200" />
              ) : (
                <Eye className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200" />
              )}
            </motion.button>
          </div>

          {/* Password Match Indicator */}
          {confirmPassword && (
            <motion.div
              className="mt-1 sm:mt-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <div className={`flex items-center text-xs sm:text-sm transition-colors duration-300 ${newPassword === confirmPassword ? 'text-green-600' : 'text-red-600'
                }`}>
                {newPassword === confirmPassword ? (
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-green-600 transition-transform duration-300" />
                ) : (
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-red-600 transition-transform duration-300" />
                )}
                {newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
              </div>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 py-2.5 sm:py-3.5 md:py-4 text-base sm:text-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed transform"
          >
            {loading ? (
              <span className="flex mx-auto items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Changing Password...
              </span>
            ) : 'Change Password'}
          </Button>
        </motion.div>

        <motion.div
          className="pt-4 border-t border-gray-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
            <strong className="font-semibold">Note:</strong> Make sure your new password is strong and different from your current password. We recommend using a combination of letters, numbers, and special characters.
          </p>
        </motion.div>
      </motion.form>
    </motion.div>
  );
};

export default ChangePasswordForm;