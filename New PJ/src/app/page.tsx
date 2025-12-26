import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="text-center py-20">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
          <span className="text-gradient">Your Professional</span>
          <br />
          <span className="text-gradient">Identity On-Chain</span>
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto animate-slide-up">
          Build a verified, tamper-proof resume powered by blockchain technology.
          Connect your Talent Protocol credentials and showcase your achievements.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/edit"
            className="gradient-primary px-8 py-4 rounded-lg font-semibold text-white hover:opacity-90 transition-opacity text-lg"
          >
            Create Your Resume
          </Link>
          <Link
            href="/explore"
            className="glass-effect px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors text-lg"
          >
            Explore Profiles
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-8">
        <div className="glass-effect p-8 rounded-xl text-center">
          <div className="text-5xl mb-4">🔐</div>
          <h3 className="text-xl font-bold mb-3">Blockchain Verified</h3>
          <p className="text-gray-400">
            All credentials stored on Base blockchain, ensuring authenticity and preventing fraud.
          </p>
        </div>
        
        <div className="glass-effect p-8 rounded-xl text-center">
          <div className="text-5xl mb-4">🌐</div>
          <h3 className="text-xl font-bold mb-3">IPFS Storage</h3>
          <p className="text-gray-400">
            Decentralized storage ensures your resume is always accessible and censorship-resistant.
          </p>
        </div>
        
        <div className="glass-effect p-8 rounded-xl text-center">
          <div className="text-5xl mb-4">⭐</div>
          <h3 className="text-xl font-bold mb-3">Talent Protocol</h3>
          <p className="text-gray-400">
            Integrate your reputation, achievements, and credentials from Talent Protocol.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="glass-effect p-12 rounded-xl text-center">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="text-4xl font-bold text-gradient mb-2">1,234</div>
            <div className="text-gray-400">Profiles Created</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-gradient mb-2">5,678</div>
            <div className="text-gray-400">Credentials Verified</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-gradient mb-2">89</div>
            <div className="text-gray-400">Countries</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-gradient mb-2">100%</div>
            <div className="text-gray-400">On-Chain</div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12 text-gradient">
          How It Works
        </h2>
        <div className="space-y-8">
          <div className="flex gap-6 items-start">
            <div className="gradient-primary w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0">
              1
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Connect Your Wallet</h3>
              <p className="text-gray-400">
                Use MetaMask or any Web3 wallet to connect to Base Mainnet.
              </p>
            </div>
          </div>
          
          <div className="flex gap-6 items-start">
            <div className="gradient-primary w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0">
              2
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Create Your Profile</h3>
              <p className="text-gray-400">
                Add your professional information, credentials, and achievements.
              </p>
            </div>
          </div>
          
          <div className="flex gap-6 items-start">
            <div className="gradient-primary w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0">
              3
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Get Verified</h3>
              <p className="text-gray-400">
                Have your credentials verified by issuers and build your on-chain reputation.
              </p>
            </div>
          </div>
          
          <div className="flex gap-6 items-start">
            <div className="gradient-primary w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0">
              4
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Share & Grow</h3>
              <p className="text-gray-400">
                Share your verifiable resume with employers and grow your professional network.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-20 glass-effect rounded-xl">
        <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Join thousands of professionals building their on-chain reputation.
        </p>
        <Link
          href="/edit"
          className="gradient-primary px-8 py-4 rounded-lg font-semibold text-white hover:opacity-90 transition-opacity text-lg inline-block"
        >
          Create Your Resume Now
        </Link>
      </section>
    </div>
  );
}
