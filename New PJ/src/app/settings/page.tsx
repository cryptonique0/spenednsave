'use client';

import React, { useState } from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import useToggle from '@/hooks/useToggle';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export default function SettingsPage() {
  const [darkMode, toggleDarkMode] = useToggle(false);
  const [notifications, toggleNotifications] = useToggle(true);
  const [publicProfile, togglePublicProfile] = useToggle(true);
  const [savedPreferences, setSavedPreferences] = useLocalStorage<any>('user-settings');

  const handleSaveSettings = () => {
    setSavedPreferences({
      darkMode,
      notifications,
      publicProfile,
      savedAt: new Date().toISOString(),
    });
    alert('Settings saved successfully!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account preferences and settings
          </p>
        </div>

        {/* Account Settings */}
        <Card className="mb-8 p-6" border shadow="lg">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Account Settings
          </h2>

          <div className="space-y-6">
            {/* Dark Mode */}
            <div className="flex items-center justify-between pb-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Dark Mode
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Enable dark theme for the application
                </p>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  darkMode ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between pb-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Email Notifications
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receive updates about your profile and credentials
                </p>
              </div>
              <button
                onClick={toggleNotifications}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Public Profile */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Public Profile
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Make your profile visible to other users
                </p>
              </div>
              <button
                onClick={togglePublicProfile}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  publicProfile ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    publicProfile ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </Card>

        {/* Privacy & Security */}
        <Card className="mb-8 p-6" border shadow="lg">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Privacy & Security
          </h2>

          <div className="space-y-4">
            <Button variant="secondary" className="w-full">
              Change Password
            </Button>
            <Button variant="secondary" className="w-full">
              Two-Factor Authentication
            </Button>
            <Button variant="secondary" className="w-full">
              Connected Wallets
            </Button>
            <Button variant="secondary" className="w-full">
              Active Sessions
            </Button>
          </div>
        </Card>

        {/* Data Management */}
        <Card className="mb-8 p-6" border shadow="lg">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Data Management
          </h2>

          <div className="space-y-4">
            <Button variant="secondary" className="w-full">
              Export Profile Data
            </Button>
            <Button variant="secondary" className="w-full">
              Download Credentials
            </Button>
            <Button variant="outline" className="w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
              Delete Account
            </Button>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex gap-4">
          <Button variant="primary" className="flex-1" onClick={handleSaveSettings}>
            Save Changes
          </Button>
          <Button variant="secondary" className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
