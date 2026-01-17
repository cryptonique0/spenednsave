'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Shield, Users, Zap, Check, AlertCircle } from 'lucide-react';
import {
  VaultPresetConfig,
  VaultPresetsService,
  FAMILY_VAULT_PRESET,
  DAO_VAULT_PRESET,
  TEAM_VAULT_PRESET
} from '@/lib/services/vault/vault-presets';

interface PresetSelectorProps {
  onSelectPreset?: (preset: VaultPresetConfig) => void;
  selectedPresetId?: string;
}

/**
 * Vault Preset Selector Component
 * Browse and select pre-configured Family, DAO, and Team vaults
 */
export const PresetSelectorComponent: React.FC<PresetSelectorProps> = ({
  onSelectPreset,
  selectedPresetId
}) => {
  const [expandedPreset, setExpandedPreset] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);

  const presets = VaultPresetsService.getAllPresets();

  const handleSelectPreset = (preset: VaultPresetConfig) => {
    setExpandedPreset(expandedPreset === preset.id ? null : preset.id);
    onSelectPreset?.(preset);
  };

  const handleCompareToggle = (presetId: string) => {
    setSelectedPresets((prev) =>
      prev.includes(presetId) ? prev.filter((id) => id !== presetId) : [...prev, presetId]
    );
  };

  if (compareMode && selectedPresets.length > 0) {
    return (
      <ComparisonView
        presetIds={selectedPresets}
        onBack={() => {
          setCompareMode(false);
          setSelectedPresets([]);
        }}
      />
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Vault Presets</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Choose a pre-configured setup optimized for your use case
          </p>
        </div>

        {selectedPresets.length > 0 && (
          <button
            onClick={() => setCompareMode(true)}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-700 font-medium text-sm"
          >
            Compare ({selectedPresets.length})
          </button>
        )}
      </div>

      {/* Presets Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {presets.map((preset) => (
          <PresetCard
            key={preset.id}
            preset={preset}
            isExpanded={expandedPreset === preset.id}
            isSelected={selectedPresetId === preset.id}
            onSelect={() => handleSelectPreset(preset)}
            onCompareToggle={() => handleCompareToggle(preset.id)}
            isComparing={selectedPresets.includes(preset.id)}
          />
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-4 mt-8">
        <StatCard
          title="Family Vault"
          description="Best for joint family assets"
          stats={[
            '3 Guardians',
            '2-of-3 Approval',
            '25 min setup'
          ]}
        />
        <StatCard
          title="DAO Governance"
          description="Best for communities"
          stats={[
            '7 Guardians',
            '5-of-7 Approval',
            '45 min setup'
          ]}
        />
        <StatCard
          title="Team Vault"
          description="Best for business treasury"
          stats={[
            '3 Guardians',
            '2-of-3 Approval',
            '30 min setup'
          ]}
        />
      </div>
    </div>
  );
};

/**
 * Preset Card Component
 */
interface PresetCardProps {
  preset: VaultPresetConfig;
  isExpanded: boolean;
  isSelected: boolean;
  isComparing: boolean;
  onSelect: () => void;
  onCompareToggle: () => void;
}

const PresetCard: React.FC<PresetCardProps> = ({
  preset,
  isExpanded,
  isSelected,
  isComparing,
  onSelect,
  onCompareToggle
}) => {
  const riskColors: Record<string, string> = {
    low: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200',
    medium: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200',
    high: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    family: <Users className="w-6 h-6" />,
    dao: <Zap className="w-6 h-6" />,
    team: <Shield className="w-6 h-6" />
  };

  return (
    <div
      className={`border-2 rounded-lg transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
          : 'border-gray-200 dark:border-gray-700'
      } hover:shadow-lg dark:hover:shadow-lg/20`}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-blue-600 dark:text-blue-400">{categoryIcons[preset.category]}</div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">{preset.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-500">{preset.useCase}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{preset.description}</p>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4 text-center text-sm">
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{preset.guardianCount}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Guardians</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {preset.approvalThreshold}/{preset.guardianCount}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Approval</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{preset.setupTime}m</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Setup</p>
          </div>
        </div>

        {/* Risk Level Badge */}
        <div className="mb-4">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
              riskColors[preset.riskLevel]
            }`}
          >
            {preset.riskLevel.charAt(0).toUpperCase() + preset.riskLevel.slice(1)} Risk
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onSelect}
            className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
              isSelected
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {isSelected ? '✓ Selected' : 'Select'}
          </button>
          <button
            onClick={onCompareToggle}
            className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
              isComparing
                ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title="Add to comparison"
          >
            {isComparing ? '✓' : '+'}
          </button>
        </div>

        {/* Expandable Details */}
        {isExpanded && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
            {/* Features */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Key Features</h4>
              <ul className="grid grid-cols-2 gap-2">
                {preset.features.slice(0, 6).map((feature, i) => (
                  <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {preset.features.length > 6 && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  +{preset.features.length - 6} more features
                </p>
              )}
            </div>

            {/* Limits */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Transaction Limits</h4>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p>Daily Limit: ${preset.maxDailyLimit.toLocaleString()}</p>
                <p>Per Transaction: ${preset.maxTransactionLimit.toLocaleString()}</p>
              </div>
            </div>

            {/* Best Practices */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Best Practices</h4>
              <ul className="space-y-1">
                {preset.bestPractices.slice(0, 3).map((practice, i) => (
                  <li key={i} className="text-sm text-gray-600 dark:text-gray-400">
                    • {practice}
                  </li>
                ))}
              </ul>
              {preset.bestPractices.length > 3 && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  +{preset.bestPractices.length - 3} more recommendations
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Stat Card Component
 */
interface StatCardProps {
  title: string;
  description: string;
  stats: string[];
}

const StatCard: React.FC<StatCardProps> = ({ title, description, stats }) => {
  return (
    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <h3 className="font-bold text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{description}</p>
      <ul className="space-y-1">
        {stats.map((stat, i) => (
          <li key={i} className="text-sm font-medium text-gray-700 dark:text-gray-300">
            ✓ {stat}
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * Preset Comparison View
 */
interface ComparisonViewProps {
  presetIds: string[];
  onBack: () => void;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({ presetIds, onBack }) => {
  const presets = presetIds
    .map((id) => VaultPresetsService.getPresetById(id))
    .filter((p) => p !== undefined) as VaultPresetConfig[];

  if (presets.length === 0) return null;

  return (
    <div className="w-full space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
      >
        <ChevronDown className="w-4 h-4 transform rotate-90" />
        Back to Presets
      </button>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-300 dark:border-gray-700">
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-white">Feature</th>
              {presets.map((preset) => (
                <th key={preset.id} className="text-left p-3 font-semibold text-gray-900 dark:text-white">
                  {preset.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { label: 'Guardians', key: 'guardianCount' },
              { label: 'Approval Threshold', key: 'approvalThreshold' },
              { label: 'Setup Time', key: 'setupTime', format: (v: number) => `${v}m` },
              { label: 'Daily Limit', key: 'maxDailyLimit', format: (v: number) => `$${v.toLocaleString()}` },
              { label: 'Transaction Limit', key: 'maxTransactionLimit', format: (v: number) => `$${v.toLocaleString()}` },
              { label: 'Risk Level', key: 'riskLevel' }
            ].map((row, i) => (
              <tr key={i} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="p-3 font-medium text-gray-900 dark:text-white">{row.label}</td>
                {presets.map((preset) => (
                  <td key={preset.id} className="p-3 text-gray-600 dark:text-gray-400">
                    {row.format ? row.format((preset as any)[row.key]) : (preset as any)[row.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recommendations */}
      <div className="grid md:grid-cols-3 gap-4">
        {presets.map((preset) => (
          <div
            key={preset.id}
            className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
          >
            <h3 className="font-bold text-gray-900 dark:text-white mb-3">{preset.name}</h3>
            <div className="space-y-2">
              {VaultPresetsService.getSecurityRecommendations(preset).map((rec, i) => (
                <div key={i} className="text-sm text-gray-700 dark:text-gray-300">
                  {rec}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PresetSelectorComponent;
