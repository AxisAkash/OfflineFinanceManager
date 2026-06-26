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
  primary: palette.green600,
  primaryLight: palette.green100,
  primaryDark: palette.green800,
  secondary: palette.blue500,
  accent: palette.teal500,
  error: palette.red500,
  warning: palette.orange500,
  success: palette.green500,
  info: palette.blue500,

  background: palette.gray50,
  surface: palette.white,
  surfaceVariant: palette.gray100,
  card: palette.white,

  text: palette.gray900,
  textSecondary: palette.gray600,
  textTertiary: palette.gray400,
  textOnPrimary: palette.white,
  textInverse: palette.white,

  border: palette.gray200,
  borderLight: palette.gray100,
  divider: palette.gray200,

  income: palette.green500,
  expense: palette.red500,

  skeleton: palette.gray200,
  skeletonHighlight: palette.gray100,

  overlay: 'rgba(0,0,0,0.5)',
  shadow: 'rgba(0,0,0,0.1)',
  transparent: palette.transparent,
};

export const darkColors: ColorScheme = {
  primary: palette.green400,
  primaryLight: palette.green900,
  primaryDark: palette.green200,
  secondary: palette.blue400,
  accent: palette.teal400,
  error: palette.red400,
  warning: palette.orange400,
  success: palette.green400,
  info: palette.blue400,

  background: palette.gray900,
  surface: palette.gray800,
  surfaceVariant: palette.gray700,
  card: palette.gray800,

  text: palette.gray50,
  textSecondary: palette.gray400,
  textTertiary: palette.gray600,
  textOnPrimary: palette.gray900,
  textInverse: palette.gray900,

  border: palette.gray700,
  borderLight: palette.gray800,
  divider: palette.gray700,

  income: palette.green400,
  expense: palette.red400,

  skeleton: palette.gray700,
  skeletonHighlight: palette.gray600,

  overlay: 'rgba(0,0,0,0.7)',
  shadow: 'rgba(0,0,0,0.3)',
  transparent: palette.transparent,
};
