import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

/* ✅ JWT decode helper (safe) */
const decodeToken = (token) => {
  try {
    const base64 = token.split('.')[1];
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
};

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  /* ✅ LOCAL USER STATE (FIX) */
  const [headerUser, setHeaderUser] = useState(null);

  /* ✅ ALWAYS SYNC USER */
  useEffect(() => {
    if (user) {
      setHeaderUser(user);
    } else {
      const token = localStorage.getItem('token');
      if (token) {
        const decoded = decodeToken(token);
        if (decoded) {
          setHeaderUser({
            username: decoded.username,
            email: decoded.email,
            isWriter: decoded.isWriter || false
          });
        }
      }
    }
  }, [user]);

  /* ✅ NAME + FIRST LETTER */
  const displayName =
    headerUser?.username ||
    headerUser?.name ||
    (headerUser?.email ? headerUser.email.split('@')[0] : '');

  const firstLetter = displayName
    ? displayName.charAt(0).toUpperCase()
    : '';

  const categories = [
    { name: 'Indian', path: '/category/indian' },
    { name: 'US', path: '/category/us' },
    { name: 'Global', path: '/category/global' },
    { name: 'Commodities', path: '/category/commodities' },
    { name: 'Forex', path: '/category/forex' },
    { name: 'Crypto', path: '/category/crypto' },
    { name: 'IPOs', path: '/category/ipos' }
  ];

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem('token');
    setHeaderUser(null);
    navigate('/', { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* LOGO */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <Zap className="text-white h-6 w-6" />
            </div>
            <span className="text-2xl font-extrabold">
              Stox<span className="text-orange-600">Bolt</span>
            </span>
          </Link>

          {/* DESKTOP MENU */}
          <nav className="hidden lg:flex items-center space-x-1">
            {categories.map((c) => (
              <Link
                key={c.path}
                to={c.path}
                className="px-4 py-2 rounded-lg hover:bg-orange-50"
              >
                {c.name}
              </Link>
            ))}
          </nav>

          {/* RIGHT */}
          <div className="flex items-center space-x-3">

            {/* ✅ PROFILE / LOGIN */}
            {headerUser ? (
              <div className="flex items-center gap-3">

                {headerUser.isWriter && (
                  <Link to="/admin">
                    <Button variant="ghost" size="icon">
                      <LayoutDashboard />
                    </Button>
                  </Link>
                )}

                {/* PROFILE */}
                <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-orange-50">
                  <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold">
                    {firstLetter}
                  </div>
                  <span className="text-sm font-medium hidden sm:block">
                    {displayName}
                  </span>
                </div>

                {/* LOGOUT */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="hover:text-red-600"
                >
                  <LogOut />
                </Button>
              </div>
            ) : (
              <Link to="/user-login">
                <Button className="bg-orange-600 text-white">
                  <User className="mr-2" /> Login
                </Button>
              </Link>
            )}

            {/* MOBILE */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden"
            >
              {isMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
