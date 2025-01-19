import React from 'react';
import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#14151a] text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-center mb-12">
          <Link to="/" className="flex items-center">
            <Shield className="w-12 h-12 text-[#7289da] mr-4" />
            <h1 className="text-4xl font-bold text-[#7289da]">CRUZE SCAN</h1>
          </Link>
        </div>

        <div className="max-w-3xl mx-auto bg-gray-800 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-[#7289da] mb-6">Privacy Notice</h2>
          
          <div className="space-y-6 text-gray-300">
            <section>
              <h3 className="text-xl text-[#7289da] mb-3">1. Information Collection</h3>
              <p>We collect information about the files, URLs, and domains you submit for scanning. This includes file hashes, metadata, and scan results.</p>
            </section>

            <section>
              <h3 className="text-xl text-[#7289da] mb-3">2. Information Sharing</h3>
              <p>Submitted samples may be shared with the security community to improve threat detection. We do not collect personal information unless voluntarily provided.</p>
            </section>

            <section>
              <h3 className="text-xl text-[#7289da] mb-3">3. Data Security</h3>
              <p>We implement security measures to protect your submissions but cannot guarantee absolute security. Do not submit sensitive personal information.</p>
            </section>

            <section>
              <h3 className="text-xl text-[#7289da] mb-3">4. Cookie Policy</h3>
              <p>We use essential cookies to ensure the basic functionality of our service. No tracking or marketing cookies are used.</p>
            </section>

            <section>
              <h3 className="text-xl text-[#7289da] mb-3">5. Your Rights</h3>
              <p>You have the right to request information about your submissions and their removal from our systems, where applicable.</p>
            </section>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link to="/" className="text-[#7289da] hover:underline">Return to Home</Link>
        </div>
      </div>
    </div>
  );
}
