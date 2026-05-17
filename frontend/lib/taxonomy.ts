export const FAMILY_COLORS: Record<string, string> = {
  // Early & Ancient (Browns, Grays, Teals)
  'Apostolic & Early Christianity': '#a8a29e', // Stone
  'Early Jewish Christianity': '#78716c',      // Dark Stone
  'Gnosticism & Esoteric Antiquity': '#9333ea', // Purple
  'Early Nontrinitarians & Adoptionists': '#c084fc', // Light Purple
  'Early Schisms & Strict Observance': '#0d9488', // Teal
  'Historical Dualism': '#be185d',             // Dark Pink

  // Catholic (Yellows & Golds)
  'Roman Catholicism (Latin Core)': '#eab308', // Yellow
  'Anti-Sacerdotal Primitivist': '#facc15', // Light Yellow
  'Traditionalist Catholicism': '#ca8a04',     // Dark Yellow
  'Independent & Liberal Catholicism': '#fde047', // Pale Yellow

  // Orthodox (Oranges & Ambers)
  'Eastern & Oriental Orthodoxy': '#d97706',   // Amber
  'Old Calendar & Traditionalist Orthodox': '#b45309', // Dark Amber
  'Independent Sacramental & Autocephalous': '#f59e0b', // Light Amber // DEPRECATED — members redistributed via tSNE v2.0

  // Magisterial Protestant (Blues & Indigos)
  'Pre-Reformation Dissenters': '#3b82f6',     // Blue
  'Confessional Lutheranism': '#4f46e5',       // Indigo
  'Confessional Reformed & Presbyterian': '#1d4ed8', // Dark Blue
  'Anglo-Catholic & High Church': '#6366f1',   // Light Indigo
  'Mainline & Historic Protestantism': '#60a5fa', // Sky Blue

  // Evangelical & Primitivist (Greens & Emeralds)
  'Anabaptist': '#10b981', // Emerald
  'Conservative Baptist & Calvinist': '#059669', // Dark Emerald
  'Wesleyan & Holiness Movements': '#16a34a',    // Green
  'Independent Evangelicalism': '#4ade80',       // Light Green

  // Charismatic & Restorationist (Reds & Roses)
  'Pentecostal & Charismatic': '#ef4444',        // Red
  'Oneness Pentecostalism': '#dc2626',           // Dark Red
  'Restorationist (Stone-Campbell)': '#f43f5e',  // Rose
  'Sabbatarian & Adventist Movements': '#fb923c', // Orange

  // Progressive & Alternative (Pinks, Cyans, Fuschias)
  'Progressive Christianity & Universalism': '#22d3ee', // Cyan
  'Unitarian & Hebrew Roots': '#06b6d4',             // Dark Cyan
  'Modern Restorationist Movements': '#d946ef',      // Fuchsia
  'High-Church New Movements': '#ec4899',            // Pink
};

export const GROUP_COLORS: Record<string, string> = {
  'Catholic': '#9333ea',                           // Purple
  'Orthodox & High Church': '#f59e0b',             // Gold
  'Magisterial Protestant': '#3b82f6',             // Blue
  'Esoteric & Progressive': '#0d9488',             // Teal
  'Ancient, Dualist & Restorationist': '#a16207',  // Warm Brown
  'Charismatic': '#dc2626',                        // Red
  'Evangelical & Primitivist': '#10b981',          // Emerald
} satisfies Record<typeof FAMILY_GROUPS[number]['category'], string>;

export const FAMILY_GROUPS: { category: string; families: string[] }[] = [
  {
    category: 'Catholic',
    families: [
      'Roman Catholicism (Latin Core)',
      'High-Church New Movements',
      'Traditionalist Catholicism',
    ],
  },
  {
    category: 'Orthodox & High Church',
    families: [
      'Eastern & Oriental Orthodoxy',
      'Anglo-Catholic & High Church',
      'Independent & Liberal Catholicism',
      'Old Calendar & Traditionalist Orthodox',
      'Early Schisms & Strict Observance',
    ],
  },
  {
    category: 'Magisterial Protestant',
    families: [
      'Confessional Lutheranism',
      'Confessional Reformed & Presbyterian',
      'Mainline & Historic Protestantism',
      'Wesleyan & Holiness Movements',
    ],
  },
  {
    category: 'Esoteric & Progressive',
    families: [
      'Gnosticism & Esoteric Antiquity',
      'Progressive Christianity & Universalism',
    ],
  },
  {
    category: 'Ancient, Dualist & Restorationist',
    families: [
      'Historical Dualism',
      'Early Jewish Christianity',
      'Apostolic & Early Christianity',
      'Modern Restorationist Movements',
    ],
  },
  {
    category: 'Charismatic',
    families: [
      'Oneness Pentecostalism',
      'Pentecostal & Charismatic',
    ],
  },
  {
    category: 'Evangelical & Primitivist',
    families: [
      'Sabbatarian & Adventist Movements',
      'Independent Evangelicalism',
      'Conservative Baptist & Calvinist',
      'Restorationist (Stone-Campbell)',
      'Anabaptist',
      'Anti-Sacerdotal Primitivist',
    ],
  },
];

export const FAMILY_TO_GROUP: Record<string, string> = Object.fromEntries(
  FAMILY_GROUPS.flatMap(group =>
    group.families.map(family => [family, group.category])
  )
);

// NOTE: FAMILY_METADATA removed.
// Family metadata (century, region, members, description) is now fetched live
// from the /api/families endpoint (denomination_families table).
// See CompassChart.tsx for the new useFamilyMeta() hook that fetches this data.