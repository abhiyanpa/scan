import React from 'react';
import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Terms() {
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
          <h2 className="text-2xl font-bold text-[#7289da] mb-6">Terms of Service</h2>
          
          <div className="space-y-6 text-gray-300">
            <section>
              <h3 className="text-xl text-[#7289da] mb-3">1. Acceptance of Terms</h3>
              <p>By accessing and using CRUZE SCAN, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
            </section>

            <section>
              <h3 className="text-xl text-[#7289da] mb-3">2. Use of Service</h3>
              <p>You agree to use CRUZE SCAN only for lawful purposes and in a way that does not infringe upon the rights of others or restrict their use of the service.</p>
            </section>

            <section>
              <h3 className="text-xl text-[#7289da] mb-3">3. File Submission</h3>
              <p>Any files submitted to CRUZE SCAN may be shared with the security community for analysis. Do not submit files containing sensitive or confidential information.</p>
            </section>

            <section>
              <h3 className="text-xl text-[#7289da] mb-3">4. Service Limitations</h3>
              <p>CRUZE SCAN is provided "as is" without any warranties. We reserve the right to modify or discontinue the service at any time.</p>
            </section>

            <section>
              <h3 className="text-xl text-[#7289da] mb-3">5. User Responsibilities</h3>
              <p>You are responsible for maintaining the confidentiality of your usage and any content you submit to the service.</p>
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
