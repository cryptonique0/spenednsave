'use client';

import { useState } from 'react';
import { Palette, Bell, Globe, Save, RotateCcw, Check } from 'lucide-react';

interface CustomizationSettings {
  theme: 'light' | 'dark' | 'auto';
  accentColor: 'primary' | 'success' | 'warning' | 'error';
  density: 'compact' | 'comfortable' | 'spacious';
  animationsEnabled: boolean;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  language: string;
  timeZone: string;
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  sidebarCollapsed: boolean;
  showAvatars: boolean;
  reduceMotion: boolean;
}

const THEME_OPTIONS = [
  { id: 'light', name: 'Light', icon: '☀️' },
  { id: 'dark', name: 'Dark', icon: '🌙' },
  { id: 'auto', name: 'Auto', icon: '🔄' }
];

const ACCENT_COLORS = [
  { id: 'primary', name: 'Blue', color: '#3B82F6' },
  { id: 'success', name: 'Green', color: '#10B981' },
  { id: 'warning', name: 'Amber', color: '#F59E0B' },
  { id: 'error', name: 'Red', color: '#EF4444' }
];

const DENSITY_OPTIONS = [
  { id: 'compact', name: 'Compact', description: 'Reduced padding and spacing' },
  { id: 'comfortable', name: 'Comfortable', description: 'Default spacing and layout' },
  { id: 'spacious', name: 'Spacious', description: 'Increased padding and spacing' }
];

export function CustomizationOptions() {
  const [settings, setSettings] = useState<CustomizationSettings>({
    theme: 'dark',
    accentColor: 'primary',
    density: 'comfortable',
    animationsEnabled: true,
    notificationsEnabled: true,
    emailNotifications: true,
    pushNotifications: false,
    language: 'en',
    timeZone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    sidebarCollapsed: false,
    showAvatars: true,
    reduceMotion: false
  });

  const [saved, setSaved] = useState(false);
  const defaultSettings = { ...settings };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setSettings(defaultSettings);
  };

  const updateSetting = <K extends keyof CustomizationSettings>(
    key: K,
    value: CustomizationSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="w-full space-y-6 max-w-4xl">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Palette className="w-6 h-6" />
          Customization Options
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Personalize your SpendGuard experience with custom settings
        </p>
      </div>

      {/* Appearance Section */}
      <div className="bg-white dark:bg-surface-dark border border-surface-border dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
          🎨 Appearance
        </h3>

        <div className="space-y-6">
          {/* Theme */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">
              Theme
            </label>
            <div className="flex gap-3">
              {THEME_OPTIONS.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => updateSetting('theme', theme.id as 'light' | 'dark' | 'auto')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all font-semibold text-sm flex items-center justify-center gap-2 ${
                    settings.theme === theme.id
                      ? 'border-primary bg-primary/10 text-primary dark:bg-primary/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <span className="text-lg">{theme.icon}</span>
                  {theme.name}
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">
              Accent Color
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color.id}
                  onClick={() => updateSetting('accentColor', color.id as 'primary' | 'success' | 'warning' | 'error')}
                  className={`p-4 rounded-lg border-2 transition-all text-sm font-semibold flex items-center gap-2 ${
                    settings.accentColor === color.id
                      ? 'border-current'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                  style={{
                    backgroundColor: settings.accentColor === color.id ? `${color.color}20` : '',
                    borderColor: settings.accentColor === color.id ? color.color : undefined
                  }}
                >
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: color.color }}
                  />
                  {color.name}
                </button>
              ))}
            </div>
          </div>

          {/* Density */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">
              Display Density
            </label>
            <div className="space-y-2">
              {DENSITY_OPTIONS.map((density) => (
                <label
                  key={density.id}
                  className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all"
                  style={{
                    borderColor: settings.density === density.id ? '#3B82F6' : 'transparent',
                    backgroundColor: settings.density === density.id ? 'rgba(59, 130, 246, 0.05)' : ''
                  }}
                >
                  <input
                    type="radio"
                    name="density"
                    value={density.id}
                    checked={settings.density === density.id as 'compact' | 'comfortable' | 'spacious'}
                    onChange={(e) => updateSetting('density', e.target.value as 'compact' | 'comfortable' | 'spacious')}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">
                      {density.name}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {density.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Animations */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">
                Enable Animations
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Smooth transitions and motion effects
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.animationsEnabled}
                onChange={(e) => updateSetting('animationsEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>

          {/* Reduce Motion */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">
                Reduce Motion
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Minimize animations for accessibility
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.reduceMotion}
                onChange={(e) => updateSetting('reduceMotion', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>

          {/* Sidebar Collapsed */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">
                Collapse Sidebar by Default
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                More screen space for content
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.sidebarCollapsed}
                onChange={(e) => updateSetting('sidebarCollapsed', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>

          {/* Show Avatars */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">
                Show User Avatars
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Display profile pictures throughout the app
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showAvatars}
                onChange={(e) => updateSetting('showAvatars', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="bg-white dark:bg-surface-dark border border-surface-border dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notifications
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">
                Enable All Notifications
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Receive important alerts and updates
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={(e) => updateSetting('notificationsEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>

          {settings.notificationsEnabled && (
            <>
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">
                    Email Notifications
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Receive updates via email
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => updateSetting('emailNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">
                    Push Notifications
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Browser and mobile push alerts
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.pushNotifications}
                    onChange={(e) => updateSetting('pushNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                </label>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Localization Section */}
      <div className="bg-white dark:bg-surface-dark border border-surface-border dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Localization
        </h3>

        <div className="space-y-4">
          {/* Language */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
              Language
            </label>
            <select
              value={settings.language}
              onChange={(e) => updateSetting('language', e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-surface-dark border border-surface-border dark:border-gray-700 rounded-lg text-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="it">Italiano</option>
              <option value="ja">日本語</option>
              <option value="zh">中文</option>
            </select>
          </div>

          {/* Time Zone */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
              Time Zone
            </label>
            <select
              value={settings.timeZone}
              onChange={(e) => updateSetting('timeZone', e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-surface-dark border border-surface-border dark:border-gray-700 rounded-lg text-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="America/Chicago">America/Chicago (CST)</option>
              <option value="America/Denver">America/Denver (MST)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Europe/Paris">Europe/Paris (CET)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              <option value="Australia/Sydney">Australia/Sydney (AEDT)</option>
            </select>
          </div>

          {/* Date Format */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
              Date Format
            </label>
            <div className="space-y-2">
              {['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'].map((format) => (
                <label key={format} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800">
                  <input
                    type="radio"
                    name="dateFormat"
                    value={format}
                    checked={settings.dateFormat === format as 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'}
                    onChange={(e) => updateSetting('dateFormat', e.target.value as 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-slate-900 dark:text-white font-mono">
                    {format === 'MM/DD/YYYY' && '01/17/2025'}
                    {format === 'DD/MM/YYYY' && '17/01/2025'}
                    {format === 'YYYY-MM-DD' && '2025-01-17'}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className={`flex-1 px-6 py-3 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
            saved
              ? 'bg-success text-white'
              : 'bg-primary hover:bg-primary-dark text-white'
          }`}
        >
          {saved ? (
            <>
              <Check className="w-5 h-5" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Changes
            </>
          )}
        </button>
        <button
          onClick={handleReset}
          className="flex-1 px-6 py-3 font-semibold rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}
