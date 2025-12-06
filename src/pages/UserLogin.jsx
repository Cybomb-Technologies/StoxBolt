import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Mail, Lock, Zap } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';

const UserLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get environment variables for Vite
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleManualLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'Validation Error',
        description: 'Please enter both email and password',
        variant: 'destructive'
      });
      return;
    }
    
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/user-auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.success) {
        // Store token in localStorage
        localStorage.setItem('token', data.token);
        
        toast({
          title: 'Welcome back!',
          description: 'You have successfully logged in'
        });
        
        navigate('/dashboard');
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = error.message || 'Invalid email or password';
      
      toast({
        title: 'Login failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      
      // Load Google Identity Services script
      if (!window.google) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
        
        // Wait for script to load
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      // Initialize Google OAuth2 client for authorization code flow
      const client = window.google.accounts.oauth2.initCodeClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile openid',
        callback: (response) => {
          if (response.code) {
            handleGoogleResponse(response.code);
          } else {
            toast({
              title: 'Google Login Failed',
              description: 'Failed to get authorization code',
              variant: 'destructive'
            });
            setGoogleLoading(false);
          }
        },
        error_callback: (error) => {
          console.error('Google OAuth error:', error);
          toast({
            title: 'Google Login Failed',
            description: error.message || 'Google authentication failed',
            variant: 'destructive'
          });
          setGoogleLoading(false);
        }
      });

      // Request authorization code
      client.requestCode();

    } catch (error) {
      console.error('Google login initialization error:', error);
      toast({
        title: 'Google Login Error',
        description: 'Failed to initialize Google Sign In',
        variant: 'destructive'
      });
      setGoogleLoading(false);
    }
  };

  const handleGoogleResponse = async (authorizationCode) => {
    try {
      // Send authorization code to backend
      const result = await fetch(`${API_URL}/api/user-auth/google-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ authorizationCode })
      });

      const data = await result.json();
      
      if (!result.ok) {
        throw new Error(data.message || 'Google login failed');
      }

      if (data.success) {
        // Store token in localStorage
        localStorage.setItem('token', data.token);
        
        toast({
          title: 'Welcome!',
          description: 'Google login successful'
        });
        
        navigate('/dashboard');
      } else {
        throw new Error(data.message || 'Google login failed');
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast({
        title: 'Google Login Failed',
        description: error.message || 'Failed to login with Google',
        variant: 'destructive'
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-200"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Zap className="text-white h-9 w-9 fill-current" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to StoxBolt</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        {/* Google Login Button */}
        <div className="mb-6">
          <Button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 py-3 text-lg font-medium shadow-sm hover:shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
          >
            {googleLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Connecting...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <FcGoogle className="mr-2 h-5 w-5" />
                Continue with Google
              </span>
            )}
          </Button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with email</span>
          </div>
        </div>

        {/* Manual Login Form */}
        <form onSubmit={handleManualLogin} className="space-y-6">
          <div>
            <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
            <div className="relative mt-2">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors"
                placeholder="Enter your email"
                required
                disabled={loading || googleLoading}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
            <div className="relative mt-2">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors"
                placeholder="Enter your password"
                required
                disabled={loading || googleLoading}
                minLength={6}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 py-3 text-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing in...
              </span>
            ) : 'Sign In'}
          </Button>
        </form>
<div className="mt-4 text-right">
  <Link 
    to="/user-forget-password" 
    className="text-sm text-orange-600 hover:text-orange-800 font-medium"
  >
    Forgot password?
  </Link>
</div>
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-gray-600 mb-2">
            Don't have an account?{' '}
            <Link to="/user-register" className="text-orange-600 hover:text-orange-800 font-medium">
              Sign up here
            </Link>
          </p>
          
          <Link to="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 text-sm">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Environment info for debugging */}
        {import.meta.env.DEV && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Backend: {API_URL}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default UserLogin;