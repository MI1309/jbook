'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Cookies from 'js-cookie';

const AuthContext = createContext();

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://imronm.pythonanywhere.com/api';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Google Client ID from environment variable
    const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    console.log("Google Client ID Loaded:", GOOGLE_CLIENT_ID ? GOOGLE_CLIENT_ID.substring(0, 10) + "..." : "Not Found");

    useEffect(() => {
        // Cleanup old localStorage data
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('guest_practice_session');
        checkUser();
    }, []);

    const checkUser = async () => {
        const token = Cookies.get('access_token');
        if (token) {
            try {
                const res = await fetch(`${API_URL}/auth/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (res.ok) {
                    const userData = await res.json();
                    setUser(userData);
                } else {
                    // Token invalid or expired
                    logout();
                }
            } catch (error) {
                console.error("Auth check failed", error);
                logout();
            }
        }
        setLoading(false);
    };

    const login = async (email, password) => {
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Set cookies with 1 hour expiration (1/24 of a day)
            const oneHour = 1 / 24;
            Cookies.set('access_token', data.access, { expires: oneHour });
            Cookies.set('refresh_token', data.refresh, { expires: oneHour });

            setUser(data.user);
            router.push('/');
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const register = async (username, email, password) => {
        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            // Set cookies with 1 hour expiration
            const oneHour = 1 / 24;
            Cookies.set('access_token', data.access, { expires: oneHour });
            Cookies.set('refresh_token', data.refresh, { expires: oneHour });

            setUser(data.user);
            router.push('/');
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const googleLogin = async (credentialResponse) => {
        console.log("Google Login Initiated", credentialResponse);
        try {
            const res = await fetch(`${API_URL}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: credentialResponse.credential })
            });

            console.log("Google Auth API Response Status:", res.status);
            const data = await res.json();
            console.log("Google Auth API Response Data:", data);

            if (!res.ok) {
                const errorMessage = data.detail || data.message || 'Google login failed';
                console.error("Backend Error Detail:", errorMessage);
                throw new Error(errorMessage);
            }

            // Set cookies with 1 hour expiration
            const oneHour = 1 / 24;
            Cookies.set('access_token', data.access, { expires: oneHour });
            Cookies.set('refresh_token', data.refresh, { expires: oneHour });

            setUser(data.user);
            router.push('/');
            return { success: true };
        } catch (error) {
            console.error("Google login error:", error);
            return { success: false, error: error.message };
        }
    };

    const forgotPassword = async (email) => {
        try {
            const res = await fetch(`${API_URL}/auth/password-reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to request password reset');
            }

            return { success: true, message: data.message };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const resetPassword = async (uid, token, newPassword) => {
        try {
            const res = await fetch(`${API_URL}/auth/password-reset-confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid, token, new_password: newPassword })
            });

            const data = await res.json();

            if (!res.ok) {
                // Return a specific error if message provided, otherwise generic
                throw new Error(data.message || data.detail || 'Password reset failed');
            }

            return { success: true, message: data.message };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        localStorage.removeItem('guest_practice_session');
        window.dispatchEvent(new Event('auth:logout'));
        setUser(null);
        router.push('/login');
    };

    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <AuthContext.Provider value={{ user, loading, login, register, googleLogin, logout, forgotPassword, resetPassword }}>
                {children}
            </AuthContext.Provider>
        </GoogleOAuthProvider>
    );
}

export const useAuth = () => useContext(AuthContext);
