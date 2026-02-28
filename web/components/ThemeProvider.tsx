'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';

type Theme = 'original' | 'martha';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => Promise<void>;
    toolsEnabled: boolean;
    dropogramEnabled: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('original');
    const [toolsEnabled, setToolsEnabled] = useState(false);
    const [dropogramEnabled, setDropogramEnabled] = useState(true);

    useEffect(() => {
        // Fetch initial settings (theme + feature flags)
        const fetchSettings = async () => {
            const { data } = await supabase
                .from('app_settings')
                .select('theme, tools_enabled, dropogram_enabled')
                .eq('id', 'global')
                .single();

            if (data) {
                if (data.theme) setTheme(data.theme as Theme);
                if (typeof data.tools_enabled === 'boolean') setToolsEnabled(data.tools_enabled);
                if (typeof data.dropogram_enabled === 'boolean') setDropogramEnabled(data.dropogram_enabled);
            }
        };

        fetchSettings();

        // Poll for settings changes (Realtime not available on free plan)
        const interval = setInterval(fetchSettings, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Apply theme class to body
        console.log('Applying theme:', theme);
        document.body.classList.remove('theme-original', 'theme-martha');
        document.body.classList.add(`theme-${theme}`);
    }, [theme]);

    const toggleTheme = async () => {
        const newTheme = theme === 'original' ? 'martha' : 'original';
        // Optimistic update
        setTheme(newTheme);

        const { error } = await supabase
            .from('app_settings')
            .update({ theme: newTheme })
            .eq('id', 'global');

        if (error) {
            console.error('Error updating theme:', error);
            // Revert if error (optional, but good practice)
            // fetchTheme(); // or just let the subscription handle it if it fails? 
            // Actually, if it fails, we should probably revert.
            // But for now, simple is fine.
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, toolsEnabled, dropogramEnabled }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
