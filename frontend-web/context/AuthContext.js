'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Cookies from 'js-cookie';

const AuthContext = createContext();

const base_url = process.env.NEXT_PUBLIC_API_URL || 'https://imronm.pythonanywhere.com/api';
const API_URL = base_url.endsWith('/') ? base_url.slice(0, -1) : base_url;

// Cookie expires in 90 days
const COOKIE_EXPIRES_DAYS = 90;

const cookieOptions = {
    expires: COOKIE_EXPIRES_DAYS,
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production',
};

function setAuthCookies(access, refresh) {
    Cookies.set('access_token', access, cookieOptions);
    Cookies.set('refresh_token', refresh, cookieOptions);
}

function clearAuthCookies() {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    useEffect(() => {
        // Cleanup old localStorage tokens (migration from old system)
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('guest_practice_session');
        checkUser();
    }, []);

    /**
     * Try to refresh the access token using the refresh token.
     * Returns new access token string or null if failed.
     */
    const refreshAccessToken = async () => {
        const refreshToken = Cookies.get('refresh_token');
        if (!refreshToken) return null;

        try {
            const res = await fetch(`${API_URL}/auth/token/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh: refreshToken }),
            });

            if (res.ok) {
                const data = await res.json();
                // Re-set both tokens with fresh 90-day expiry
                setAuthCookies(data.access, refreshToken);
                return data.access;
            }
        } catch (error) {
            console.error("Token refresh failed", error);
        }
        return null;
    };

    /**
     * Check current session. If access token expired but refresh token valid,
     * silently refresh and keep user logged in.
     */
    const checkUser = async () => {
        const token = Cookies.get('access_token');

        if (!token) {
            // No access token — try refresh token to restore session
            const refreshToken = Cookies.get('refresh_token');
            if (refreshToken) {
                const newToken = await refreshAccessToken();
                if (newToken) {
                    await fetchUserWithToken(newToken);
                    return;
                }
            }
            setLoading(false);
            return;
        }

        await fetchUserWithToken(token);
    };

    const fetchUserWithToken = async (token) => {
        try {
            const res = await fetch(`${API_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (res.ok) {
                const userData = await res.json();
                setUser(userData);
            } else if (res.status === 401) {
                // Access token expired — try to refresh silently
                const newToken = await refreshAccessToken();
                if (newToken) {
                    const retryRes = await fetch(`${API_URL}/auth/me`, {
                        headers: { 'Authorization': `Bearer ${newToken}` },
                    });
                    if (retryRes.ok) {
                        setUser(await retryRes.json());
                    } else {
                        doLogout(false); // silent logout, no redirect
                    }
                } else {
                    doLogout(false);
                }
            } else {
                doLogout(false);
            }
        } catch (error) {
            console.error("Auth check failed", error);
            // Only logout if it's NOT a network error. 
            // If offline or fetch fails due to connection, keep current user state.
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                return;
            }
            if (error instanceof TypeError && (error.message === 'Failed to fetch' || error.message.includes('NetworkError'))) {
                return;
            }
            doLogout(false);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: email, password }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || data.message || 'Login gagal.');

            setAuthCookies(data.access, data.refresh);
            setUser(data.user);
            router.push('/');
            return { success: true };
        } catch (error) {
            console.error("Login error:", error);
            const message = error.message === 'Failed to fetch' 
                ? 'Koneksi gagal. Mohon periksa internet Anda.' 
                : error.message;
            return { success: false, error: message };
        }
    };

    const register = async (username, email, password) => {
        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || data.message || 'Pendaftaran gagal.');

            setAuthCookies(data.access, data.refresh);
            setUser(data.user);
            router.push('/');
            return { success: true };
        } catch (error) {
            console.error("Registration error:", error);
            const message = error.message === 'Failed to fetch' 
                ? 'Koneksi gagal. Mohon periksa internet Anda.' 
                : error.message;
            return { success: false, error: message };
        }
    };

    const googleLogin = async (credentialResponse) => {
        try {
            const res = await fetch(`${API_URL}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: credentialResponse.credential }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || data.message || 'Login Google gagal.');

            setAuthCookies(data.access, data.refresh);
            setUser(data.user);
            router.push('/');
            return { success: true };
        } catch (error) {
            console.error("Google login error:", error);
            const message = error.message === 'Failed to fetch' 
                ? 'Koneksi gagal. Mohon periksa internet Anda.' 
                : error.message;
            return { success: false, error: message };
        }
    };

    const forgotPassword = async (email) => {
        try {
            const res = await fetch(`${API_URL}/auth/password-reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || data.message || 'Gagal meminta reset password.');
            return { success: true, message: data.message, reset_link: data.reset_link };
        } catch (error) {
            console.error("Forgot password error:", error);
            const message = error.message === 'Failed to fetch' 
                ? 'Koneksi gagal. Mohon periksa internet Anda.' 
                : error.message;
            return { success: false, error: message };
        }
    };

    const resetPassword = async (uid, token, newPassword) => {
        try {
            const res = await fetch(`${API_URL}/auth/password-reset-confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid, token, new_password: newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || data.detail || 'Reset password gagal.');
            return { success: true, message: data.message };
        } catch (error) {
            console.error("Reset password error:", error);
            const message = error.message === 'Failed to fetch' 
                ? 'Koneksi gagal. Mohon periksa internet Anda.' 
                : error.message;
            return { success: false, error: message };
        }
    };

    // Internal logout — redirect is optional
    const doLogout = (redirect = true) => {
        clearAuthCookies();
        localStorage.removeItem('guest_practice_session');
        window.dispatchEvent(new Event('auth:logout'));
        setUser(null);
        if (redirect) router.push('/login');
    };

    // Public logout (called by UI)
    const logout = () => doLogout(true);

    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <AuthContext.Provider value={{
                user, loading,
                login, register, googleLogin,
                logout, forgotPassword, resetPassword,
            }}>
                {children}
            </AuthContext.Provider>
        </GoogleOAuthProvider>
    );
}

export const useAuth = () => useContext(AuthContext);