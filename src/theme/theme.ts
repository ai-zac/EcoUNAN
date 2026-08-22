export const theme = {
  colors: {
    primary: '#111827',     // Dark navy for text, buttons
    primaryLight: '#1F2937',
    accent: '#22C55E',      // Green for icons, active states
    background: '#FFFFFF',  // App background
    surface: '#F8FAFC',     // Light grey for cards
    text: '#111827',        // Main text
    textSecondary: '#64748B', // Subtitles, inactive tabs
    border: '#E2E8F0',
    white: '#FFFFFF',
    transparent: 'transparent',
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    s: 12,
    m: 16,
    l: 24,
    xl: 32,
    round: 9999,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#111827',
    },
    h2: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#111827',
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      color: '#111827',
    },
    body: {
      fontSize: 16,
      color: '#111827',
    },
    bodySecondary: {
      fontSize: 14,
      color: '#64748B',
    },
    caption: {
      fontSize: 12,
      color: '#64748B',
    },
  },
  shadows: {
    soft: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.04,
      shadowRadius: 16,
      elevation: 4,
    },
    medium: {
      shadowColor: '#111827',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.06,
      shadowRadius: 24,
      elevation: 8,
    },
    heavy: {
      shadowColor: '#111827',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.1,
      shadowRadius: 35,
      elevation: 12,
    },
  },
} as const;

export type Theme = typeof theme;
