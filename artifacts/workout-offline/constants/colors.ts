/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: '#16181D',
    tint: '#6843E8',
    background: '#F5F3F8',
    foreground: '#16181D',
    card: '#FFFFFF',
    cardForeground: '#16181D',
    primary: '#6843E8',
    primaryForeground: '#FFFFFF',
    secondary: '#ECE9F2',
    secondaryForeground: '#302B3A',
    muted: '#EAE7F0',
    mutedForeground: '#777180',
    accent: '#F0EAFE',
    accentForeground: '#6843E8',
    destructive: '#E04B55',
    destructiveForeground: '#FFFFFF',
    border: '#DED9E7',
    input: '#E3DFEA',
    orange: '#E87932',
    success: '#17A673',
    surface2: '#F0EDF5',
  },
  dark: {
    text: '#F2F2F2',
    tint: '#7C4DFF',
    background: '#0F1115',
    foreground: '#F2F2F2',
    card: '#1B1E24',
    cardForeground: '#F2F2F2',
    primary: '#7C4DFF',
    primaryForeground: '#FFFFFF',
    secondary: '#23262D',
    secondaryForeground: '#F2F2F2',
    muted: '#252830',
    mutedForeground: '#9A9EA6',
    accent: '#272039',
    accentForeground: '#B69FFF',
    destructive: '#FF5252',
    destructiveForeground: '#FFFFFF',
    border: '#2A2D33',
    input: '#30343C',
    orange: '#FF9800',
    success: '#00C853',
    surface2: '#22252C',
  },
  radius: 14,
};

export default colors;
