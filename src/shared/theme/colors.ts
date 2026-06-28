export const palette = {
  green50: '#E8F5E9',
  green100: '#C8E6C9',
  green200: '#A5D6A7',
  green300: '#81C784',
  green400: '#66BB6A',
  green500: '#4CAF50',
  green600: '#43A047',
  green700: '#388E3C',
  green800: '#2E7D32',
  green900: '#1B5E20',

  red50: '#FFEBEE',
  red100: '#FFCDD2',
  red200: '#EF9A9A',
  red300: '#E57373',
  red400: '#EF5350',
  red500: '#F44336',
  red600: '#E53935',
  red700: '#D32F2F',
  red800: '#C62828',
  red900: '#B71C1C',

  blue50: '#E3F2FD',
  blue100: '#BBDEFB',
  blue200: '#90CAF9',
  blue300: '#64B5F6',
  blue400: '#42A5F5',
  blue500: '#2196F3',
  blue600: '#1E88E5',
  blue700: '#1976D2',
  blue800: '#1565C0',
  blue900: '#0D47A1',

  yellow50: '#FFFDE7',
  yellow100: '#FFF9C4',
  yellow200: '#FFF59D',
  yellow300: '#FFF176',
  yellow400: '#FFEE58',
  yellow500: '#FFEB3B',
  yellow600: '#FDD835',
  yellow700: '#FBC02D',
  yellow800: '#F9A825',
  yellow900: '#F57F17',

  orange50: '#FFF3E0',
  orange100: '#FFE0B2',
  orange200: '#FFCC80',
  orange300: '#FFB74D',
  orange400: '#FFA726',
  orange500: '#FF9800',
  orange600: '#FB8C00',
  orange700: '#F57C00',
  orange800: '#EF6C00',
  orange900: '#E65100',

  purple50: '#F3E5F5',
  purple100: '#E1BEE7',
  purple200: '#CE93D8',
  purple300: '#BA68C8',
  purple400: '#AB47BC',
  purple500: '#9C27B0',
  purple600: '#8E24AA',
  purple700: '#7B1FA2',
  purple800: '#6A1B9A',
  purple900: '#4A148C',

  teal50: '#E0F2F1',
  teal100: '#B2DFDB',
  teal200: '#80CBC4',
  teal300: '#4DB6AC',
  teal400: '#26A69A',
  teal500: '#009688',
  teal600: '#00897B',
  teal700: '#00796B',
  teal800: '#00695C',
  teal900: '#004D40',

  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#EEEEEE',
  gray300: '#E0E0E0',
  gray400: '#BDBDBD',
  gray500: '#9E9E9E',
  gray600: '#757575',
  gray700: '#616161',
  gray800: '#424242',
  gray900: '#212121',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export interface ColorScheme {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  error: string;
  warning: string;
  success: string;
  info: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  card: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textOnPrimary: string;
  textInverse: string;
  border: string;
  borderLight: string;
  divider: string;
  income: string;
  expense: string;
  skeleton: string;
  skeletonHighlight: string;
  overlay: string;
  shadow: string;
  transparent: string;
}

export const lightColors: ColorScheme = {
  primary: '#16A34A',
  primaryLight: '#DCFCE7',
  primaryDark: '#15803D',
  secondary: '#2563EB',
  accent: '#0D9488',
  error: '#DC2626',
  warning: '#F59E0B',
  success: '#16A34A',
  info: '#2563EB',

  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F5F9',
  card: '#FFFFFF',

  text: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textOnPrimary: '#FFFFFF',
  textInverse: '#0F172A',

  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  divider: '#E2E8F0',

  income: '#16A34A',
  expense: '#DC2626',

  skeleton: '#E2E8F0',
  skeletonHighlight: '#F1F5F9',

  overlay: 'rgba(15,23,42,0.5)',
  shadow: 'rgba(15,23,42,0.08)',
  transparent: palette.transparent,
};

export const darkColors: ColorScheme = {
  primary: '#4ADE80',
  primaryLight: '#1A3A2A',
  primaryDark: '#86EFAC',
  secondary: '#60A5FA',
  accent: '#2DD4BF',
  error: '#FB7185',
  warning: '#FBBF24',
  success: '#4ADE80',
  info: '#60A5FA',

  background: '#0D0D14',
  surface: '#1A1A26',
  surfaceVariant: '#252533',
  card: '#1A1A26',

  text: '#F5F5FA',
  textSecondary: '#B0B0C5',
  textTertiary: '#7A7A90',
  textOnPrimary: '#0A0A0F',
  textInverse: '#F5F5FA',

  border: '#2E2E3D',
  borderLight: '#252533',
  divider: '#2E2E3D',

  income: '#4ADE80',
  expense: '#FB7185',

  skeleton: '#252533',
  skeletonHighlight: '#303045',

  overlay: 'rgba(0,0,0,0.8)',
  shadow: 'rgba(0,0,0,0.5)',
  transparent: palette.transparent,
};
