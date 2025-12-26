'use client';

import React from 'react';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';

export default function AboutPage() {
  const features = [
    {
      title: 'Blockchain Verified',
      description: 'All credentials are stored on-chain on Base Mainnet for immutable proof',
      icon: '🔗',
    },
    {
      title: 'Talent Protocol Integration',
      description: 'Seamlessly connect with Talent Protocol for reputation tracking',
      icon: '⭐',
    },
    {
      title: 'IPFS Storage',
      description: 'Resume data is distributed across IPFS for decentralization',
      icon: '🌐',
    },
    {
      title: 'Web3 Native',
      description: 'Full Web3 wallet integration with multi-chain support',
      icon: '💰',
    },
    {
      title: 'Privacy Focused',
      description: 'You control your data with granular permission controls',
      icon: '🔒',
    },
    {
      title: 'Real-time Sync',
      description: 'Instant synchronization across all connected platforms',
      icon: '⚡',
    },
  ];

  const team = [
    {
      name: 'Alex Johnson',
      role: 'Lead Developer',
      avatar: '👨‍💻',
    },
    {
      name: 'Sarah Chen',
      role: 'Product Designer',
      avatar: '👩‍🎨',
    },
    {
      name: 'Marcus Williams',
      role: 'Blockchain Engineer',
      avatar: '👨‍🔬',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            About Talent Resume
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Building the future of verifiable, decentralized professional profiles on Web3
          </p>
        </div>

        {/* Mission */}
        <Card className="mb-16 p-12 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0" shadow="lg">
          <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
          <p className="text-lg leading-relaxed">
            To empower professionals with a blockchain-based resume platform that puts ownership and control
            back into their hands. We believe that credentials should be verifiable, portable, and belong to
            the individual, not to any centralized authority.
          </p>
        </Card>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">
            Key Features
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="p-6" border shadow="md">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>

        {/* Technology Stack */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">
            Built With Latest Technology
          </h2>
          <div className="grid gap-4 md:grid-cols-4 justify-items-center">
            {['Next.js', 'TypeScript', 'Solidity', 'Base Mainnet', 'Wagmi', 'IPFS', 'Tailwind CSS', 'React Query'].map((tech) => (
              <Badge key={tech} variant="primary" size="lg">
                {tech}
              </Badge>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">
            Meet Our Team
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {team.map((member) => (
              <Card key={member.name} className="p-8 text-center" border shadow="md">
                <div className="text-6xl mb-4">{member.avatar}</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {member.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {member.role}
                </p>
                <Button variant="secondary" className="w-full">
                  Connect
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Card className="p-12 bg-gradient-to-r from-indigo-600 to-blue-500 text-white text-center border-0" shadow="lg">
          <h2 className="text-3xl font-bold mb-4">Ready to Start?</h2>
          <p className="text-lg mb-8 opacity-90">
            Create your verified resume on the blockchain today
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button className="bg-white text-blue-600 hover:bg-gray-100">
              Get Started
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white/10">
              Learn More
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
