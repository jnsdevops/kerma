// ═══════════════════════════════════════════
// KERMA · Design System
// Brand: Pionexis · Agent: Astride
// ═══════════════════════════════════════════

export const Colors = {
  // Brand
  kerma: '#0A6B4B',
  kermaMid: '#0D8A60',
  kermaLight: '#E8F5F0',
  kermaPale: '#F2FAF6',
  gold: '#C8882A',
  goldLight: '#FDF3E3',

  // Backgrounds
  bg: '#FAFAF8',
  bg2: '#F4F3F0',
  bg3: '#ECEAE5',
  white: '#FFFFFF',

  // Borders
  border: '#E2DED7',
  border2: '#D0CBC2',

  // Text
  text: '#1A1714',
  t2: '#6B6560',
  t3: '#A8A09A',
  t4: '#C8C4BE',

  // Status
  red: '#C0392B',
  redLight: '#FDECEA',
  amber: '#D4720A',
  amberLight: '#FEF3E2',
  blue: '#1E5FAD',
  blueLight: '#EBF2FC',
  purple: '#6B3FA0',
  purpleLight: '#F3EEF9',
  green: '#22C55E',
} as const;

export const Typography = {
  // Fraunces — serif for numbers, titles, hero text
  serif: 'Fraunces_700Bold',
  serifBlack: 'Fraunces_900Black',

  // Inter — sans for body, labels, UI
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

export const Radius = {
  sm: 9,
  md: 14,
  lg: 20,
  full: 999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#1A1714',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#1A1714',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1A1714',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;
