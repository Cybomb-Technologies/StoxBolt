
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

const IndexSnapshot = () => {
  const indices = [
    { name: 'SENSEX', value: '70,245.32', change: '+2.45%', isUp: true },
    { name: 'NIFTY 50', value: '21,182.55', change: '+2.12%', isUp: true },
    { name: 'BANK NIFTY', value: '45,823.40', change: '+1.85%', isUp: true },
    { name: 'GOLD', value: '₹62,450', change: '+0.85%', isUp: true },
    { name: 'USD/INR', value: '83.15', change: '-0.12%', isUp: false }
  ];

  return (
    <div className="mt-8 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl shadow-xl p-6">
      <h2 className="text-xl font-bold text-white mb-4">Market Snapshot</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {indices.map((index, i) => (
          <motion.div
            key={index.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all"
          >
            <div className="text-white/80 text-xs font-medium mb-1">{index.name}</div>
            <div className="text-white text-lg font-bold mb-1">{index.value}</div>
            <div className={`flex items-center space-x-1 text-sm font-semibold ${index.isUp ? 'text-green-300' : 'text-red-300'}`}>
              {index.isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{index.change}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default IndexSnapshot;
