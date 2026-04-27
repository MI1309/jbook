'use client';

import { useState, Suspense, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const searchParams = useSearchParams();
    const router = useRouter();
    const { resetPassword } = useAuth();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const uid = searchParams.get('uid');
    const token = searchParams.get('token');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        if (!uid || !token) {
            setError('Missing reset token or user ID. Invalid link.');
            return;
        }

        setIsLoading(true);

        const res = await resetPassword(uid, token, password);
        if (!res.success) {
            setError(res.error || 'Failed to reset password. The link might be expired.');
        } else {
            setSuccessMessage(res.message || 'Password has been reset successfully!');
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        }

        setIsLoading(false);
    };

    if (!uid || !token) {
        return (
            <div className={`border px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isDark ? 'bg-red-950/20 border-red-900/50 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`} role="alert">
                <span className="block">Link reset password tidak valid. Silakan minta link baru.</span>
                <div className="mt-4 text-center">
                    <Link href="/forgot-password" className="text-xs font-black uppercase tracking-widest text-red-600 hover:text-red-500 transition-colors">
                        Minta Link Baru
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
                <div className={`border px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isDark ? 'bg-red-950/20 border-red-900/50 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`} role="alert">
                    <span>{error}</span>
                </div>
            )}
            {successMessage && (
                <div className={`border px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isDark ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`} role="alert">
                    <span className="block">{successMessage}</span>
                    <p className="mt-2 text-xs font-bold">Mengalihkan ke halaman login...</p>
                </div>
            )}
            <div className="space-y-4">
                <div>
                    <label htmlFor="password" className={`block text-xs font-black uppercase tracking-widest mb-1 ml-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Password Baru</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        className={`appearance-none relative block w-full px-4 py-3 border rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-red-500 sm:text-sm ${
                            isDark 
                                ? 'bg-black border-red-950/30 text-white placeholder-gray-700' 
                                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                        }`}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="confirmPassword" className={`block text-xs font-black uppercase tracking-widest mb-1 ml-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Konfirmasi Password</label>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        className={`appearance-none relative block w-full px-4 py-3 border rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-red-500 sm:text-sm ${
                            isDark 
                                ? 'bg-black border-red-950/30 text-white placeholder-gray-700' 
                                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                        }`}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>
            </div>

            <div>
                <button
                    type="submit"
                    disabled={isLoading || !!successMessage}
                    className={`w-full flex justify-center py-3 px-4 border border-transparent text-sm font-black uppercase tracking-widest rounded-xl text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all shadow-lg shadow-red-500/20 active:scale-[0.98] ${isLoading || successMessage ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isLoading ? 'Mereset...' : 'Reset Password'}
                </button>
            </div>
        </form>
    );
}

export default function ResetPasswordPage() {
    const { theme, mounted } = useTheme();
    
    if (!mounted) return null;
    const isDark = theme === 'dark';

    return (
        <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-all duration-500 relative overflow-hidden ${
            isDark 
                ? 'bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-neutral-900 via-black to-neutral-950' 
                : 'bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-red-50 via-gray-50 to-white'
        }`}>
            {/* Animated Background Elements */}
            <div className={`absolute top-0 left-0 w-96 h-96 rounded-full blur-[100px] opacity-20 animate-pulse ${isDark ? 'bg-red-900' : 'bg-red-200'}`} />
            <div className={`absolute bottom-0 right-0 w-96 h-96 rounded-full blur-[100px] opacity-10 animate-pulse delay-700 ${isDark ? 'bg-red-800' : 'bg-red-100'}`} />

            <div className={`max-w-md w-full space-y-8 p-10 rounded-[2.5rem] backdrop-blur-xl border transition-all duration-300 relative z-10 ${
                isDark 
                    ? 'bg-black/40 border-white/5 shadow-[0_0_50px_-12px_rgba(220,38,38,0.2)]' 
                    : 'bg-white/80 border-gray-100 shadow-xl shadow-red-500/5'
            }`}>
                <div className="text-center">
                    <div className="inline-block p-4 rounded-3xl bg-red-600 shadow-lg shadow-red-500/40 mb-6 group transition-transform hover:scale-110">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className={`text-4xl font-black tracking-tight transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Password Baru
                    </h2>
                    <p className={`mt-3 text-sm font-bold tracking-wide uppercase transition-colors ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
                        Silakan Atur Kata Sandi Baru
                    </p>
                </div>

                <Suspense fallback={<div className={`text-center py-10 font-black uppercase tracking-[0.2em] animate-pulse ${isDark ? 'text-neutral-700' : 'text-gray-300'}`}>Menyiapkan Form...</div>}>
                    <ResetPasswordForm />
                </Suspense>

                <div className="text-center mt-10 space-y-6">
                    <Link href="/login" className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${isDark ? 'text-neutral-700 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Kembali ke Login
                    </Link>
                </div>
            </div>
        </div>
    );
}

