import React from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { Zap, Target, Users, TrendingUp } from "lucide-react";
import Metatags from "../SEO/metatags";

const AboutPage = () => {
  const metaPropsData = {
    title: "About StoxBolt - Real-Time Financial News for Market Analysis",
    description:
      "Learn about StoxBolt's mission to deliver accurate, timely financial news and market insights. Empowering investors with real-time data across global markets.",
    keyword:
      "about StoxBolt, financial news platform, market analysis, investment insights, stock market updates, trading news",
    image: "https://www.stoxbolt.com/images/logo.png",
    url: "https://stoxbolt.com/about",
  };

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-orange-600 to-red-600 p-12 text-center">
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Zap className="text-orange-600 h-10 w-10 fill-current" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                About StoxBolt
              </h1>
              <p className="text-orange-100 text-lg max-w-2xl mx-auto">
                Empowering investors with lightning-fast financial news and
                actionable market insights.
              </p>
            </div>

            <div className="p-8 md:p-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="text-center p-6 bg-orange-50 rounded-xl">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="text-orange-600 h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Speed
                  </h3>
                  <p className="text-gray-600">
                    Real-time updates and breaking news delivered instantly to
                    keep you ahead of the market.
                  </p>
                </div>
                <div className="text-center p-6 bg-orange-50 rounded-xl">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="text-orange-600 h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Accuracy
                  </h3>
                  <p className="text-gray-600">
                    Verified information and precise data analysis you can trust
                    for your investment decisions.
                  </p>
                </div>
                <div className="text-center p-6 bg-orange-50 rounded-xl">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="text-orange-600 h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Insight
                  </h3>
                  <p className="text-gray-600">
                    Expert commentary and deep-dive analysis to help you
                    understand market trends.
                  </p>
                </div>
              </div>

              <div className="prose prose-lg max-w-none text-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Our Story
                </h2>
                <p className="mb-6">
                  Founded in 2024, StoxBolt emerged from a simple observation:
                  while financial information is abundant, finding accurate,
                  timely, and actionable insights without the noise is
                  increasingly difficult. Our team of financial analysts and
                  tech enthusiasts came together to build a platform that cuts
                  through the clutter.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Our Mission
                </h2>
                <p className="mb-6">
                  Our mission is to democratize financial intelligence. We
                  believe that whether you're a seasoned trader or a first-time
                  investor, you deserve access to high-quality market data and
                  news. StoxBolt is dedicated to providing the tools and
                  information necessary for financial growth and literacy.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  What We Cover
                </h2>
                <p>StoxBolt offers comprehensive coverage across:</p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none pl-0 mt-4">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Indian Equity Markets (BSE/NSE)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>US & Global Markets</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Cryptocurrency & Blockchain</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Commodities & Forex</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>IPO News & Analysis</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Economic Policy Updates</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default AboutPage;
