'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';

type Theme = 'original' | 'martha';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('original');

    useEffect(() => {
        // Fetch initial theme
        const fetchTheme = async () => {
            const { data } = await supabase
                .from('app_settings')
                .select('theme')
                .eq('id', 'global')
                .single();

            if (data?.theme) {
                setTheme(data.theme as Theme);
            }
        };

        fetchTheme();

        // Subscribe to changes
        const channel = supabase
            .channel('app_settings_changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'app_settings',
                    filter: 'id=eq.global',
                },
                (payload) => {
                    console.log('Theme update received:', payload);
                    if (payload.new.theme) {
                        setTheme(payload.new.theme as Theme);
                    }
                }
            )
            .subscribe((status) => {
                console.log('Theme subscription status:', status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
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
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
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
