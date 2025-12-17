import React from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import Metatags from "../SEO/metatags";

const DisclaimerPage = () => {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const metaPropsData = {
    title: "Disclaimer & Legal Information Policy - StoxBolt",
    description:
      "Read StoxBolt's disclaimer and legal information. Important notices regarding financial information, investment advice, and terms of use for our platform.",
    keyword:
      "disclaimer, legal information, financial disclaimer, investment warning, terms of use, risk disclosure",
    image: "https://www.stoxbolt.com/images/logo.png",
    url: "https://stoxbolt.com/disclaimer",
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
              Disclaimer
            </h1>

            <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  General Information
                </h2>
                <p>
                  The information provided on StoxBolt is for general
                  informational purposes only. All information on the site is
                  provided in good faith; however, we make no representation or
                  warranty of any kind, express or implied, regarding the
                  accuracy, adequacy, validity, reliability, availability, or
                  completeness of any information on the site.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Investment Disclaimer
                </h2>
                <p>
                  The content on StoxBolt does not constitute financial advice.
                  We are not financial advisors, and the information provided
                  should not be considered as a substitute for professional
                  financial advice. Always consult with a qualified financial
                  advisor before making investment decisions.
                </p>
                <p>
                  Past performance is not indicative of future results.
                  Investing in financial markets involves risk, and you may lose
                  some or all of your investment.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  External Links Disclaimer
                </h2>
                <p>
                  StoxBolt may contain links to external websites that are not
                  provided or maintained by us. We do not guarantee the
                  accuracy, relevance, timeliness, or completeness of any
                  information on these external websites.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  No Warranties
                </h2>
                <p>
                  The content is provided "as is" without warranties of any
                  kind, either express or implied. We disclaim all warranties,
                  including but not limited to implied warranties of
                  merchantability and fitness for a particular purpose.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Limitation of Liability
                </h2>
                <p>
                  In no event shall StoxBolt be liable for any direct, indirect,
                  incidental, special, consequential, or punitive damages
                  arising out of your use of or inability to use the site or any
                  information provided on the site.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Changes to Disclaimer
                </h2>
                <p>
                  We reserve the right to modify this disclaimer at any time.
                  Changes will be effective immediately upon posting on this
                  page.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Contact Information
                </h2>
                <p>
                  If you have any questions about this disclaimer, please
                  contact us at legal@stoxbolt.com
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

export default DisclaimerPage;
