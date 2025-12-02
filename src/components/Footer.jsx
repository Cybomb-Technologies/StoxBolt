
import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Facebook, Twitter, Linkedin, Instagram, Youtube, Mail, MapPin, Phone } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <Link to="/" className="flex items-center space-x-2 group mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 rounded-lg flex items-center justify-center transform group-hover:scale-105 transition-transform duration-200 shadow-lg">
                <Zap className="text-white h-5 w-5 fill-current" />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">
                Stox<span className="text-orange-500">Bolt</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Your trusted source for real-time financial news, market analysis, and investment insights. Empowering investors with speed and accuracy.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2 text-gray-400">
                <Mail className="h-4 w-4 text-orange-500" />
                <span>contact@stoxbolt.com</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <Phone className="h-4 w-4 text-orange-500" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <MapPin className="h-4 w-4 text-orange-500" />
                <span>Mumbai, India</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-orange-500 transition-colors duration-200">Home</Link>
              </li>
              <li>
                <Link to="/category/indian" className="hover:text-orange-500 transition-colors duration-200">Indian Markets</Link>
              </li>
              <li>
                <Link to="/category/us" className="hover:text-orange-500 transition-colors duration-200">US Markets</Link>
              </li>
              <li>
                <Link to="/category/crypto" className="hover:text-orange-500 transition-colors duration-200">Crypto News</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-orange-500 transition-colors duration-200">About Us</Link>
              </li>
            </ul>
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
