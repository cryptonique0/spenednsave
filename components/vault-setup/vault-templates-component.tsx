'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronRight,
  Star,
  Clock,
  Users,
  Shield,
  Zap,
  ChevronDown,
  Copy,
  ExternalLink,
  Filter,
  Grid,
  List,
  ArrowRight,
} from 'lucide-react';
import {
  VaultTemplate,
  VaultTemplatesService,
} from '@/lib/services/vault/vault-templates-service';

interface VaultTemplatesComponentProps {
  onSelectTemplate?: (template: VaultTemplate) => void;
  viewMode?: 'gallery' | 'list' | 'compare';
  maxDisplayCount?: number;
  showFeatured?: boolean;
}

export function VaultTemplatesComponent({
  onSelectTemplate,
  viewMode: initialViewMode = 'gallery',
  maxDisplayCount = 12,
  showFeatured = true,
}: VaultTemplatesComponentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'gallery' | 'list' | 'compare'>(initialViewMode);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [selectedTemplates, setSelectedTemplates] = useState<VaultTemplate[]>([]);

  const allTemplates = VaultTemplatesService.getAllTemplates();
  const categories = VaultTemplatesService.getCategories();

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let results = allTemplates;

    // Search filter
    if (searchQuery) {
      results = VaultTemplatesService.searchTemplates(searchQuery);
    }

    // Category filter
    if (selectedCategory) {
      results = results.filter((t) => t.category === selectedCategory);
    }

    // Difficulty filter
    if (selectedDifficulty) {
      results = results.filter((t) => t.difficulty === selectedDifficulty);
    }

    return results.slice(0, maxDisplayCount);
  }, [searchQuery, selectedCategory, selectedDifficulty, maxDisplayCount]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      personal: 'bg-blue-50 border-blue-200',
      family: 'bg-purple-50 border-purple-200',
      business: 'bg-green-50 border-green-200',
      nonprofit: 'bg-red-50 border-red-200',
      dao: 'bg-yellow-50 border-yellow-200',
      custom: 'bg-gray-50 border-gray-200',
    };
    return colorMap[category] || colorMap.custom;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Vault Templates</h2>
        <p className="text-gray-600">Choose a pre-built template to get started quickly</p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filter and View Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                  selectedCategory === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Filter */}
          <div className="flex gap-2">
            {['beginner', 'intermediate', 'advanced'].map((diff) => (
              <button
                key={diff}
                onClick={() =>
                  setSelectedDifficulty(selectedDifficulty === diff ? null : diff)
                }
                className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                  selectedDifficulty === diff
                    ? getDifficultyColor(diff)
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {diff.charAt(0).toUpperCase() + diff.slice(1)}
              </button>
            ))}
          </div>

          {/* View Mode */}
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setViewMode('gallery')}
              className={`p-2 rounded ${
                viewMode === 'gallery'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${
                viewMode === 'list'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results Count */}
        <p className="text-sm text-gray-600">
          {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Featured Templates */}
      {showFeatured && filteredTemplates.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Featured</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates
              .filter((t) => t.category !== 'custom')
              .slice(0, 2)
              .map((template) => (
                <div
                  key={template.id}
                  className={`relative p-6 rounded-xl border-2 ${getCategoryColor(template.category)} overflow-hidden group cursor-pointer hover:shadow-lg transition`}
                  onClick={() => onSelectTemplate?.(template)}
                >
                  {/* Gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent pointer-events-none" />

                  <div className="relative space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-4xl mb-2">{template.icon}</div>
                        <h3 className="text-xl font-bold text-gray-900">{template.name}</h3>
                      </div>
                      <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    </div>

                    <p className="text-gray-700">{template.description}</p>

                    <div className="flex items-center gap-4 pt-2">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{template.estimatedSetupTime}min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {template.guardians.requiredCount} guardians
                        </span>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(
                          template.difficulty
                        )}`}
                      >
                        {template.difficulty}
                      </span>
                    </div>

                    <div className="pt-2 flex items-center gap-2 text-blue-600 font-medium group-hover:gap-3 transition">
                      Get Started <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Templates Grid */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          {selectedCategory ? `${selectedCategory} Templates` : 'All Templates'}
        </h3>

        {viewMode === 'gallery' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className={`p-5 rounded-lg border ${getCategoryColor(template.category)} hover:shadow-md transition cursor-pointer`}
                onClick={() => {
                  if (expandedTemplate !== template.id) {
                    setExpandedTemplate(template.id);
                  }
                  onSelectTemplate?.(template);
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl">{template.icon}</div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(
                    template.difficulty
                  )}`}>
                    {template.difficulty}
                  </span>
                </div>

                <h3 className="font-bold text-gray-900 mb-1">{template.name}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {template.description}
                </p>

                <div className="space-y-2 mb-3 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {template.estimatedSetupTime}min setup
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {template.guardians.requiredCount} guardians
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className={`w-4 h-4 ${getRiskColor(template.riskLevel)}`} />
                    {template.riskLevel} risk
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedTemplate(expandedTemplate === template.id ? null : template.id);
                  }}
                  className="w-full px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition flex items-center justify-between"
                >
                  Details
                  <ChevronDown
                    className={`w-4 h-4 transition ${
                      expandedTemplate === template.id ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Expanded Details */}
                {expandedTemplate === template.id && (
                  <div className="mt-3 pt-3 border-t border-current border-opacity-20 space-y-2 text-sm text-gray-700">
                    <div>
                      <p className="font-medium text-gray-900">Use Case</p>
                      <p>{template.useCase}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Key Features</p>
                      <ul className="list-disc list-inside space-y-1">
                        {template.features.slice(0, 3).map((f, i) => (
                          <li key={i} className="text-xs">
                            {f}
                          </li>
                        ))}
                        {template.features.length > 3 && (
                          <li className="text-xs">+{template.features.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-2">
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  onSelectTemplate?.(template);
                  setExpandedTemplate(expandedTemplate === template.id ? null : template.id);
                }}
                className="w-full p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-2xl">{template.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-600">{template.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      {template.estimatedSetupTime}min
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      {template.guardians.requiredCount}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(
                      template.difficulty
                    )}`}>
                      {template.difficulty}
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>

                {expandedTemplate === template.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                    <div>
                      <p className="font-medium text-gray-900 text-sm mb-1">Description</p>
                      <p className="text-gray-700 text-sm">{template.useCase}</p>
                    </div>

                    <div>
                      <p className="font-medium text-gray-900 text-sm mb-2">Key Features</p>
                      <div className="grid grid-cols-2 gap-2">
                        {template.features.slice(0, 4).map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                            <Zap className="w-3 h-3 text-yellow-500" />
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>

                    {template.limits && (
                      <div>
                        <p className="font-medium text-gray-900 text-sm mb-2">Limits</p>
                        <div className="space-y-1 text-sm text-gray-700">
                          {template.limits.maxDaily && (
                            <p>Daily Limit: ${template.limits.maxDaily.toLocaleString()}</p>
                          )}
                          {template.limits.maxTransaction && (
                            <p>
                              Transaction Limit: $
                              {template.limits.maxTransaction.toLocaleString()}
                            </p>
                          )}
                          {template.limits.maxGuardians && (
                            <p>Max Guardians: {template.limits.maxGuardians}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* No Results */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-1">No templates found</p>
          <p className="text-gray-500 text-sm">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  );
}
