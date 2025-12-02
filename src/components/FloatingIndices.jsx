
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, ChevronUp, ChevronDown } from 'lucide-react';

const FloatingIndices = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [indices, setIndices] = useState([
    { name: 'SENSEX', value: '65,280.45', change: '+1.2%', isUp: true },
    { name: 'NIFTY', value: '19,435.80', change: '+0.8%', isUp: true },
    { name: 'DOW', value: '34,721.12', change: '-0.3%', isUp: false },
    { name: 'NASDAQ', value: '14,032.81', change: '+1.5%', isUp: true },
    { name: 'GOLD', value: '$1,950.20', change: '+0.4%', isUp: true },
    { name: 'BTC', value: '$42,350', change: '-2.1%', isUp: false }
  ]);

  return (
    <motion.div
      initial={{ x: 300 }}
      animate={{ x: 0 }}
      className="fixed right-0 top-1/2 transform -translate-y-1/2 z-40 hidden lg:block"
    >
      <div className="bg-white shadow-xl rounded-l-2xl overflow-hidden border-l-4 border-orange-600">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-3 bg-gradient-to-r from-orange-600 to-red-600 text-white flex items-center justify-center hover:from-orange-700 hover:to-red-700 transition-all"
        >
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {indices.map((index, i) => (
                  <motion.div
                    key={index.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-between space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all"
                  >
                    <div>
                      <div className="font-bold text-gray-800 text-sm">{index.name}</div>
                      <div className="text-xs text-gray-600">{index.value}</div>
                    </div>
                    <div className={`flex items-center space-x-1 font-semibold text-sm ${index.isUp ? 'text-green-600' : 'text-red-600'}`}>
                      {index.isUp ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span>{index.change}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isExpanded && (
          <div className="p-3 text-center">
            <span className="text-xs font-semibold text-gray-600">Market Indices</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default FloatingIndices;
