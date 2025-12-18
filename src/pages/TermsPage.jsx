import React from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import Metatags from "../SEO/metatags";

const TermsPage = () => {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const metaPropsData = {
    title: "Terms of Service of StoxBolt Financial News Platform",
    description:
      "Read StoxBolt's terms of service and conditions of use agreement. Important information about user accounts, content guidelines, and platform usage policies.",
    keyword:
      "terms of service, user agreement, platform rules, service terms, usage agreement",
    image: "https://www.stoxbolt.com/images/logo.png",
    url: "https://stoxbolt.com/terms",
  };

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-6">
              Terms of Service
            </h1>

            <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  1. Acceptance of Terms
                </h2>
                <p>
                  By accessing and using StoxBolt, you accept and agree to be
                  bound by the terms and provision of this agreement. If you do
                  not agree to these terms, please do not use our services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  2. Use License
                </h2>
                <p>
                  Permission is granted to temporarily access the materials
                  (information or software) on StoxBolt for personal,
                  non-commercial transitory viewing only. This is the grant of a
                  license, not a transfer of title.
                </p>
                <p>Under this license you may not:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Modify or copy the materials</li>
                  <li>Use the materials for any commercial purpose</li>
                  <li>Attempt to decompile or reverse engineer any software</li>
                  <li>Remove any copyright or other proprietary notations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  3. User Accounts
                </h2>
                <p>
                  When you create an account with us, you must provide accurate
                  and complete information. You are responsible for maintaining
                  the confidentiality of your account and password.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  4. Content Guidelines
                </h2>
                <p>
                  All content published on StoxBolt must comply with our content
                  guidelines. We reserve the right to remove any content that
                  violates these terms or is deemed inappropriate.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  5. Intellectual Property
                </h2>
                <p>
                  The content, features, and functionality of StoxBolt are owned
                  by us and are protected by international copyright, trademark,
                  and other intellectual property laws.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  6. Termination
                </h2>
                <p>
                  We may terminate or suspend your account and bar access to the
                  service immediately, without prior notice or liability, under
                  our sole discretion, for any reason whatsoever.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  7. Limitation of Liability
                </h2>
                <p>
                  In no event shall StoxBolt, nor its directors, employees,
                  partners, agents, suppliers, or affiliates, be liable for any
                  indirect, incidental, special, consequential, or punitive
                  damages.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  8. Changes to Terms
                </h2>
                <p>
                  We reserve the right to modify or replace these terms at any
                  time. We will provide notice of any changes by posting the new
                  terms on this page.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  9. Contact Us
                </h2>
                <p>
                  If you have any questions about these Terms, please contact us
                  at terms@stoxbolt.com
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

export default TermsPage;
