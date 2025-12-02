
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';

const RefundPolicyPage = () => {
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      <Helmet>
        <title>Refund Policy - StoxBolt</title>
        <meta name="description" content="StoxBolt refund and cancellation policy" />
      </Helmet>

      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-6">
              Refund Policy
            </h1>

            <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Subscription Refunds</h2>
                <p>
                  At StoxBolt, we strive to provide the highest quality financial insights. If you are not satisfied with your premium subscription, you may request a refund within 14 days of your initial purchase.
                </p>
                <p>
                  To be eligible for a refund, you must submit a request via our support email within the specified 14-day period. Refunds are processed to the original method of payment.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Non-Refundable Items</h2>
                <p>
                  The following items are non-refundable:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Monthly subscriptions after the 14-day cooling-off period</li>
                  <li>One-time detailed research reports or downloadable assets once accessed</li>
                  <li>Consultation fees for services already rendered</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Cancellation Policy</h2>
                <p>
                  You may cancel your recurring subscription at any time. Cancellation will be effective at the end of your current billing cycle. You will continue to have access to premium features until the end of your billing period.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Processing Time</h2>
                <p>
                  Once your refund request is approved, please allow 5-10 business days for the refund to appear on your credit card statement or bank account.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Changes to This Policy</h2>
                <p>
                  StoxBolt reserves the right to modify this Refund Policy at any time. Any changes will be effective immediately upon posting on the website.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Contact Us</h2>
                <p>
                  If you have any questions about our Refund Policy or need to request a refund, please contact us at billing@stoxbolt.com
                </p>
              </section>

              <div className="mt-8 pt-6 border-t text-sm text-gray-500">
                Last updated: {currentDate}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default RefundPolicyPage;
