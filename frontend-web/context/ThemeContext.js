'use client';

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';

const ThemeContext = createContext();
const listeners = new Set();

function subscribeToTheme(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function getThemeSnapshot() {
    return localStorage.getItem('jbook-theme') === 'dark' ? 'dark' : 'light';
}

function getServerThemeSnapshot() {
    return 'light';
}

export function ThemeProvider({ children }) {
    const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        const frame = requestAnimationFrame(() => setMounted(true));

        // Remove preload class to re-enable transitions after initial render completes
        const timeout = setTimeout(() => {
            document.documentElement.classList.remove('preload');
        }, 50);

        return () => {
            cancelAnimationFrame(frame);
            clearTimeout(timeout);
        };
    }, [theme]);

    const toggleTheme = () => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('jbook-theme', nextTheme);
        listeners.forEach((listener) => listener());
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
