import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Zap, ArrowLeft, Clock, Mail } from 'lucide-react';

const UserOtpVerification = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(600); // 10 minutes in seconds
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const inputRefs = useRef([]);

  // Get environment variables
  const API_URL = import.meta.env.VITE_API_URL || 'https://api.stoxbolt.com';

  useEffect(() => {
    // Get email from localStorage
    const savedEmail = localStorage.getItem('resetEmail');
    if (savedEmail) {
      setEmail(savedEmail);
    } else {
      // No email found, redirect to forget password
      navigate('/user-forget-password');
    }

    // Start countdown timer
    const interval = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste
      const pastedOtp = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedOtp.forEach((digit, i) => {
        if (i < 6) {
          newOtp[i] = digit;
        }
      });
      setOtp(newOtp);

      // Focus on last filled input
      const lastFilledIndex = Math.min(pastedOtp.length - 1, 5);
      if (lastFilledIndex < 5) {
        inputRefs.current[lastFilledIndex + 1]?.focus();
      }
      return;
    }

    // Handle single digit input
    if (/^[0-9]$/.test(value) || value === '') {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const otpString = otp.join('');

    if (otpString.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter all 6 digits',
        variant: 'destructive'
      });
      return;
    }

    if (timer === 0) {
      toast({
        title: 'OTP Expired',
        description: 'The OTP has expired. Please request a new one.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/user-auth/forgot-password/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          otp: otpString
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'OTP verification failed');
      }

      if (data.success) {
        toast({
          title: 'OTP Verified!',
          description: 'OTP verified successfully. Now set your new password.'
        });

        // Navigate to confirm password page
        navigate('/user-confirm-password');
      } else {
        throw new Error(data.message || 'OTP verification failed');
      }
    } catch (error) {
      console.error('Verify OTP error:', error);

      let errorMessage = error.message;

      toast({
        title: 'Verification Failed',
        description: errorMessage,
        variant: 'destructive'
      });

      // Clear OTP on failure
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);

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
        throw new Error(data.message || 'Failed to resend OTP');
      }

      if (data.success) {
        // Reset timer and OTP
        setTimer(600);
        setOtp(['', '', '', '', '', '']);

        toast({
          title: 'OTP Resent!',
          description: 'A new OTP has been sent to your email'
        });

        inputRefs.current[0]?.focus();
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
      setResendLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/user-forget-password');
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify OTP</h1>
          <p className="text-gray-600">Enter the 6-digit code sent to your email</p>
        </div>

        {/* Email display */}
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center justify-center text-gray-700">
            <Mail className="h-4 w-4 mr-2" />
            <span className="font-medium">{email}</span>
          </div>
        </div>

        {/* Timer */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-full">
            <Clock className="h-4 w-4 mr-2 text-gray-600" />
            <span className={`font-medium ${timer < 60 ? 'text-red-600' : 'text-gray-700'}`}>
              {formatTime(timer)}
            </span>
          </div>
          {timer === 0 && (
            <p className="mt-2 text-sm text-red-600 font-medium">OTP has expired</p>
          )}
        </div>

        {/* OTP Inputs */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="text-gray-700 font-medium block text-center mb-4">
              Enter 6-digit OTP
            </Label>
            <div className="flex justify-center space-x-2 mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors"
                  disabled={loading || timer === 0}
                  autoFocus={index === 0}
                />
              ))}
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || timer === 0}
            className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 py-3 text-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Verifying...
              </span>
            ) : 'Verify OTP'}
          </Button>
        </form>

        {/* Resend OTP */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 mb-3">
            Didn't receive the code?
          </p>
          <Button
            variant="outline"
            onClick={handleResendOTP}
            disabled={resendLoading || timer > 540} // Can resend after 1 minute
            className="border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 px-6 py-2 font-medium shadow-sm hover:shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Resending...
              </span>
            ) : 'Resend OTP'}
          </Button>
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

export default UserOtpVerification;