/**
 * Stage Background Imagery & Visual Assets
 * Provides rich visual artwork, photography, and stylized backdrops for fight locations.
 */

export interface StageVisualAsset {
  stageId: string;
  imageUrl: string;
  thumbnailUrl: string;
  altText: string;
  panoramicRatio: string;
  lightingAura: string;
  keyVisualMotif: string;
  ambientParticles: 'stars' | 'solar_dust' | 'geom_sparkles' | 'fireflies' | 'diyas' | 'rain' | 'sparks';
}

export const STAGE_VISUAL_ASSETS: Record<string, StageVisualAsset> = {
  stage_metro_rain: {
    stageId: 'stage_metro_rain',
    imageUrl: '/stages/png/stage_metro_rain.png',
    thumbnailUrl: '/stages/png/stage_metro_rain.png',
    altText: 'Metro Rain stage with wet neon rooftops and storm-lit city depth',
    panoramicRatio: '16/9',
    lightingAura: 'rgba(34, 211, 238, 0.35)',
    keyVisualMotif: 'Rainy Metro Skyline',
    ambientParticles: 'rain',
  },
  stage_riverfront_sunset: {
    stageId: 'stage_riverfront_sunset',
    imageUrl: '/stages/png/stage_riverfront_sunset.png',
    thumbnailUrl: '/stages/png/stage_riverfront_sunset.png',
    altText: 'Riverfront sunset stage with glowing water and distant architecture',
    panoramicRatio: '16/9',
    lightingAura: 'rgba(251, 146, 60, 0.4)',
    keyVisualMotif: 'Riverfront Sunset',
    ambientParticles: 'solar_dust',
  },
  stage_sky_observatory: {
    stageId: 'stage_sky_observatory',
    imageUrl: '/stages/png/stage_sky_observatory.png',
    thumbnailUrl: '/stages/png/stage_sky_observatory.png',
    altText: 'Sky observatory stage above the clouds with celestial instruments',
    panoramicRatio: '16/9',
    lightingAura: 'rgba(129, 140, 248, 0.4)',
    keyVisualMotif: 'Cloud Observatory',
    ambientParticles: 'stars',
  },
  stage_bioluminescent_ruins: {
    stageId: 'stage_bioluminescent_ruins',
    imageUrl: '/stages/png/stage_bioluminescent_ruins.png',
    thumbnailUrl: '/stages/png/stage_bioluminescent_ruins.png',
    altText: 'Bioluminescent ruins stage with luminous vegetation and ancient stone',
    panoramicRatio: '16/9',
    lightingAura: 'rgba(45, 212, 191, 0.4)',
    keyVisualMotif: 'Luminous Ancient Ruins',
    ambientParticles: 'fireflies',
  },
  // 1. Antariksha: Cosmic Brahmanda (Space) - .jpeg
  stage_antariksha_space: {
    stageId: 'stage_antariksha_space',
    imageUrl: '/stages/stage_antariksha_space.jpeg',
    thumbnailUrl: '/stages/stage_antariksha_space.jpeg',
    altText: 'Antariksha Cosmic Brahmanda - Swirling violet galaxy, glowing star clusters, and Vedic celestial void',
    panoramicRatio: '16/9',
    lightingAura: 'rgba(129, 140, 248, 0.4)',
    keyVisualMotif: 'Navagraha Orbits & Astral Nebula',
    ambientParticles: 'stars',
  },

  // 2. Kala Chakra: Sun Temple of Time (Time) - .jpeg
  stage_kala_chakra_time: {
    stageId: 'stage_kala_chakra_time',
    imageUrl: '/stages/stage_kala_chakra_time.jpeg',
    thumbnailUrl: '/stages/stage_kala_chakra_time.jpeg',
    altText: 'Kala Chakra Sun Temple of Time - Carved Konark Surya chariot wheels in warm golden sandstone',
    panoramicRatio: '16/9',
    lightingAura: 'rgba(245, 158, 11, 0.45)',
    keyVisualMotif: '24-Spoke Surya Time Chariot Wheel',
    ambientParticles: 'solar_dust',
  },

  // 3. Jantar Mantar: Celestial Geometry (Space Observatory) - .jpeg
  stage_jantar_mantar_space: {
    stageId: 'stage_jantar_mantar_space',
    imageUrl: '/stages/stage_jantar_mantar_space.jpeg',
    thumbnailUrl: '/stages/stage_jantar_mantar_space.jpeg',
    altText: 'Jantar Mantar Celestial Geometry - Monumental red sandstone geometric astronomical staircases under twilight',
    panoramicRatio: '16/9',
    lightingAura: 'rgba(244, 63, 94, 0.4)',
    keyVisualMotif: 'Samrat Yantra Astronomical Stairs',
    ambientParticles: 'geom_sparkles',
  },

  // 4. Dandakaranya: Sacred Tapovan Forest (Forest) - .jpeg
  stage_dandakaranya_forest: {
    stageId: 'stage_dandakaranya_forest',
    imageUrl: '/stages/stage_dandakaranya_forest.jpeg',
    thumbnailUrl: '/stages/stage_dandakaranya_forest.jpeg',
    altText: 'Dandakaranya Sacred Tapovan Forest - Colossal Banyan tree roots, ancient forest mist, and golden fireflies',
    panoramicRatio: '16/9',
    lightingAura: 'rgba(16, 185, 129, 0.4)',
    keyVisualMotif: 'Sacred Vata Vriksha Banyan & Fireflies',
    ambientParticles: 'fireflies',
  },

  // 5. Maha Kumbh: Twilight Ghats Gathering (Gathering) - .jpeg
  stage_kumbh_sangam_gathering: {
    stageId: 'stage_kumbh_sangam_gathering',
    imageUrl: '/stages/stage_kumbh_sangam_gathering.jpeg',
    thumbnailUrl: '/stages/stage_kumbh_sangam_gathering.jpeg',
    altText: 'Maha Kumbh Twilight Ghats Gathering - River ghat stone steps with hundreds of floating golden diyas and aarti flames',
    panoramicRatio: '16/9',
    lightingAura: 'rgba(249, 115, 22, 0.45)',
    keyVisualMotif: 'Ganga Ghat Steps & Floating Diyas',
    ambientParticles: 'diyas',
  },

  // 6. Street Fighter 6 Grand Championship Arena - .jpg
  stage_hegemony_arena: {
    stageId: 'stage_hegemony_arena',
    imageUrl: '/stages/stage_street_fighter_arena.jpg',
    thumbnailUrl: '/stages/stage_street_fighter_arena.jpg',
    altText: 'Street Fighter 6 Grand Arena - High-tech championship colosseum with moving neon spotlights',
    panoramicRatio: '16/9',
    lightingAura: 'rgba(245, 158, 11, 0.35)',
    keyVisualMotif: 'Championship Spotlights & Crowd Barriers',
    ambientParticles: 'sparks',
  },

  // 7. Animated Cheering Crowd Stadium - .gif
  stage_cheering_crowd_animated: {
    stageId: 'stage_cheering_crowd_animated',
    imageUrl: '/stages/stage_cheering_crowd_animated.gif',
    thumbnailUrl: '/stages/stage_cheering_crowd_animated.gif',
    altText: 'Animated Street Fighter 6 Cheering Crowd - Moving human spectators, pulsing tournament banners and arena spotlights',
    panoramicRatio: '16/9',
    lightingAura: 'rgba(239, 68, 68, 0.45)',
    keyVisualMotif: 'Animated Cheering Spectators & Moving Lights',
    ambientParticles: 'sparks',
  },

  // 8. Sun Temple Sandstone Colosseum - .png
  stage_sun_temple_arena: {
    stageId: 'stage_sun_temple_arena',
    imageUrl: '/stages/stage_sun_temple_arena.png',
    thumbnailUrl: '/stages/stage_sun_temple_arena.png',
    altText: 'Sun Temple Sandstone Colosseum - Crisp textured arena pillars with Surya carvings',
    panoramicRatio: '16/9',
    lightingAura: 'rgba(245, 158, 11, 0.4)',
    keyVisualMotif: 'Sandstone Pillars & Sun Disc',
    ambientParticles: 'solar_dust',
  },

  // 9. Ancient Battleground Arena - .png
  stage_ancient_battleground: {
    stageId: 'stage_ancient_battleground',
    imageUrl: '/stages/stage_ancient_battleground.png',
    thumbnailUrl: '/stages/stage_ancient_battleground.png',
    altText: 'Ancient Battleground Arena - Historic stone tournament arena under stadium lighting',
    panoramicRatio: '16/9',
    lightingAura: 'rgba(217, 119, 6, 0.4)',
    keyVisualMotif: 'Stone Arena & Tournament Pennants',
    ambientParticles: 'sparks',
  },

  // 10. Metro City Rooftop Skyline - .png
  stage_spire_apex: {
    stageId: 'stage_spire_apex',
    imageUrl: '/stages/stage_metro_city_rooftop.png',
    thumbnailUrl: '/stages/stage_metro_city_rooftop.png',
    altText: 'Metro City Rooftop Skyline - Skyscraper penthouse arena above city clouds',
    panoramicRatio: '16/9',
    lightingAura: 'rgba(217, 119, 6, 0.35)',
    keyVisualMotif: 'Cloudline Penthouse & Luxury Glass',
    ambientParticles: 'solar_dust',
  },

  // 11. Sector 7 Quarantine Outskirts - .jpeg
  stage_sector7_quarantine: {
    stageId: 'stage_sector7_quarantine',
    imageUrl: '/stages/stage_sector7_quarantine.jpeg',
    thumbnailUrl: '/stages/stage_sector7_quarantine.jpeg',
    altText: 'Sector 7 Quarantine Outskirts - Rainy dystopian cyber industrial camp',
    panoramicRatio: '16/9',
    lightingAura: 'rgba(6, 182, 212, 0.3)',
    keyVisualMotif: 'Bio-hazard Mist & Industrial Cranes',
    ambientParticles: 'rain',
  },

  // 12. Aether Core Server Vault - .jpeg
  stage_aether_server_vault: {
    stageId: 'stage_aether_server_vault',
    imageUrl: '/stages/stage_aether_server_vault.jpeg',
    thumbnailUrl: '/stages/stage_aether_server_vault.jpeg',
    altText: 'Aether Core Server Vault - Glowing server mainframe with cyan laser routing',
    panoramicRatio: '16/9',
    lightingAura: 'rgba(99, 102, 241, 0.35)',
    keyVisualMotif: 'Quantum Data Relays & Laser Grids',
    ambientParticles: 'geom_sparkles',
  },

  // 13. Subway Slums - .jpeg
  stage_subway_slums: {
    stageId: 'stage_subway_slums',
    imageUrl: '/stages/stage_subway_slums.jpeg',
    thumbnailUrl: '/stages/stage_subway_slums.jpeg',
    altText: 'Sector 3 Underground Slums - Neon-lit subterranean resistance bunker',
    panoramicRatio: '16/9',
    lightingAura: 'rgba(217, 119, 6, 0.3)',
    keyVisualMotif: 'Subterranean Rails & Neon Graffiti',
    ambientParticles: 'sparks',
  },

  // Location 1 to Location 5 User Presets (.jpeg, .gif, .png)
  location1: {
    stageId: 'location1',
    imageUrl: '/stages/stage_kala_chakra_time.jpeg',
    thumbnailUrl: '/stages/stage_kala_chakra_time.jpeg',
    altText: 'Location 1: Kala Chakra - Floating Surya time dial wheel and sandstone fort palace (.jpeg)',
    panoramicRatio: '16/9',
    lightingAura: 'rgba(245, 158, 11, 0.45)',
    keyVisualMotif: 'Floating Surya Time Dial & Sandstone Palace',
    ambientParticles: 'solar_dust',
  },
  location2: {
    stageId: 'location2',
    imageUrl: '/stages/stage_jantar_mantar_space.jpeg',
    thumbnailUrl: '/stages/stage_jantar_mantar_space.jpeg',
    altText: 'Location 2: Jantar Mantar - Sacred colossal Banyan tree and celestial stone ramp observatory (.jpeg)',
    panoramicRatio: '16/9',
    lightingAura: 'rgba(244, 63, 94, 0.4)',
    keyVisualMotif: 'Sacred Banyan & Celestial Stone Observatory',
    ambientParticles: 'geom_sparkles',
  },
  location3: {
    stageId: 'location3',
    imageUrl: '/stages/stage_antariksha_space.jpeg',
    thumbnailUrl: '/stages/stage_antariksha_space.jpeg',
    altText: 'Location 3: Antariksha Cave - Sacred subterranean rock-cut cave temple and cosmic galaxy (.jpeg)',
    panoramicRatio: '16/9',
    lightingAura: 'rgba(129, 140, 248, 0.45)',
    keyVisualMotif: 'Subterranean Deity Throne & Swirling Galaxy',
    ambientParticles: 'stars',
  },
  location4: {
    stageId: 'location4',
    imageUrl: '/stages/stage_cheering_crowd_animated.gif',
    thumbnailUrl: '/stages/stage_cheering_crowd_animated.gif',
    altText: 'Location 4: Cheering Arena - Moving human crowd celebrating and animated tournament spotlights (.gif)',
    panoramicRatio: '16/9',
    lightingAura: 'rgba(239, 68, 68, 0.45)',
    keyVisualMotif: 'Moving Cheering Human Spectators & Animated Banners',
    ambientParticles: 'sparks',
  },
  location5: {
    stageId: 'location5',
    imageUrl: '/stages/stage_dandakaranya_forest.jpeg',
    thumbnailUrl: '/stages/stage_dandakaranya_forest.jpeg',
    altText: 'Location 5: Tapovan Jyoti - Bioluminescent sacred forest with glowing trees (.jpeg)',
    panoramicRatio: '16/9',
    lightingAura: 'rgba(16, 185, 129, 0.45)',
    keyVisualMotif: 'Glowing Constellation Trees & Moon Monoliths',
    ambientParticles: 'fireflies',
  },
};

