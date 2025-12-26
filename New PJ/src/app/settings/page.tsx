'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Card from '@/components/Card';
import Tabs, { TabPanel } from '@/components/Tabs';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Dropdown from '@/components/Dropdown';
import { useAccount, useDisconnect } from 'wagmi';

export default function SettingsPage() {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'privacy', label: 'Privacy' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'advanced', label: 'Advanced' },
  ];

  const languageOptions = [
    { label: 'English', value: 'en' },
    { label: 'Spanish', value: 'es' },
    { label: 'French', value: 'fr' },
    { label: 'German', value: 'de' },
  ];

  const themeOptions = [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'Auto', value: 'auto' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">
            Manage your account settings and preferences
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

            {activeTab === 'profile' && (
              <TabPanel>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Profile Settings
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Display Name
                        </label>
                        <Input type="text" placeholder="Your name" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <Input type="email" placeholder="your@email.com" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bio
                        </label>
                        <textarea
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={4}
                          placeholder="Tell us about yourself..."
                        />
                      </div>
                      <Button>Save Changes</Button>
                    </div>
                  </div>
                </div>
              </TabPanel>
            )}

            {activeTab === 'privacy' && (
              <TabPanel>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Privacy Settings
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Public Profile</p>
                          <p className="text-sm text-gray-600">
                            Allow others to view your profile
                          </p>
                        </div>
                        <input type="checkbox" className="w-5 h-5" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Show Credentials</p>
                          <p className="text-sm text-gray-600">
                            Display your verified credentials publicly
                          </p>
                        </div>
                        <input type="checkbox" className="w-5 h-5" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Show Achievements</p>
                          <p className="text-sm text-gray-600">
                            Display your unlocked achievements
                          </p>
                        </div>
                        <input type="checkbox" className="w-5 h-5" defaultChecked />
                      </div>
                    </div>
                  </div>
                </div>
              </TabPanel>
            )}

            {activeTab === 'notifications' && (
              <TabPanel>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Notification Preferences
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">New Credentials</p>
                          <p className="text-sm text-gray-600">
                            Get notified when you receive new credentials
                          </p>
                        </div>
                        <input type="checkbox" className="w-5 h-5" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Achievement Unlocked</p>
                          <p className="text-sm text-gray-600">
                            Get notified when you unlock achievements
                          </p>
                        </div>
                        <input type="checkbox" className="w-5 h-5" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Profile Views</p>
                          <p className="text-sm text-gray-600">
                            Get notified when someone views your profile
                          </p>
                        </div>
                        <input type="checkbox" className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </div>
              </TabPanel>
            )}

            {activeTab === 'advanced' && (
              <TabPanel>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Advanced Settings
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Language
                        </label>
                        <Dropdown
                          options={languageOptions}
                          value="en"
                          placeholder="Select language"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Theme
                        </label>
                        <Dropdown
                          options={themeOptions}
                          value="light"
                          placeholder="Select theme"
                        />
                      </div>
                      <div className="pt-4 border-t border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-2">Wallet</h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Connected: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'None'}
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => disconnect()}
                          disabled={!address}
                        >
                          Disconnect Wallet
                        </Button>
                      </div>
                      <div className="pt-4 border-t border-gray-200">
                        <h4 className="font-medium text-red-600 mb-2">Danger Zone</h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Delete your account and all associated data
                        </p>
                        <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabPanel>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
