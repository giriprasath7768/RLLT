import { createTheme } from '@mui/material/styles';

export const themePresets = {
    'Corporate Blue': { primary: '#1976d2', secondary: '#9c27b0', background: '#f5f5f5', paper: '#ffffff', textPrimary: '#333333' },
    'Dark Ocean': { primary: '#0288d1', secondary: '#009688', background: '#121212', paper: '#1e1e1e', textPrimary: '#ffffff' },
    'Emerald': { primary: '#388e3c', secondary: '#f57c00', background: '#f1f8e9', paper: '#ffffff', textPrimary: '#2e7d32' },
    'Purple Night': { primary: '#7b1fa2', secondary: '#512da8', background: '#121212', paper: '#1e1e1e', textPrimary: '#e1bee7' },
    'Minimal White': { primary: '#212121', secondary: '#757575', background: '#ffffff', paper: '#fafafa', textPrimary: '#000000' },
};

export const defaultThemeConfig = {
    mode: 'light',
    preset: 'Corporate Blue',
    primaryColor: themePresets['Corporate Blue'].primary,
    secondaryColor: themePresets['Corporate Blue'].secondary,
    fontFamily: 'Inter, sans-serif',
    fontSize: 14,
    borderRadius: 8,
    compactMode: false,
    sidebarWidth: 288,
    sidebarBg: '#1F2937',
    sidebarText: '#D1D5DB',
    topbarBg: '#FFFFFF',
    topbarText: '#333333',
    appTitle: 'Real Life Leadership Training',
    logoText: 'RLLT Web App',
    floatingMenuItems: [],
};

export const generateTheme = (config) => {
    return createTheme({
        palette: {
            mode: config.mode,
            primary: { main: config.primaryColor },
            secondary: { main: config.secondaryColor },
            background: {
                default: config.mode === 'dark' ? '#121212' : '#f5f5f5',
                paper: config.mode === 'dark' ? '#1e1e1e' : '#ffffff',
            },
        },
        typography: {
            fontFamily: config.fontFamily,
            fontSize: config.compactMode ? Number(config.fontSize) - 2 : Number(config.fontSize),
        },
        shape: {
            borderRadius: Number(config.borderRadius),
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: { textTransform: 'none', borderRadius: Number(config.borderRadius) },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: { borderRadius: Number(config.borderRadius) },
                },
            },
            MuiDrawer: {
                styleOverrides: {
                    paper: { width: config.sidebarWidth, backgroundColor: config.sidebarBg, color: config.sidebarText },
                },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: { backgroundColor: config.topbarBg, color: config.topbarText },
                },
            },
        },
    });
};
