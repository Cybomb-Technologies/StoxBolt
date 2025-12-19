import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from '@/components/notifications/NotificationBell';
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'https://api.stoxbolt.com';

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounce search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        setShowDropdown(true);
        try {
          const response = await axios.get(`${baseURL}/api/public-posts`, {
            params: {
              search: searchQuery,
              limit: 5,
              status: 'published'
            }
          });

          if (response.data.success) {
            setSearchResults(response.data.data);
          }
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMenuOpen(false);
      setShowDropdown(false);
      // Don't clear query immediately so user sees what they searched
    }
  };

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const dropdownTimeoutRef = useRef(null);
  const mobileMenuRef = useRef(null);

  /* ✅ LOCAL USER STATE (FIX) */
  const [headerUser, setHeaderUser] = useState(null);

  /* ✅ FETCH USER PROFILE DATA FOR HEADER - SIMPLIFIED VERSION */
  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setHeaderUser(null);
        return;
      }

      try {
        // Use the same endpoint as profile page
        const response = await axios.get(`${baseURL}/api/user-auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 3000
        });

        if (response.data.success) {
          const userData = response.data.data;
          setHeaderUser({
            username: userData.username,
            email: userData.email,
            isWriter: userData.isWriter || false
          });
        }
      } catch (apiError) {
        console.log('Profile API failed, checking token...');
        // If API fails, decode token and use that
        const decoded = decodeToken(token);
        if (decoded && decoded.email && decoded.email !== 'admin') {
          setHeaderUser({
            username: decoded.username || decoded.email.split('@')[0],
            email: decoded.email,
            isWriter: decoded.isWriter || false
          });
        } else {
          setHeaderUser(null);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setHeaderUser(null);
    }
  };

  /* ✅ ALWAYS SYNC USER */
  useEffect(() => {
    // Always fetch from API to ensure consistency with profile page
    fetchUserProfile();
  }, [user]); // Still depend on user context changes


  /* ✅ FETCH CATEGORIES FROM BACKEND */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${baseURL}/api/categories`, {
          params: { limit: 50 }
        });

        if (response.data.success) {
          const categoriesData = response.data.data;

          // Transform backend data to match frontend structure
          const formattedCategories = categoriesData.map(category => ({
            id: category._id,
            name: category.name,
            slug: category.slug || category.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            path: `/category/${category.slug || category.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
          }));

          setCategories(formattedCategories);
        } else {
          // If API fails, use fallback categories
          setFallbackCategories();
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        // Fallback to default categories if API fails
        setFallbackCategories();
      } finally {
        setLoading(false);
      }
    };

    const setFallbackCategories = () => {
      setCategories([
        { id: '1', name: 'Indian', path: '/category/indian', slug: 'indian' },
        { id: '2', name: 'US', path: '/category/us', slug: 'us' },
        { id: '3', name: 'Global', path: '/category/global', slug: 'global' },
        { id: '4', name: 'Commodities', path: '/category/commodities', slug: 'commodities' },
        { id: '5', name: 'Forex', path: '/category/forex', slug: 'forex' },
        { id: '6', name: 'Crypto', path: '/category/crypto', slug: 'crypto' },
        { id: '7', name: 'IPOs', path: '/category/ipos', slug: 'ipos' },
        { id: '8', name: 'Stocks', path: '/category/stocks', slug: 'stocks' },
        { id: '9', name: 'Mutual Funds', path: '/category/mutual-funds', slug: 'mutual-funds' },
        { id: '10', name: 'Bonds', path: '/category/bonds', slug: 'bonds' },
        { id: '11', name: 'ETFs', path: '/category/etfs', slug: 'etfs' },
        { id: '12', name: 'Real Estate', path: '/category/real-estate', slug: 'real-estate' }
      ]);
    };

    fetchCategories();
  }, []);

  /* ✅ Handle dropdown hover events */
  const handleMouseEnter = () => {
    clearTimeout(dropdownTimeoutRef.current);
    setIsDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 150); // Small delay to prevent accidental closing
  };

  /* ✅ LOGIC FOR SPLITTING CATEGORIES */
  const mainCategories = categories.slice(0, 6);
  const dropdownCategories = categories.slice(6);

  /* ✅ GET DISPLAY NAME - Filter admin and handle edge cases */
  const getDisplayInfo = () => {
    if (!headerUser) return { displayName: '', firstLetter: '' };

    let displayName = '';

    // Prefer username, fallback to email prefix
    if (headerUser.username && headerUser.username !== 'admin') {
      displayName = headerUser.username;
    } else if (headerUser.email && headerUser.email !== 'admin') {
      displayName = headerUser.email.split('@')[0];
    }

    // Capitalize first letter for display
    const firstLetter = displayName ? displayName.charAt(0).toUpperCase() : '';

    return { displayName, firstLetter };
  };

  const { displayName, firstLetter } = getDisplayInfo();

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem('token');
    setHeaderUser(null);
    navigate('/', { replace: true });
  };

  /* ✅ Handle profile click - redirect to profile page only if not admin */
  const handleProfileClick = () => {
    if (headerUser) {
      navigate('/profile');
    } else {
      // If headerUser is null (likely admin), redirect to login
      navigate('/user-login');
    }
  };

  /* ✅ Close mobile menu when clicking outside or pressing ESC */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isMenuOpen]);

  /* ✅ Prevent body scroll when mobile menu is open */
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMenuOpen]);

  const handleCloseMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* LOGO - Using image with fallback */}
          <Link to="/" className="flex items-center space-x-2 min-w-[150px]">
            <div className="flex items-center h-10">
              <img
                src="/images/logo.png"
                alt="StoxBolt Logo"
                className="h-10 w-auto object-contain"
                onError={(e) => {
                  // Fallback if logo image doesn't exist
                  e.target.style.display = 'none';
                  const fallbackDiv = document.createElement('div');
                  fallbackDiv.className = 'flex items-center space-x-2';
                  fallbackDiv.innerHTML = `
                    <div class="w-10 h-10 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                      <svg class="text-white h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                      </svg>
                    </div>
                    <span class="text-2xl font-extrabold">
                      Stox<span class="text-orange-600">Bolt</span>
                    </span>
                  `;
                  e.target.parentNode.replaceChild(fallbackDiv, e.target.parentNode.firstChild);
                }}
              />
            </div>
          </Link>

          {/* DESKTOP MENU */}
          <nav className="hidden xl:flex items-center space-x-1">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="px-4 py-2 rounded-lg bg-gray-200 animate-pulse"
                  style={{ width: '80px', height: '40px' }}
                />
              ))
            ) : (
              <>
                {/* Main categories (max 6) */}
                {mainCategories.map((category) => (
                  <Link
                    key={category.id}
                    to={category.path}
                    className="px-4 py-2 rounded-lg hover:bg-orange-50 transition-colors duration-200 font-medium text-gray-700 hover:text-orange-600 text-sm"
                  >
                    {category.name}
                  </Link>
                ))}

                {/* Dropdown for additional categories */}
                {dropdownCategories.length > 0 && (
                  <div
                    className="relative"
                    ref={dropdownRef}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    <button
                      className="inline-flex items-center px-4 py-2 rounded-lg hover:bg-orange-50 transition-colors duration-200 font-medium text-gray-700 hover:text-orange-600 text-sm"
                    >
                      More <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                      <div
                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="py-1">
                          {dropdownCategories.map((category) => (
                            <Link
                              key={category.id}
                              to={category.path}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              {category.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </nav>

          {/* SEARCH BAR - Desktop */}
          <div className="hidden xl:flex items-center flex-1 max-w-md px-6 relative" ref={searchRef}>
            <form onSubmit={handleSearch} className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors"
                placeholder="Search news, topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchQuery.trim().length >= 2) setShowDropdown(true);
                }}
              />
            </form>

            {/* LIVE SEARCH DROPDOWN */}
            <AnimatePresence>
              {showDropdown && searchQuery.trim().length >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 mx-6 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50 max-h-96 overflow-y-auto"
                >
                  {isSearching ? (
                    <div className="p-4 text-center text-gray-500 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
                      Searching...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-2">
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b mb-1">
                        Top Results
                      </div>
                      {searchResults.map((post) => (
                        <Link
                          key={post._id}
                          to={`/post/${post._id}`}
                          className="flex items-start px-4 py-3 hover:bg-orange-50 transition-colors border-b last:border-0"
                          onClick={() => {
                            setShowDropdown(false);
                            setSearchQuery('');
                          }}
                        >
                          {/* Image Thumbnail */}
                          <div className="flex-shrink-0 mr-3">
                            <div className="h-10 w-10 rounded bg-gray-200 overflow-hidden">
                              {(post.imageUrl || post.image) ? (
                                <img
                                  src={post.imageUrl || post.image}
                                  alt=""
                                  className="h-full w-full object-cover"
                                  onError={(e) => e.target.style.display = 'none'}
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400">
                                  <Search className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {post.title}
                            </p>
                            <div className="flex items-center mt-1">
                              <span className="text-xs text-orange-600 font-medium bg-orange-50 px-1.5 py-0.5 rounded">
                                {typeof post.category === 'object' ? post.category?.name : post.category}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                      <div className="px-2 pt-2 pb-1">
                        <button
                          onClick={handleSearch}
                          className="w-full py-2 text-sm text-center text-orange-600 hover:text-orange-700 font-medium hover:bg-orange-50 rounded transition-colors"
                        >
                          View all results for "{searchQuery}"
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No results found for "{searchQuery}"
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT SECTION - Desktop only */}
          <div className="hidden xl:flex items-center space-x-3">
            {/* NOTIFICATION BELL - Show only for logged in users (NOT admins) */}
            {headerUser && headerUser.email && !headerUser.email.includes('admin') && <NotificationBell />}

            {/* ✅ USER LOGIN/LOGOUT - Desktop only */}
            {headerUser ? (
              <div className="flex items-center gap-3">
                {/* PROFILE BUTTON - Clickable to go to profile page */}
                <button
                  onClick={handleProfileClick}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 hover:bg-orange-100 transition-colors cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold group-hover:bg-orange-700 transition-colors">
                    {firstLetter}
                  </div>
                  <span className="text-sm font-medium truncate max-w-[120px] text-gray-700 group-hover:text-orange-600 transition-colors">
                    {displayName}
                  </span>
                </button>

                {/* LOGOUT */}
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-red-600 hover:bg-gray-100 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link to="/user-login">
                <button className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors">
                  <User className="mr-2 h-4 w-4" /> Login
                </button>
              </Link>
            )}
          </div>

          {/* MOBILE MENU TOGGLE - Visible only on mobile */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="xl:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* MOBILE MENU - HALF SCREEN OVERLAY */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              {/* Overlay backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 z-40 xl:hidden"
                onClick={handleCloseMenu}
              />

              {/* Mobile menu panel */}
              <motion.div
                ref={mobileMenuRef}
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
                className="fixed top-0 right-0 h-full w-3/4 sm:w-1/2 max-w-md bg-white shadow-xl z-50 xl:hidden"
              >
                <div className="flex flex-col h-full">
                  {/* Mobile menu header */}
                  <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                    <button
                      onClick={handleCloseMenu}
                      className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                      aria-label="Close menu"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Scrollable categories list */}
                  <div className="flex-1 overflow-y-auto py-2">
                    <div className="px-4 pb-4">
                      <form onSubmit={handleSearch} className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                          placeholder="Search..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </form>
                    </div>
                    {loading ? (
                      // Loading skeleton for mobile
                      <div className="space-y-2 px-4">
                        {Array.from({ length: 10 }).map((_, index) => (
                          <div
                            key={index}
                            className="h-12 bg-gray-100 animate-pulse rounded"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-1 px-2">
                        <Link
                          to="/"
                          className="flex items-center px-4 py-3 rounded-lg hover:bg-orange-50 transition-colors text-gray-700 font-medium"
                          onClick={handleCloseMenu}
                        >
                          Home
                        </Link>

                        {categories.map((category) => (
                          <Link
                            key={category.id}
                            to={category.path}
                            className="flex items-center px-4 py-3 rounded-lg hover:bg-orange-50 transition-colors text-gray-700 font-medium"
                            onClick={handleCloseMenu}
                          >
                            {category.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Mobile menu footer - User section */}
                  <div className="border-t p-4">
                    {headerUser ? (
                      <div className="space-y-3">
                        {/* Profile section - Clickable to go to profile */}
                        <button
                          onClick={() => {
                            handleProfileClick();
                            handleCloseMenu();
                          }}
                          className="flex items-center px-2 w-full text-left hover:bg-orange-50 rounded-lg p-2 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold mr-3">
                            {firstLetter}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{displayName}</p>
                            <p className="text-sm text-gray-500 truncate">{headerUser.email}</p>
                          </div>
                        </button>

                        <div className="grid grid-cols-1 gap-2">
                          <button
                            onClick={() => {
                              handleLogout();
                              handleCloseMenu();
                            }}
                            className="flex items-center justify-center px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                          </button>
                        </div>
                      </div>
                    ) : (
                      <Link
                        to="/user-login"
                        className="flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
                        onClick={handleCloseMenu}
                      >
                        <User className="mr-2 h-5 w-5" />
                        Login
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header;