const AVAILABLE_LOCAL_STAGE_IDS = new Set([
  'stage_metro_rain',
  'stage_riverfront_sunset',
  'stage_sky_observatory',
  'stage_bioluminescent_ruins',
]);
const AVAILABLE_STAGE_FALLBACK = '/stages/png/stage_metro_rain.png';

export interface LocationPreset {
  id: string;
  name: string;
  subtitle: string;
  stageId: string;
  description: string;
  imageUrl: string;
  thumbnailUrl: string;
  accentColor: string;
}

export const LOCATION_PRESETS: LocationPreset[] = [
  {
    id: 'location1',
    name: 'Location 1: Kala Chakra (.jpeg)',
    subtitle: 'Floating Surya Time Dial & Sandstone Fort',
    stageId: 'stage_kala_chakra_time',
    description: 'Ancient Vedic sandstone palace with gathering crowds watching a colossal glowing Surya time-dial wheel levitating with temple spires.',
    imageUrl: '/stages/stage_kala_chakra_time.jpeg',
    thumbnailUrl: '/stages/stage_kala_chakra_time.jpeg',
    accentColor: '#f59e0b',
  },
  {
    id: 'location2',
    name: 'Location 2: Jantar Mantar (.jpeg)',
    subtitle: 'Sacred Banyan & Celestial Stone Observatory',
    stageId: 'stage_jantar_mantar_space',
    description: 'Gigantic sacred Banyan tree intertwined with astronomical stone meridian ramps, surrounded by meditating monks under star skies.',
    imageUrl: '/stages/stage_jantar_mantar_space.jpeg',
    thumbnailUrl: '/stages/stage_jantar_mantar_space.jpeg',
    accentColor: '#f43f5e',
  },
  {
    id: 'location3',
    name: 'Location 3: Antariksha Space (.jpeg)',
    subtitle: 'Sacred Cosmic Cave Temple of the Deities',
    stageId: 'stage_antariksha_space',
    description: 'Subterranean rock-cut temple with an enthroned carved deity beneath an open rock ceiling looking out into a swirling celestial galaxy.',
    imageUrl: '/stages/stage_antariksha_space.jpeg',
    thumbnailUrl: '/stages/stage_antariksha_space.jpeg',
    accentColor: '#818cf8',
  },
  {
    id: 'location4',
    name: 'Location 4: Cheering Arena (.gif)',
    subtitle: 'Animated Cheering Human Crowd & Moving Spotlights',
    stageId: 'stage_cheering_crowd_animated',
    description: 'Animated moving background (.gif) featuring cheering human spectators, moving tournament spotlights, and lively stadium atmosphere.',
    imageUrl: '/stages/stage_cheering_crowd_animated.gif',
    thumbnailUrl: '/stages/stage_cheering_crowd_animated.gif',
    accentColor: '#ef4444',
  },
  {
    id: 'location5',
    name: 'Location 5: Tapovan Forest (.jpeg)',
    subtitle: 'Bioluminescent Sacred Forest & Moon Monoliths',
    stageId: 'stage_dandakaranya_forest',
    description: 'Enchanted nocturnal rainforest with glowing constellation trees, luminous cyan flora, carved moon pillars, and drifting fireflies.',
    imageUrl: '/stages/stage_dandakaranya_forest.jpeg',
    thumbnailUrl: '/stages/stage_dandakaranya_forest.jpeg',
    accentColor: '#10b981',
  },
  {
    id: 'location6',
    name: 'Location 6: Sun Temple Arena (.png)',
    subtitle: 'High-Res Textured Ancient Colosseum',
    stageId: 'stage_sun_temple_arena',
    description: 'Crisp PNG format background featuring weathered sandstone arena pillars and Surya carvings under golden sunlight.',
    imageUrl: '/stages/stage_sun_temple_arena.png',
    thumbnailUrl: '/stages/stage_sun_temple_arena.png',
    accentColor: '#d97706',
  },
  {
    id: 'location7',
    name: 'Location 7: Metro Rooftop (.png)',
    subtitle: 'Metro City Skyline Penthouse Arena',
    stageId: 'stage_spire_apex',
    description: 'Crisp PNG format background featuring skyscraper rooftops, illuminated skyscrapers, and cloudline horizons.',
    imageUrl: '/stages/stage_metro_city_rooftop.png',
    thumbnailUrl: '/stages/stage_metro_city_rooftop.png',
    accentColor: '#3b82f6',
  },
];

/**
 * Helper to retrieve stage background visual with fallback
 */
export function getStageVisual(stageId?: string, customBgUrl?: string): StageVisualAsset {
  if (customBgUrl) {
    return {
      stageId: stageId || 'custom',
      imageUrl: customBgUrl,
      thumbnailUrl: customBgUrl,
      altText: 'Custom Arena Background Location',
      panoramicRatio: '16/9',
      lightingAura: 'rgba(245, 158, 11, 0.4)',
      keyVisualMotif: 'Custom Location Background',
      ambientParticles: 'stars',
    };
  }
  if (stageId && STAGE_VISUAL_ASSETS[stageId]) {
    const visual = STAGE_VISUAL_ASSETS[stageId];
    if (AVAILABLE_LOCAL_STAGE_IDS.has(stageId)) return visual;
    return {
      ...visual,
      imageUrl: AVAILABLE_STAGE_FALLBACK,
      thumbnailUrl: AVAILABLE_STAGE_FALLBACK,
    };
  }
  return STAGE_VISUAL_ASSETS.stage_metro_rain;
}
