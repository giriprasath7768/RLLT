import React, { createContext, useState, useEffect, useMemo, useContext } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { generateTheme, defaultThemeConfig, themePresets } from '../theme/theme';

const ThemeContext = createContext();

export const useThemeContext = () => useContext(ThemeContext);

export const CustomThemeProvider = ({ children }) => {
    const [themeConfig, setThemeConfig] = useState(() => {
        const saved = localStorage.getItem('rllt-theme-config');
        return saved ? JSON.parse(saved) : defaultThemeConfig;
    });

    useEffect(() => {
        localStorage.setItem('rllt-theme-config', JSON.stringify(themeConfig));
        
        // Expose to CSS variables for Tailwind components
        document.documentElement.style.setProperty('--sidebar-bg', themeConfig.sidebarBg);
        document.documentElement.style.setProperty('--sidebar-text', themeConfig.sidebarText);
        document.documentElement.style.setProperty('--topbar-bg', themeConfig.topbarBg);
        document.documentElement.style.setProperty('--topbar-text', themeConfig.topbarText);
        document.documentElement.style.setProperty('--primary-color', themeConfig.primaryColor);
        document.documentElement.style.setProperty('--border-radius', `${themeConfig.borderRadius}px`);
        document.documentElement.style.setProperty('--font-family', themeConfig.fontFamily);
    }, [themeConfig]);

    const muiTheme = useMemo(() => generateTheme(themeConfig), [themeConfig]);

    const updateTheme = (newConfig) => {
        setThemeConfig(prev => ({ ...prev, ...newConfig }));
    };

    const applyPreset = (presetName) => {
        if (themePresets[presetName]) {
            const preset = themePresets[presetName];
            updateTheme({
                preset: presetName,
                primaryColor: preset.primary,
                secondaryColor: preset.secondary,
                mode: presetName.includes('Dark') || presetName.includes('Night') ? 'dark' : 'light'
            });
        }
    };

    const resetTheme = () => {
        setThemeConfig(defaultThemeConfig);
    };

    return (
        <ThemeContext.Provider value={{ themeConfig, updateTheme, applyPreset, resetTheme, themePresets }}>
            <ThemeProvider theme={muiTheme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ThemeContext.Provider>
    );
};
