import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Lock, Eye, EyeOff, Zap, ArrowLeft, CheckCircle } from 'lucide-react';

const UserConfirmPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get environment variables
  const API_URL = import.meta.env.VITE_API_URL || 'https://api.stoxbolt.com';

  useEffect(() => {
    // Get email from localStorage
    const savedEmail = localStorage.getItem('resetEmail');
    if (!savedEmail) {
      // No email found, redirect to forget password
      navigate('/user-forget-password');
    } else {
      setEmail(savedEmail);
    }
  }, [navigate]);

  useEffect(() => {
    // Calculate password strength
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
    if (!newPassword || !confirmPassword) {
      toast({
        title: 'Validation Error',
        description: 'Please enter both password fields',
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

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/user-auth/forgot-password/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          newPassword: newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password reset failed');
      }

      if (data.success) {
        // Clear localStorage
        localStorage.removeItem('resetEmail');

        toast({
          title: 'Password Reset Successful!',
          description: 'Your password has been reset successfully'
        });

        // Navigate to login page after delay
        setTimeout(() => {
          navigate('/user-login');
        }, 2000);
      } else {
        throw new Error(data.message || 'Password reset failed');
      }
    } catch (error) {
      console.error('Reset password error:', error);

      let errorMessage = error.message;

      toast({
        title: 'Reset Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/user-otp-verification');
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-200"
      >
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-6 -ml-2 flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Zap className="text-white h-9 w-9 fill-current" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Set New Password</h1>
          <p className="text-gray-600">Create a new strong password for your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* New Password */}
          <div>
            <Label htmlFor="newPassword" className="text-gray-700 font-medium">
              New Password
            </Label>
            <div className="relative mt-2">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors"
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
                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {/* Password Strength Meter */}
            {newPassword && (
              <div className="mt-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Password strength:</span>
                  <span className={`font-medium ${passwordStrength < 50 ? 'text-red-600' :
                      passwordStrength < 75 ? 'text-yellow-600' :
                        'text-green-600'
                    }`}>
                    {getStrengthText()}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getStrengthColor()} transition-all duration-300`}
                    style={{ width: `${passwordStrength}%` }}
                  />
                </div>
                <div className="mt-2 text-xs text-gray-500">
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
            <div className="relative mt-2">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors"
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
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {/* Password Match Indicator */}
            {confirmPassword && (
              <div className="mt-2">
                <div className={`flex items-center text-sm ${newPassword === confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                  <CheckCircle className={`h-4 w-4 mr-1 ${newPassword === confirmPassword ? 'text-green-600' : 'text-red-600'}`} />
                  {newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                </div>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 py-3 text-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Resetting Password...
              </span>
            ) : 'Reset Password'}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <Link to="/user-login" className="inline-flex items-center text-gray-600 hover:text-gray-900 text-sm">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Login
          </Link>
        </div>

        {/* Environment info for debugging */}
        {import.meta.env.DEV && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Backend: {API_URL}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default UserConfirmPassword;