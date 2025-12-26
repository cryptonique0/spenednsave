/**
 * URL and routing utilities
 */

/**
 * Get profile URL for address
 */
export function getProfileUrl(address: string): string {
  return `/profile/${address}`;
}

/**
 * Get edit profile URL
 */
export function getEditUrl(): string {
  return '/edit';
}

/**
 * Get explore URL with optional filters
 */
export function getExploreUrl(filters?: {
  search?: string;
  category?: string;
  sort?: string;
}): string {
  const params = new URLSearchParams();
  if (filters?.search) params.set('search', filters.search);
  if (filters?.category) params.set('category', filters.category);
  if (filters?.sort) params.set('sort', filters.sort);
  
  const query = params.toString();
  return query ? `/explore?${query}` : '/explore';
}

/**
 * Get leaderboard URL
 */
export function getLeaderboardUrl(): string {
  return '/leaderboard';
}

/**
 * Get settings URL with optional tab
 */
export function getSettingsUrl(tab?: string): string {
  return tab ? `/settings?tab=${tab}` : '/settings';
}

/**
 * Check if URL is external
 */
export function isExternalUrl(url: string): boolean {
  try {
    const urlObj = new URL(url, window.location.origin);
    return urlObj.origin !== window.location.origin;
  } catch {
    return false;
  }
}

/**
 * Get IPFS URL from hash
 */
export function getIpfsUrl(hash: string, gateway: string = 'https://ipfs.io'): string {
  // Remove ipfs:// prefix if present
  const cleanHash = hash.replace(/^ipfs:\/\//, '');
  return `${gateway}/ipfs/${cleanHash}`;
}

/**
 * Get API route URL
 */
export function getApiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL || '';
  return `${base}/api${path}`;
}

/**
 * Build social media URL
 */
export function getSocialUrl(platform: string, handle: string): string {
  const urls: Record<string, string> = {
    twitter: `https://twitter.com/${handle}`,
    github: `https://github.com/${handle}`,
    linkedin: `https://linkedin.com/in/${handle}`,
    discord: `https://discord.com/users/${handle}`,
    telegram: `https://t.me/${handle}`,
  };
  return urls[platform.toLowerCase()] || '#';
}

/**
 * Parse query parameters from URL
 */
export function parseQueryParams(search: string): Record<string, string> {
  const params = new URLSearchParams(search);
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

/**
 * Update query parameter in URL
 */
export function updateQueryParam(
  search: string,
  key: string,
  value: string | null
): string {
  const params = new URLSearchParams(search);
  if (value === null) {
    params.delete(key);
  } else {
    params.set(key, value);
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}
