import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Facebook, Twitter, Linkedin, Instagram, Youtube, Mail, MapPin, Phone } from 'lucide-react';
import { FaGooglePlay } from 'react-icons/fa';
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'https://api.stoxbolt.com';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ✅ FETCH CATEGORIES FROM BACKEND - Same as Header */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${baseURL}/api/categories`);

        if (response.data.success) {
          const categoriesData = response.data.data;

          // Transform backend data to match frontend structure
          const formattedCategories = categoriesData.map(category => ({
            id: category._id,
            name: category.name,
            slug: category.slug || category.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            path: `/category/${category.slug || category.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
          }));

          // Take only first 3 categories for the footer
          setCategories(formattedCategories.slice(0, 3));
        } else {
          // If API fails, use fallback categories (first 3)
          setFallbackCategories();
        }
      } catch (error) {
        console.error('Failed to fetch categories for footer:', error);
        // Fallback to default categories if API fails
        setFallbackCategories();
      } finally {
        setLoading(false);
      }
    };

    const setFallbackCategories = () => {
      setCategories([
        { id: '1', name: 'Indian Markets', path: '/category/indian', slug: 'indian' },
        { id: '2', name: 'US Markets', path: '/category/us', slug: 'us' },
        { id: '3', name: 'Crypto News', path: '/category/crypto', slug: 'crypto' }
      ]);
    };

    fetchCategories();
  }, []);

  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            {/* LOGO - Using image with fallback */}
            <Link to="/" className="flex items-center space-x-2 min-w-[150px]">
              <div className="flex items-center mb-2 h-10">
                <img
                  src="/images/logo.png"
                  alt="StoxBolt Logo"
                  className="h-10 w-auto rounded object-contain"
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
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Your trusted source for real-time financial news, market analysis, and investment insights. Empowering investors with speed and accuracy.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2 text-gray-400">
                <Mail className="h-4 w-4 text-orange-500" />
                <span><a href="mailto:info@stoxbolt.com">info@stoxbolt.com</a></span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <Phone className="h-4 w-4 text-orange-500" />
                <span><a href="tel:+919715092104">+91 9715092104</a></span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <MapPin className="h-10 w-10 text-orange-500" />
                <span>Prime Plaza No.54/1, 1st street, Sripuram colony, St. Thomas Mount, Chennai, Tamil Nadu - 600 016, India</span>
              </div>
            </div>
          </div>

          {/* Quick Links - Now with dynamic categories */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Quick Links</h3>
            {loading ? (
              <ul className="space-y-2 text-sm">
                {Array.from({ length: 5 }).map((_, index) => (
                  <li key={index}>
                    <div className="h-4 bg-gray-800 rounded animate-pulse w-3/4"></div>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/" className="hover:text-orange-500 transition-colors duration-200">Home</Link>
                </li>
                {/* Dynamic categories from backend */}
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link to={category.path} className="hover:text-orange-500 transition-colors duration-200">
                      {category.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link to="/about" className="hover:text-orange-500 transition-colors duration-200">About Us</Link>
                </li>
              </ul>
            )}
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy" className="hover:text-orange-500 transition-colors duration-200">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-orange-500 transition-colors duration-200">Terms & Conditions</Link>
              </li>
              <li>
                <Link to="/disclaimer" className="hover:text-orange-500 transition-colors duration-200">Disclaimer</Link>
              </li>
              <li>
                <Link to="/refund-policy" className="hover:text-orange-500 transition-colors duration-200">Refund Policy</Link>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Connect With Us</h3>
            <p className="text-sm text-gray-400 mb-4">
              Follow us on social media for instant updates and market alerts.
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="bg-gray-800 p-2 rounded-full hover:bg-[#1877F2] hover:text-white transition-all duration-300">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="bg-gray-800 p-2 rounded-full hover:bg-[#1DA1F2] hover:text-white transition-all duration-300">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="bg-gray-800 p-2 rounded-full hover:bg-[#0A66C2] hover:text-white transition-all duration-300">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="bg-gray-800 p-2 rounded-full hover:bg-[#E4405F] hover:text-white transition-all duration-300">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="bg-gray-800 p-2 rounded-full hover:bg-[#FF0000] hover:text-white transition-all duration-300">
                <Youtube className="h-5 w-5" />
              </a>
            </div>

            {/* Google Play Store Link */}
            <div className="mt-6">
              <h4 className="text-white font-bold text-sm mb-3">Download App</h4>
              <a 
                href="https://play.google.com/store/apps/details?id=com.cybomb.stoxbolt" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center bg-gray-800 border border-gray-700 hover:border-orange-500 rounded-lg px-4 py-2 transition-all duration-300 group"
              >
                <FaGooglePlay className="text-green-500 text-2xl mr-3 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <div className="text-[10px] text-gray-400 uppercase leading-none">Get it on</div>
                  <div className="text-white font-bold text-sm leading-tight">Google Play</div>
                </div>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 mt-8 text-center">
          <p className="text-sm text-gray-500">
            &copy; {currentYear} StoxBolt. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;