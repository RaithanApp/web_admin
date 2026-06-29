'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(false);
    setErrorMessage(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

    if (data?.user) {
      // Successfully authenticated, route them into the app
      router.replace('/categories');
      router.refresh();
    }
    } catch (err) {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccountMock = () => {
    alert('Account deletion workflows must be handled within authenticated sessions.');
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-gray-50 font-sans select-none overflow-hidden">
      
      {/* Top Right Action Header Bar */}
      <div className="absolute top-0 right-0 p-6 z-20">
        <button
          onClick={handleDeleteAccountMock}
          type="button"
          className="bg-[#ff4d4d] hover:bg-red-600 text-white font-semibold text-sm py-2.5 px-5 rounded-lg shadow transition-all duration-200 ease-in-out"
        >
          Delete Account
        </button>
      </div>

      {/* Main Container Layering */}
      <div className="relative w-full max-w-[440px] px-4 md:px-0">
        
        {/* Abstract Green Backdrop Asset Shadow Box */}
        <div className="absolute top-12 left-10 w-full h-[480px] bg-[#52b100] rounded-2xl transform rotate-0 z-0 shadow-sm" />

        {/* Floating White Authentication Card */}
        <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 p-10 z-10 w-full min-h-[480px] flex flex-col justify-center">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#1f2937] tracking-tight mb-1.5">
              Sign in
            </h1>
            <p className="text-gray-400 text-sm font-medium">
              Sign in to access your account
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Context Feedback Message Block */}
            {errorMessage && (
              <div className="text-xs bg-red-50 text-red-500 border border-red-100 p-3 rounded-lg font-medium text-center">
                {errorMessage}
              </div>
            )}

            <div>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Your Email"
                className="w-full px-4 py-3.5 border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-300 focus:ring-0 text-sm transition-all"
              />
            </div>

            <div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Your Password"
                className="w-full px-4 py-3.5 border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-300 focus:ring-0 text-sm transition-all"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#52b100] hover:bg-[#469600] active:scale-[0.99] text-white font-bold py-3.5 rounded-lg shadow-md text-sm tracking-wide transition-all duration-150 disabled:opacity-60 disabled:pointer-events-none"
              >
                {loading ? 'Authenticating...' : 'Login'}
              </button>
            </div>
          </form>

          {/* Ancillary Footer Routing Block */}
=            <div className="mt-8 text-center text-xs font-semibold text-gray-700">
              <button
                type="button"
                onClick={() => setShowPrivacyModal(true)}
                className="text-[#2563eb] hover:underline"
              >
                Privacy Policy & Terms of Service
              </button>
            </div>

        </div>
      </div>
      {showPrivacyModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">

      <div className="flex items-center justify-between border-b px-6 py-4">
        <h2 className="text-xl font-bold">
          Privacy Policy & Terms of Service
        </h2>

        <button
          onClick={() => setShowPrivacyModal(false)}
          className="text-gray-500 hover:text-black text-2xl leading-none"
        >
          ×
        </button>
      </div>

      <div className="overflow-y-auto px-6 py-5 text-sm text-gray-700 space-y-6">

        <div>
          <h3 className="font-bold text-lg mb-2">Privacy Policy</h3>

          <h4 className="font-semibold mt-4">1. Introduction</h4>
          <p>
            Welcome to Rathan. We are committed to protecting your personal
            information and your right to privacy. This Privacy Policy outlines
            how we collect, use, disclose, and safeguard your information when
            you use our mobile application. By accessing or using the Rathan
            app, you agree to this Privacy Policy.
          </p>

          <h4 className="font-semibold mt-4">2. Information We Collect</h4>
          <ul className="list-disc pl-6 space-y-1">
            <li>Contact Information (phone numbers)</li>
            <li>Photos of products and services</li>
            <li>Business licenses and certifications</li>
            <li>Location data</li>
          </ul>

          <h4 className="font-semibold mt-4">3. How We Use Your Information</h4>
          <ul className="list-disc pl-6 space-y-1">
            <li>Provide and manage services</li>
            <li>Facilitate communication between users</li>
            <li>Verify identities and credentials</li>
            <li>Improve user experience</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h4 className="font-semibold mt-4">4. Sharing Your Information</h4>
          <ul className="list-disc pl-6 space-y-1">
            <li>Other users to facilitate transactions</li>
            <li>Third-party service providers</li>
            <li>Legal authorities when required</li>
          </ul>

          <h4 className="font-semibold mt-4">5. Data Security</h4>
          <p>
            We implement appropriate technical and organizational safeguards to
            protect your data. However, no system can guarantee absolute
            security.
          </p>

          <h4 className="font-semibold mt-4">6. User Rights</h4>
          <ul className="list-disc pl-6 space-y-1">
            <li>Access your personal data</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion</li>
            <li>Restrict or object to processing</li>
            <li>Withdraw consent</li>
          </ul>

          <h4 className="font-semibold mt-4">7. Grievance Redressal</h4>
          <p>
            Rathan Support Team
            <br />
            support@rathan.com
            <br />
            Address: Your Business Address
          </p>

          <h4 className="font-semibold mt-4">8. Changes to this Policy</h4>
          <p>
            We may update this Privacy Policy from time to time. Continued use
            of the application indicates acceptance of the revised policy.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-lg mb-2">
            Terms and Conditions
          </h3>

          <h4 className="font-semibold mt-4">1. Acceptance of Terms</h4>
          <p>
            By downloading, accessing, or using Rathan, you agree to these
            Terms and Conditions.
          </p>

          <h4 className="font-semibold mt-4">2. User Accounts</h4>
          <ul className="list-disc pl-6 space-y-1">
            <li>Provide accurate registration information.</li>
            <li>Keep your credentials secure.</li>
            <li>You are responsible for your account.</li>
          </ul>

          <h4 className="font-semibold mt-4">3. User Conduct</h4>
          <ul className="list-disc pl-6 space-y-1">
            <li>No unlawful use.</li>
            <li>No offensive or infringing content.</li>
            <li>Do not interfere with the app.</li>
          </ul>

          <h4 className="font-semibold mt-4">
            4. Service Providers & Seekers
          </h4>
          <p>
            Rathan only provides a platform connecting users. We do not
            guarantee the quality or legality of services and are not liable
            for disputes between users.
          </p>

          <h4 className="font-semibold mt-4">
            5. Intellectual Property
          </h4>
          <p>
            All content within the application belongs to Rathan and is
            protected by intellectual property laws.
          </p>

          <h4 className="font-semibold mt-4">6. Termination</h4>
          <p>
            We may suspend or terminate accounts that violate these terms.
          </p>

          <h4 className="font-semibold mt-4">7. Limitation of Liability</h4>
          <p>
            Rathan shall not be liable for indirect or consequential damages.
            Total liability is limited to the amount paid, if any, for use of
            the application.
          </p>

          <h4 className="font-semibold mt-4">
            8. Governing Law & Jurisdiction
          </h4>
          <p>
            These terms are governed by the laws of India. Disputes are subject
            to the exclusive jurisdiction of the courts in Hyderabad,
            Telangana.
          </p>

          <h4 className="font-semibold mt-4">9. Changes to Terms</h4>
          <p>
            We may update these Terms from time to time. Continued use of the
            application constitutes acceptance of the revised Terms.
          </p>

          <p className="mt-6 font-semibold">
            Last Updated: September 5, 2023
          </p>
        </div>

      </div>

      <div className="border-t p-4 flex justify-end">
        <button
          onClick={() => setShowPrivacyModal(false)}
          className="bg-[#52b100] hover:bg-[#469600] text-white px-6 py-2 rounded-lg font-semibold"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

