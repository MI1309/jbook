'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('dark');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setTheme('dark');
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        setMounted(true);

        // Remove preload class to re-enable transitions after initial render completes
        setTimeout(() => {
            document.documentElement.classList.remove('preload');
        }, 50);
    }, []);

    const toggleTheme = () => {
        // Feature disabled: force dark mode
        setTheme('dark');
        localStorage.setItem('theme', 'dark');
        document.documentElement.classList.add('dark');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, mounted }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
