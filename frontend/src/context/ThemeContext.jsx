import React, { createContext, useState, useEffect, useMemo, useContext } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { generateTheme, defaultThemeConfig, themePresets } from '../theme/theme';
import axios from 'axios';

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

    const syncThemeFromBackend = async () => {
        try {
            const res = await axios.get('http://' + window.location.hostname + ':8000/api/profile/me', { withCredentials: true });
            if (res.data && res.data.theme_config) {
                setThemeConfig(prev => ({ ...prev, ...res.data.theme_config }));
            }
        } catch (err) {
            console.log("No active user session to load backend theme config from.");
        }
    };

    useEffect(() => {
        syncThemeFromBackend();
    }, []);

    const muiTheme = useMemo(() => generateTheme(themeConfig), [themeConfig]);

    const updateTheme = (newConfig) => {
        setThemeConfig(prev => {
            const updated = { ...prev, ...newConfig };
            localStorage.setItem('rllt-theme-config', JSON.stringify(updated));
            
            // Asynchronously sync to backend
            axios.put('http://' + window.location.hostname + ':8000/api/profile/me', {
                theme_config: {
                    floatingMenuItems: updated.floatingMenuItems,
                    showFloatingMenu: updated.showFloatingMenu,
                    appTitle: updated.appTitle,
                    logoText: updated.logoText,
                    primaryColor: updated.primaryColor,
                    secondaryColor: updated.secondaryColor,
                    mode: updated.mode,
                    compactMode: updated.compactMode,
                    fontSize: updated.fontSize,
                    borderRadius: updated.borderRadius,
                    sidebarBg: updated.sidebarBg,
                    sidebarText: updated.sidebarText,
                    topbarBg: updated.topbarBg,
                    topbarText: updated.topbarText
                }
            }, { withCredentials: true }).catch(err => {
                console.log("Could not sync theme config to backend", err);
            });
            
            return updated;
        });
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
        <ThemeContext.Provider value={{ themeConfig, updateTheme, applyPreset, resetTheme, themePresets, syncThemeFromBackend }}>
            <ThemeProvider theme={muiTheme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ThemeContext.Provider>
    );
};
