
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, User, LogOut, LayoutDashboard, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const categories = [
    { name: 'Indian', path: '/category/indian' },
    { name: 'US', path: '/category/us' },
    { name: 'Global', path: '/category/global' },
    { name: 'Commodities', path: '/category/commodities' },
    { name: 'Forex', path: '/category/forex' },
    { name: 'Crypto', path: '/category/crypto' },
    { name: 'IPOs', path: '/category/ipos' }
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // API call: GET /api/posts?search=${searchQuery}
      console.log('Searching for:', searchQuery);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 rounded-lg flex items-center justify-center transform group-hover:scale-105 transition-transform duration-200 shadow-lg">
              <Zap className="text-white h-6 w-6 fill-current" />
            </div>
            <span className="text-2xl font-extrabold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent tracking-tight">
              Stox<span className="text-orange-600">Bolt</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center space-x-1">
            {categories.map((category) => (
              <Link
                key={category.path}
                to={category.path}
                className="px-4 py-2 rounded-lg text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all duration-200 font-medium"
              >
                {category.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="hover:bg-orange-50"
            >
              <Search className="h-5 w-5" />
            </Button>

            {user ? (
              <div className="flex items-center space-x-2">
                {user.isWriter && (
                  <Link to="/admin">
                    <Button variant="ghost" size="icon" className="hover:bg-orange-50">
                      <LayoutDashboard className="h-5 w-5" />
                    </Button>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <Link to="/login">
                <Button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white border-0">
                  <User className="h-4 w-4 mr-2" />
                  Login
                </Button>
              </Link>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t"
            >
              <form onSubmit={handleSearch} className="py-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search news..."
                    className="w-full px-4 py-3 pl-12 rounded-lg border-2 border-gray-200 focus:border-orange-500 focus:outline-none"
                    autoFocus
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t overflow-hidden"
            >
              <div className="py-4 space-y-2">
                {categories.map((category) => (
                  <Link
                    key={category.path}
                    to={category.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all duration-200"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header;
