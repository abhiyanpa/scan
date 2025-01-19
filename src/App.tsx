import React, { useState, useCallback } from 'react';
import { Shield, Upload, Link2, RotateCw } from 'lucide-react';
import { Routes, Route, Link } from 'react-router-dom';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

const VIRUSTOTAL_API_KEY = '';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'FILE' | 'URL' | 'SEARCH'>('FILE');
  const [isLoading, setIsLoading] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setScanResult(null);
    
    try {
      // Check file size
      if (file.size > 32 * 1024 * 1024) { // 32MB
        throw new Error('File size exceeds 32MB limit');
      }

      // First, get the file hash to check if it's already been analyzed
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Try to get existing report first
      try {
        const reportResponse = await fetch(`https://www.virustotal.com/api/v3/files/${hashHex}`, {
          headers: {
            'accept': 'application/json',
            'x-apikey': VIRUSTOTAL_API_KEY
          }
        });

        if (reportResponse.ok) {
          const reportData = await reportResponse.json();
          if (reportData.data) {
            setScanResult(reportData);
            setIsLoading(false);
            return;
          }
        }
      } catch (error) {
        console.log('No existing report found, proceeding with upload');
      }

      // If no existing report, upload the file
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('https://www.virustotal.com/api/v3/files', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'x-apikey': VIRUSTOTAL_API_KEY
        },
        body: formData
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error?.message || `Upload failed: ${uploadResponse.statusText}`);
      }

      const uploadData = await uploadResponse.json();
      
      if (!uploadData.data?.id) {
        throw new Error('No analysis ID received from upload');
      }

      // Poll for analysis completion
      const analysisId = uploadData.data.id;
      let analysisComplete = false;
      let attempts = 0;
      const maxAttempts = 30; // Maximum 2.5 minutes of polling
      
      while (!analysisComplete && attempts < maxAttempts) {
        attempts++;
        
        const analysisResponse = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
          headers: {
            'accept': 'application/json',
            'x-apikey': VIRUSTOTAL_API_KEY
          }
        });

        if (!analysisResponse.ok) {
          throw new Error('Failed to get analysis status');
        }

        const analysisData = await analysisResponse.json();
        
        if (analysisData.data?.attributes?.status === 'completed') {
          // Get the full file report using the file hash
          const fileResponse = await fetch(`https://www.virustotal.com/api/v3/files/${hashHex}`, {
            headers: {
              'accept': 'application/json',
              'x-apikey': VIRUSTOTAL_API_KEY
            }
          });

          if (!fileResponse.ok) {
            throw new Error('Failed to get file report');
          }

          const fileData = await fileResponse.json();
          setScanResult(fileData);
          analysisComplete = true;
        } else if (analysisData.data?.attributes?.status === 'failed') {
          throw new Error('Analysis failed');
        } else {
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before checking again
        }
      }

      if (!analysisComplete) {
        throw new Error('Analysis timed out');
      }
    } catch (error) {
      console.error('Error processing file:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while scanning the file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlScan = async (urlToScan: string) => {
    setIsLoading(true);
    setError(null);
    setScanResult(null);

    try {
      // Create form data with the correct format
      const formData = new FormData();
      formData.append('url', urlToScan);

      // Submit URL for scanning with correct headers
      const submitResponse = await fetch('https://www.virustotal.com/api/v3/urls', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'x-apikey': VIRUSTOTAL_API_KEY
        },
        body: formData
      });

      if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        throw new Error(errorData.error?.message || 'Failed to submit URL for scanning');
      }

      const submitData = await submitResponse.json();
      if (!submitData.data?.id) {
        throw new Error('No analysis ID received');
      }

      // Rest of the polling logic remains the same
      let analysisComplete = false;
      let attempts = 0;
      const maxAttempts = 30;

      while (!analysisComplete && attempts < maxAttempts) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between checks

        const analysisResponse = await fetch(`https://www.virustotal.com/api/v3/analyses/${submitData.data.id}`, {
          headers: {
            'accept': 'application/json',
            'x-apikey': VIRUSTOTAL_API_KEY
          }
        });

        if (!analysisResponse.ok) {
          throw new Error('Failed to get analysis status');
        }

        const analysisData = await analysisResponse.json();
        
        if (analysisData.data?.attributes?.status === 'completed') {
          // Get URL identifier (base64 URL-safe encoded)
          const urlId = btoa(urlToScan)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

          const urlResponse = await fetch(`https://www.virustotal.com/api/v3/urls/${urlId}`, {
            headers: {
              'accept': 'application/json',
              'x-apikey': VIRUSTOTAL_API_KEY
            }
          });

          if (!urlResponse.ok) {
            throw new Error('Failed to get URL report');
          }

          const urlData = await urlResponse.json();
          setScanResult(urlData);
          analysisComplete = true;
        } else if (analysisData.data?.attributes?.status === 'failed') {
          throw new Error('Analysis failed');
        }
      }

      if (!analysisComplete) {
        throw new Error('Analysis timed out');
      }
    } catch (error) {
      console.error('Error scanning URL:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while scanning the URL');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url && !isLoading) {
      handleUrlScan(url);
    }
  };

  const getSearchType = (query: string): 'DOMAIN' | 'IP' | 'HASH' | null => {
    // IP regex pattern
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    // Domain regex pattern
    const domainPattern = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
    // Hash pattern (MD5, SHA-1, SHA-256)
    const hashPattern = /^[a-fA-F0-9]{32,64}$/;

    if (ipPattern.test(query)) return 'IP';
    if (domainPattern.test(query)) return 'DOMAIN';
    if (hashPattern.test(query)) return 'HASH';
    return null;
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setScanResult(null);

    try {
      const searchType = getSearchType(searchQuery);
      if (!searchType) {
        throw new Error('Invalid search query. Please enter a valid domain, IP, or hash.');
      }

      let endpoint = '';
      switch (searchType) {
        case 'DOMAIN':
          endpoint = `https://www.virustotal.com/api/v3/domains/${searchQuery}`;
          break;
        case 'IP':
          endpoint = `https://www.virustotal.com/api/v3/ip_addresses/${searchQuery}`;
          break;
        case 'HASH':
          endpoint = `https://www.virustotal.com/api/v3/files/${searchQuery}`;
          break;
      }

      const response = await fetch(endpoint, {
        headers: {
          'accept': 'application/json',
          'x-apikey': VIRUSTOTAL_API_KEY
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get ${searchType.toLowerCase()} report`);
      }

      const data = await response.json();
      setScanResult(data);
    } catch (error) {
      console.error('Error searching:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while searching');
    } finally {
      setIsLoading(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      handleFileUpload(droppedFile);
    }
  }, []);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      handleFileUpload(selectedFile);
    }
  };

  const renderScanResult = () => {
    if (!scanResult?.data?.attributes) return null;

    const attributes = scanResult.data.attributes;
    const stats = attributes.last_analysis_stats || {};
    const results = attributes.last_analysis_results || {};

    return (
      <div className="mt-8 bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-[#7289da] mb-4">Scan Results</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-700 p-4 rounded-lg">
            <p className="text-green-400">Clean: {stats.harmless || 0}</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <p className="text-red-400">Malicious: {stats.malicious || 0}</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <p className="text-yellow-400">Suspicious: {stats.suspicious || 0}</p>
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-lg font-medium text-[#7289da] mb-2">Detailed Results</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {Object.entries(results).map(([engine, result]: [string, any]) => (
              <div key={engine} className="bg-gray-700 p-3 rounded-lg flex justify-between">
                <span>{engine}</span>
                <span className={
                  result.category === 'malicious' ? 'text-red-400' :
                  result.category === 'suspicious' ? 'text-yellow-400' :
                  'text-green-400'
                }>
                  {result.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Add function to handle tab changes
  const handleTabChange = (tab: 'FILE' | 'URL' | 'SEARCH') => {
    setActiveTab(tab);
    // Clear states when switching tabs
    setFile(null);
    setUrl('');
    setSearchQuery('');
    setError(null);
    setScanResult(null);
    setIsLoading(false);
  };

  return (
    <Routes>
      <Route path="/" element={
        <div className="min-h-screen bg-[#14151a] text-white">
          <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-center mb-12">
              <Shield className="w-12 h-12 text-[#7289da] mr-4" />
              <h1 className="text-4xl font-bold text-[#7289da]">CRUZE SCAN</h1>
            </div>

            {/* Description with Keywords */}
            <div className="text-center mb-12">
              <p className="text-gray-300 max-w-2xl mx-auto">
                Advanced online virus scanner and malware detection tool. Analyze suspicious files, 
                domains, IPs and URLs to detect viruses, malware, ransomware, and other security 
                threats. Protect yourself with real-time threat detection and analysis.
              </p>
            </div>

            {/* Tabs */}
            <div className="flex justify-center mb-8 border-b border-gray-700">
              <button
                className={`px-8 py-4 ${
                  activeTab === 'FILE' ? 'text-[#7289da] border-b-2 border-[#7289da]' : 'text-gray-400'
                }`}
                onClick={() => handleTabChange('FILE')}
              >
                FILE
              </button>
              <button
                className={`px-8 py-4 ${
                  activeTab === 'URL' ? 'text-[#7289da] border-b-2 border-[#7289da]' : 'text-gray-400'
                }`}
                onClick={() => handleTabChange('URL')}
              >
                URL
              </button>
              <button
                className={`px-8 py-4 ${
                  activeTab === 'SEARCH' ? 'text-[#7289da] border-b-2 border-[#7289da]' : 'text-gray-400'
                }`}
                onClick={() => handleTabChange('SEARCH')}
              >
                SEARCH
              </button>
            </div>

            {/* Upload Area */}
            <div className="max-w-2xl mx-auto">
              {activeTab === 'FILE' && (
                <div
                  className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onDrop}
                >
                  <Upload className="w-16 h-16 text-[#7289da] mx-auto mb-4" />
                  <div className="mb-4">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={onFileSelect}
                    />
                    <label
                      htmlFor="file-upload"
                      className="bg-[#7289da] text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-[#5b6eae] transition-colors"
                    >
                      Choose file
                    </label>
                  </div>
                  <p className="text-gray-400">or drag and drop file here</p>
                  {file && (
                    <div className="mt-4 text-[#7289da]">
                      Selected file: {file.name}
                    </div>
                  )}
                  {isLoading && (
                    <div className="mt-4 flex items-center justify-center">
                      <RotateCw className="w-6 h-6 animate-spin text-[#7289da]" />
                      <span className="ml-2 text-gray-400">Scanning...</span>
                    </div>
                  )}
                  {error && (
                    <div className="mt-4 text-red-500">
                      Error: {error}
                    </div>
                  )}
                  {renderScanResult()}
                </div>
              )}

              {activeTab === 'URL' && (
                <div className="flex flex-col gap-4">
                  <form onSubmit={handleSubmit} className="flex items-center gap-4">
                    <input
                      type="text"
                      placeholder="Enter URL to scan"
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#7289da]"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="bg-[#7289da] text-white px-6 py-3 rounded-lg hover:bg-[#5b6eae] transition-colors disabled:opacity-50"
                      disabled={!url || isLoading}
                    >
                      {isLoading ? <RotateCw className="w-5 h-5 animate-spin" /> : <Link2 className="w-5 h-5" />}
                    </button>
                  </form>
                  {error && (
                    <div className="text-red-500 text-center">
                      Error: {error}
                    </div>
                  )}
                  {renderScanResult()}
                </div>
              )}

              {activeTab === 'SEARCH' && (
                <div className="flex flex-col gap-4">
                  <form onSubmit={handleSearch} className="flex items-center gap-4">
                    <input
                      type="text"
                      placeholder="Enter domain, IP address, or file hash"
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#7289da]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="bg-[#7289da] text-white px-6 py-3 rounded-lg hover:bg-[#5b6eae] transition-colors disabled:opacity-50"
                      disabled={!searchQuery || isLoading}
                    >
                      {isLoading ? <RotateCw className="w-5 h-5 animate-spin" /> : 'Search'}
                    </button>
                  </form>
                  {error && (
                    <div className="text-red-500 text-center">
                      Error: {error}
                    </div>
                  )}
                  {renderScanResult()}
                </div>
              )}
            </div>

            {/* Footer with Attribution */}
            <div className="mt-12 text-center">
              <div className="text-sm text-gray-500 mb-2">
                Developed by <a href="https://github.com/abhiyanPA" className="text-[#7289da] hover:underline">Abhiyan P A</a>
              </div>
              <div className="mt-4 text-center text-sm text-gray-500">
                By submitting data above, you are agreeing to our{' '}
                <Link to="/terms" className="text-[#7289da] hover:underline">Terms of Service</Link> and{' '}
                <Link to="/privacy" className="text-[#7289da] hover:underline">Privacy Notice</Link>,
                and to the sharing of your sample submission with the security community.
              </div>
            </div>
          </div>
        </div>
      } />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
    </Routes>
  );
}

export default App;