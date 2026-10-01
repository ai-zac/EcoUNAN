export type ThemeMode = 'light' | 'dark';


const lightColors = {
  primary: '#111827',
  primaryLight: '#1F2937',
  accent: '#22C55E',
  background: '#FFFFFF',
  surface: '#F8FAFC',
  text: '#111827',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  white: '#FFFFFF',
  transparent: 'transparent' as const,
};

const darkColors = {
  primary: '#111827',     
  primaryLight: '#1F2937',
  accent: '#22C55E',
  background: '#0B1220',
  surface: '#151E2E',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  border: '#263244',
  white: '#FFFFFF',       
  transparent: 'transparent' as const,
};

let mode: ThemeMode = 'light';

type ColorListener = (m: ThemeMode) => void;
const listeners = new Set<ColorListener>();

export const theme = {
  get colors() {
    return mode === 'dark' ? darkColors : lightColors;
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
    get h1() { return { fontSize: 32, fontWeight: 'bold' as const, color: this._active().text }; },
    get h2() { return { fontSize: 24, fontWeight: 'bold' as const, color: this._active().text }; },
    get h3() { return { fontSize: 20, fontWeight: '600' as const, color: this._active().text }; },
    get body() { return { fontSize: 16, color: this._active().text }; },
    get bodySecondary() { return { fontSize: 14, color: this._active().textSecondary }; },
    get caption() { return { fontSize: 12, color: this._active().textSecondary }; },
    _active() {
      return mode === 'dark' ? darkColors : lightColors;
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

export function getThemeMode(): ThemeMode {
  return mode;
}

export function setThemeMode(next: ThemeMode): void {
  if (mode === next) return;
  mode = next;
  listeners.forEach(l => l(mode));
}

export function subscribeTheme(listener: ColorListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export type Theme = typeof theme;
