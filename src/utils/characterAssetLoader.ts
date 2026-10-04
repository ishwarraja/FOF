/**
 * Character Asset Resolution & Dynamic Cache-Busting Loader
 * 
 * Standardized Directory Structure:
 * public/assets/characters/[character_id]/
 *   ├── portrait.jpeg / portrait.png     (Used for Character Select & Top Combat HUD Lifebars)
 *   ├── icon.jpeg / icon.png             (Square mini-icon for roster picker)
 *   └── spritesheet.jpeg / spritesheet.png (Action frames / PaperZD texture atlas)
 * 
 * Legacy / Direct Directory Structure (supported as fallback):
 * public/characters/[character_id].jpg
 * public/characters/General_Jonas_Steele_01.jpeg
 * public/characters/Meghananda_01.jpeg
 */

// Bump version or timestamp to instantly bust browser cache for new uploads
export const ASSET_VERSION = '2026.09.18.1';

// Direct file mappings for known custom character images in public/characters/
const KNOWN_DIRECT_CHARACTER_FILES: Record<string, { portrait: string; icon?: string; spritesheet?: string }> = {
  arjun: {
    portrait: '/characters/arjun.jpg',
    icon: '/characters/arjun.jpg',
    spritesheet: '/assets/characters/arjun/fighter_cutout.png',
  },
  steele: {
    portrait: '/assets/characters/steele/fighter_cutout.png',
    icon: '/assets/characters/steele/fighter_cutout.png',
    spritesheet: '/assets/characters/steele/fighter_cutout.png',
  },
  meghananda: {
    portrait: '/characters/Meghananda_01.jpeg',
    icon: '/characters/Meghananda_02.jpeg',
    spritesheet: '/characters/Meghananda_01.jpeg',
  },
};

/**
 * Normalizes character ID to handle variations (e.g. 'General Jonas Steele' -> 'steele')
 */
export function normalizeCharacterId(idOrName?: string): string {
  if (!idOrName) return 'arjun';
  const lower = idOrName.toLowerCase().trim();
  if (lower.includes('steele') || lower.includes('jonas')) return 'steele';
  if (lower.includes('meghananda') || lower.includes('indrajit')) return 'meghananda';
  if (lower.includes('arjun') || lower.includes('rao')) return 'arjun';
  if (lower.includes('elena')) return 'elena';
  if (lower.includes('david')) return 'david';
  if (lower.includes('maya')) return 'maya';
  if (lower.includes('leo')) return 'leo';
  if (lower.includes('rafe')) return 'rafe';
  if (lower.includes('amara')) return 'amara';
  if (lower.includes('kai')) return 'kai';
  if (lower.includes('alexandra')) return 'alexandra';
  if (lower.includes('luna')) return 'luna';
  if (lower.includes('valeria')) return 'valeria';
  if (lower.includes('victor')) return 'victor';
  return lower.replace(/[^a-z0-9_]/g, '');
}

/**
 * Appends cache-busting query parameter to an asset path
 */
export function withCacheBust(url: string, version: string = ASSET_VERSION): string {
  if (!url) return url;
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${version}`;
}

/**
 * Resolves the absolute URL for a character asset with automatic fallback & cache busting.
 */
export function resolveCharacterAsset(
  characterId: string,
  assetType: 'portrait' | 'icon' | 'spritesheet' = 'portrait',
  customUrl?: string
): string {
  // 1. If explicit valid data URI or external URL provided, use it directly
  if (customUrl && (customUrl.startsWith('data:') || customUrl.startsWith('http'))) {
    return customUrl;
  }

  const normalizedId = normalizeCharacterId(characterId);

  // 2. Check if custom URL was provided as an explicit path
  if (customUrl && customUrl.trim().length > 0) {
    return withCacheBust(customUrl);
  }

  // 3. Known custom vector or image mappings in standardized directory
  if (normalizedId === 'valeria') {
    return withCacheBust('/characters/valeria_portrait.svg');
  }
  if (normalizedId === 'maya') {
    return withCacheBust('/assets/characters/maya/portrait.svg');
  }
  if (normalizedId === 'david') {
    return withCacheBust('/assets/characters/david/fighter_cutout.png');
  }
  if (normalizedId === 'elena') {
    return withCacheBust('/assets/characters/elena/portrait.svg');
  }

  // 4. Standardized directory: /assets/characters/[id]/[assetType].jpeg
  if (normalizedId === 'steele' || normalizedId === 'meghananda' || normalizedId === 'arjun') {
    return withCacheBust(`/assets/characters/${normalizedId}/${assetType}.jpeg`);
  }

  // 5. Check known direct file mappings
  if (KNOWN_DIRECT_CHARACTER_FILES[normalizedId]) {
    const map = KNOWN_DIRECT_CHARACTER_FILES[normalizedId];
    const target = map[assetType] || map.portrait;
    return withCacheBust(target);
  }

  // 6. Standardized pattern
  return withCacheBust(`/assets/characters/${normalizedId}/${assetType}.png`);
}
