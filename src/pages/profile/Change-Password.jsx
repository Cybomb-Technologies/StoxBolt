import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Mail, Zap, CheckCircle } from 'lucide-react';
import UserOtpVerifications from './UserOtpVerification';

const ChangePasswordTab = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Enter email, 2: OTP sent message, 3: OTP verification
  const [showOtpModal, setShowOtpModal] = useState(false);
  const { toast } = useToast();
  const otpVerificationRef = useRef();

  // Get environment variables
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: 'Validation Error',
        description: 'Please enter your email address',
        variant: 'destructive'
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/user-auth/forgot-password/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      if (data.success) {
        // Store email in localStorage for next steps
        localStorage.setItem('resetEmail', email);
        
        toast({
          title: 'OTP Sent!',
          description: 'We have sent an OTP to your email address'
        });
        
        setStep(2);
      } else {
        throw new Error(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      
      let errorMessage = error.message;
      
      toast({
        title: 'Failed to Send OTP',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/api/user-auth/forgot-password/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP');
      }

      if (data.success) {
        toast({
          title: 'OTP Resent!',
          description: 'A new OTP has been sent to your email'
        });
        
        // Reset OTP modal if it's open
        if (otpVerificationRef.current) {
          otpVerificationRef.current.resetOtp();
        }
      } else {
        throw new Error(data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      toast({
        title: 'Failed to Resend OTP',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenOtpModal = () => {
    setShowOtpModal(true);
  };

  const handleOtpSuccess = () => {
    setShowOtpModal(false);
    // Navigate to password reset page or show password reset form
    toast({
      title: 'Success!',
      description: 'OTP verified. You can now set your new password.',
      variant: 'default'
    });
    // Here you would typically show a password reset form
    // or navigate to password reset page
  };

  const handleCloseOtpModal = () => {
    setShowOtpModal(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Zap className="text-white h-7 w-7 fill-current" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Your Password</h2>
          <p className="text-gray-600">
            {step === 1 ? 'Enter your email to receive a reset OTP' : 'Check your email for the OTP'}
          </p>
        </div>

        {step === 1 ? (
          // Step 1: Enter Email
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Email Address
              </Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors"
                  placeholder="Enter your registered email"
                  required
                  disabled={loading}
                />
              </div>
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
                  Sending OTP...
                </span>
              ) : 'Send Reset OTP'}
            </Button>
          </form>
        ) : (
          // Step 2: OTP Sent Confirmation
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">OTP Sent Successfully!</h2>
              <p className="text-gray-600 mb-4">
                We've sent a 6-digit OTP to <strong className="text-gray-900">{email}</strong>
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Please check your inbox (and spam folder) for the OTP. It will expire in 10 minutes.
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleOpenOtpModal}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 py-3 text-lg font-medium shadow-md hover:shadow-lg transition-all duration-200"
              >
                Enter OTP
              </Button>

              <Button
                variant="outline"
                onClick={handleResendOTP}
                disabled={loading}
                className="w-full border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 py-3 text-lg font-medium shadow-sm hover:shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Resending...
                  </span>
                ) : 'Resend OTP'}
              </Button>

              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                className="w-full text-gray-600 hover:text-gray-900"
              >
                Use different email
              </Button>
            </div>
          </div>
        )}

        {/* Environment info for debugging */}
        {import.meta.env.DEV && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Backend: {API_URL}
            </p>
          </div>
        )}
      </motion.div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <UserOtpVerifications
          ref={otpVerificationRef}
          email={email}
          onSuccess={handleOtpSuccess}
          onClose={handleCloseOtpModal}
        />
      )}
    </>
  );
};

export default ChangePasswordTab;