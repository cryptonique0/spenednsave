"use client";

import { useState } from "react";
import { User, Mail, MapPin, Calendar, Save, X } from "lucide-react";

export function AccountPreferences() {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("John Doe");
  const [email, setEmail] = useState("john.doe@example.com");
  const [emailVerified, setEmailVerified] = useState(true);
  const [timezone, setTimezone] = useState("America/Los_Angeles");
  const [language, setLanguage] = useState("en-US");
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = () => {
    setSavedMessage(true);
    setIsEditing(false);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Profile Information */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Profile Information
          </h3>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Edit
            </button>
          )}
        </div>

        {savedMessage && (
          <div className="mb-6 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-4">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✓ Your account preferences have been saved successfully
            </p>
          </div>
        )}

        <div className="space-y-4">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-border rounded-lg bg-card disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background"
            />
          </div>

          {/* Email */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <Mail className="w-4 h-4" />
              Email Address
              {emailVerified && (
                <span className="text-xs bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                  Verified
                </span>
              )}
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isEditing}
                className="flex-1 px-4 py-2 border border-border rounded-lg bg-card disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background"
              />
              {!emailVerified && isEditing && (
                <button className="px-4 py-2 text-sm bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors">
                  Verify
                </button>
              )}
            </div>
          </div>

          {/* Timezone */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <MapPin className="w-4 h-4" />
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-border rounded-lg bg-card disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background"
            >
              <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
              <option value="America/Chicago">America/Chicago (CST)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Europe/Paris">Europe/Paris (CET)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              <option value="Australia/Sydney">Australia/Sydney (AEDT)</option>
            </select>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium mb-2">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-border rounded-lg bg-card disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background"
            >
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="es-ES">Español</option>
              <option value="fr-FR">Français</option>
              <option value="de-DE">Deutsch</option>
              <option value="ja-JP">日本語</option>
              <option value="zh-CN">中文</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Account Details */}
      <div className="border-t border-border pt-8">
        <h4 className="font-semibold mb-4">Account Information</h4>
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Account Created</span>
            <span className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Jan 15, 2025
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm text-muted-foreground">Last Login</span>
            <span className="text-sm font-medium">Today at 2:34 PM</span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm text-muted-foreground">Account Status</span>
            <span className="text-sm bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200 px-3 py-1 rounded-full font-medium">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Communication Preferences */}
      <div className="border-t border-border pt-8">
        <h4 className="font-semibold mb-4">Communication Preferences</h4>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted transition-colors">
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 rounded border border-border"
            />
            <span className="text-sm">Email me about account security and important updates</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted transition-colors">
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 rounded border border-border"
            />
            <span className="text-sm">Send me periodic tips and best practices</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted transition-colors">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border border-border"
            />
            <span className="text-sm">Notify me about new SpendGuard features</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted transition-colors">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border border-border"
            />
            <span className="text-sm">Send me promotional offers and special events</span>
          </label>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Tip:</strong> Your language and timezone preferences help us provide better support and timing for notifications.
        </p>
      </div>
    </div>
  );
}
