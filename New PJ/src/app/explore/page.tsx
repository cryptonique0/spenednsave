'use client';

import React, { useState } from 'react';
import { Input } from '@/components/Input';
import Pagination from '@/components/Pagination';
import Leaderboard from '@/components/Leaderboard';
import Skeleton from '@/components/Skeleton';
import useDebounce from '@/hooks/useDebounce';

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Explore Profiles
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Discover talented professionals in the Talent Protocol ecosystem
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <Input
            type="text"
            placeholder="Search by handle or address..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            icon="🔍"
          />
        </div>

        {/* Results Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {isLoading ? (
            <div className="p-8 space-y-4">
              <Skeleton type="card" height="120px" count={5} />
            </div>
          ) : (
            <>
              <div className="p-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                  {debouncedSearch ? `Results for "${debouncedSearch}"` : 'Top Profiles'}
                </h2>
                <Leaderboard />
              </div>

              {/* Pagination */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-6 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={10}
                  onPageChange={setCurrentPage}
                  maxVisible={5}
                />
              </div>
            </>
          )}
        </div>

        {/* Filter Info */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
            💡 Tip: Advanced Filters
          </h3>
          <p className="text-blue-800 dark:text-blue-300 text-sm">
            Use advanced filters to find profiles by reputation score, verified credentials, or specific achievement badges.
          </p>
        </div>
      </div>
    </div>
  );
}
