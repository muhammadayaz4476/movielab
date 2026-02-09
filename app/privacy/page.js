import React from "react";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

export default function PrivacyPage() {
  return (
    <main className="w-full pt-[10vw] min-h-screen bg-black text-white pb-20 px-4 lg:px-[10vw] xl:px-[15vw]">
      <Navbar />

      <div className=" px-[10vw]  font-poppins">
        <h1 className="text-4xl font-comfortaa font-bold mt-12 mb-8 text-center">
          Privacy Policy
        </h1>

        <p className="text-zinc-400 text-sm mb-10 text-center">
          Last updated: February 09, 2026
        </p>

        <div className="prose prose-invert prose-zinc max-w-none space-y-8 text-zinc-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p>
              Welcome to MovieLab (accessible at https://movies.umairlab.com/). 
              We are committed to protecting your privacy and handling any personal information you share with us responsibly.
            </p>
            <p className="mt-3">
              This Privacy Policy explains what information we collect, how we use it, 
              who we may share it with, how we protect it, and your rights regarding your data.
            </p>
            <p className="mt-3">
              By using our website, you agree to the practices described in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
            <p>
              We design our website to collect as little personal information as possible.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-2">2.1 Information You Voluntarily Provide</h3>
            <p>
              The only way you can submit personal information to us is through the contact form (if available). 
              When you use the contact form, we collect:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Your name (as entered by you)</li>
              <li>Your message/content</li>
              <li>Optionally: email address or other contact details if you choose to include them in the message</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-2">2.2 Automatically Collected Information</h3>
            <p>
              Like most websites, our site may automatically collect certain non-personal information 
              for technical and analytical purposes, such as:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>IP address</li>
              <li>Browser type and version</li>
              <li>Operating system</li>
              <li>Referring/exit pages and timestamps</li>
              <li>Pages viewed and time spent on the site</li>
            </ul>
            <p className="mt-3">
              This data is usually collected in aggregated, anonymized form and does not identify you personally.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <p>We use the collected information only for the following limited purposes:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>To review and respond to messages submitted via the contact form</li>
              <li>To improve website performance, usability, and content relevance</li>
              <li>To diagnose technical issues and maintain site security</li>
              <li>To comply with applicable legal obligations, if any</li>
            </ul>
            <p className="mt-4">
              We do <strong>not</strong> use your information for marketing, profiling, behavioral advertising, 
              or any purpose unrelated to operating this website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Information Sharing & Disclosure</h2>
            <p>
              We do not sell, rent, or trade your personal information to third parties.
            </p>
            <p className="mt-3">
              We may disclose your information only in these limited cases:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>To comply with legal obligations, court orders, or valid government requests</li>
              <li>To protect the rights, property, or safety of MovieLab, our users, or the public</li>
              <li>In the event of a merger, acquisition, or sale of assets (with notice where required)</li>
            </ul>
            <p className="mt-4">
              Your contact form submissions are stored in our database and are accessible only to the site administrator.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Data Storage & Security</h2>
            <p>
              We store contact form submissions only for as long as necessary to review and respond 
              (typically a few weeks to months), after which they may be deleted.
            </p>
            <p className="mt-3">
              We implement reasonable technical and organizational measures to protect your data 
              from unauthorized access, loss, or misuse. However, no method of transmission over 
              the internet or electronic storage is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Cookies & Similar Technologies</h2>
            <p>
              Our website may use minimal cookies or similar technologies only for essential 
              functionality (such as remembering UI preferences if implemented). 
              We do not use advertising cookies, tracking pixels, or third-party analytics 
              services that profile users across sites.
            </p>
            <p className="mt-3">
              You can control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Your Rights</h2>
            <p>
              Depending on your location, you may have rights regarding your personal data, 
              including the right to access, correct, or request deletion of information we hold about you.
            </p>
            <p className="mt-3">
              To exercise any of these rights, please contact us using the details below.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Third-Party Links & Content</h2>
            <p>
              Our site may contain links to external websites (e.g., movie sources, trailers, etc.). 
              We are not responsible for the privacy practices or content of those sites.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Changes to This Privacy Policy</h2>
            <p>
              We may update this policy from time to time. The updated version will be posted here 
              with a revised "Last updated" date. We encourage you to review this page periodically.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or our data practices, 
              please contact the site administrator:
            </p>
            <p className="mt-3">
              Email: umairzakria6@gmail.com<br />
              Website: https://movies.umairlab.com/
            </p>
          </section>

          <p className="text-sm text-zinc-500 mt-12 pt-8 border-t border-zinc-800 text-center">
            This Privacy Policy is provided for informational purposes and does not create 
            any contractual rights or obligations beyond those required by applicable law.
          </p>
        </div>
      </div>

      <Footer />
    </main>
  );
}