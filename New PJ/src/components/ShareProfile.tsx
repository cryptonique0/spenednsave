"use client";

import React, { useState } from 'react';
import Button from '@/components/Button';
import useToast from '@/hooks/useToast';

interface ShareProfileProps {
  address: string;
  className?: string;
}

const ShareProfile: React.FC<ShareProfileProps> = ({ address, className = '' }) => {
  const { success, error } = useToast();
  const [copied, setCopied] = useState(false);

  const profileUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/profile/${address}`
    : `/profile/${address}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      success('Profile link copied to clipboard!');
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      error('Failed to copy link');
    }
  };

  const shareNative = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My Web3 Profile', url: profileUrl });
        success('Shared successfully');
      } else {
        await copyToClipboard();
      }
    } catch (e) {
      // User cancelled or share failed
    }
  };

  return (
    <div className={`flex gap-3 ${className}`}>
      <Button variant="secondary" onClick={copyToClipboard}>
        {copied ? 'Copied ✓' : 'Copy Link'}
      </Button>
      <Button variant="primary" onClick={shareNative}>
        Share
      </Button>
    </div>
  );
};

export default ShareProfile;
