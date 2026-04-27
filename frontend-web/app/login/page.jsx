'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';
import { GoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, googleLogin } = useAuth();
    const { theme, mounted } = useTheme();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const res = await login(email, password);
        if (!res.success) {
            setError(res.error);
        }
    };

    if (!mounted) return null;

    const isDark = theme === 'dark';

    return (
        <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-all duration-500 relative overflow-hidden ${
            isDark 
                ? 'bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-neutral-900 via-black to-neutral-950' 
                : 'bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-red-50 via-gray-50 to-white'
        }`}>
            {/* Animated Background Elements */}
            <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-[100px] opacity-20 animate-pulse ${isDark ? 'bg-red-900' : 'bg-red-200'}`} />
            <div className={`absolute bottom-0 left-0 w-96 h-96 rounded-full blur-[100px] opacity-10 animate-pulse delay-700 ${isDark ? 'bg-red-800' : 'bg-red-100'}`} />

            <div className={`max-w-md w-full space-y-8 p-10 rounded-[2.5rem] backdrop-blur-xl border transition-all duration-300 relative z-10 ${
                isDark 
                    ? 'bg-black/40 border-white/5 shadow-[0_0_50px_-12px_rgba(220,38,38,0.2)]' 
                    : 'bg-white/80 border-gray-100 shadow-xl shadow-red-500/5'
            }`}>
                <div className="text-center">
                    <div className="inline-block p-4 rounded-3xl bg-red-600 shadow-lg shadow-red-500/40 mb-6 group transition-transform hover:scale-110">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 21a10.003 10.003 0 008.384-4.51l.054.09m-4.287-4.21C18.06 13.002 20 11.227 20 9a8 8 0 10-16 0c0 2.227 1.94 4.002 3.847 4.79" />
                        </svg>
                    </div>
                    <h2 className={`text-4xl font-black tracking-tight transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Masuk
                    </h2>
                    <p className={`mt-3 text-sm font-bold tracking-wide uppercase transition-colors ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
                        Lanjutkan Belajar JBook
                    </p>
                </div>
                
                <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className={`p-4 rounded-2xl text-xs font-black uppercase tracking-widest border animate-shake transition-colors ${
                            isDark ? 'bg-red-950/20 border-red-900/50 text-red-400' : 'bg-red-50 border-red-200 text-red-600'
                        }`} role="alert">
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {error}
                            </span>
                        </div>
                    )}
                    
                    <div className="space-y-5">
                        <div className="group">
                            <label htmlFor="email-address" className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-1 transition-colors ${isDark ? 'text-neutral-600 group-focus-within:text-red-500' : 'text-gray-400 group-focus-within:text-red-600'}`}>Email</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                required
                                className={`appearance-none block w-full px-5 py-4 border rounded-2xl font-bold transition-all focus:outline-none focus:ring-2 focus:ring-red-500/50 sm:text-sm ${
                                    isDark 
                                        ? 'bg-neutral-900/50 border-neutral-800 text-white placeholder-neutral-700 hover:bg-neutral-900' 
                                        : 'bg-gray-50 border-gray-100 text-gray-900 placeholder-gray-400 hover:bg-white'
                                }`}
                                placeholder="nama@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="group">
                            <label htmlFor="password" className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-1 transition-colors ${isDark ? 'text-neutral-600 group-focus-within:text-red-500' : 'text-gray-400 group-focus-within:text-red-600'}`}>Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className={`appearance-none block w-full px-5 py-4 border rounded-2xl font-bold transition-all focus:outline-none focus:ring-2 focus:ring-red-500/50 sm:text-sm ${
                                    isDark 
                                        ? 'bg-neutral-900/50 border-neutral-800 text-white placeholder-neutral-700 hover:bg-neutral-900' 
                                        : 'bg-gray-50 border-gray-100 text-gray-900 placeholder-gray-400 hover:bg-white'
                                }`}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end">
                        <Link href="/forgot-password" className="text-[10px] font-black uppercase tracking-widest text-red-600 hover:text-red-400 transition-all hover:scale-105">
                            Lupa Password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        className="w-full group relative flex justify-center py-4 px-4 border border-transparent text-xs font-black uppercase tracking-[0.2em] rounded-2xl text-white bg-red-600 hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all shadow-xl shadow-red-600/20 active:scale-95 overflow-hidden"
                    >
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                        Masuk Sekarang
                    </button>
                </form>

                <div className="mt-10">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className={`w-full border-t ${isDark ? 'border-neutral-800' : 'border-gray-100'}`} />
                        </div>
                        <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]">
                            <span className={`px-4 transition-colors ${isDark ? 'bg-black text-neutral-600' : 'bg-white text-gray-400'}`}>
                                Atau
                            </span>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-center">
                        <div className={`p-1 rounded-2xl transition-all ${isDark ? 'bg-neutral-800/50 hover:bg-neutral-800' : 'bg-gray-50 hover:bg-white'}`}>
                            <GoogleLogin
                                theme={isDark ? "dark" : "outline"}
                                shape="circle"
                                onSuccess={googleLogin}
                                onError={() => setError('Google Login Failed')}
                            />
                        </div>
                    </div>
                </div>

                <div className="text-center mt-10 space-y-6">
                    <p className={`text-sm font-medium transition-colors ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                        Belum punya akun?{' '}
                        <Link href="/register" className="font-black text-red-600 hover:text-red-400 transition-colors">
                            Daftar
                        </Link>
                    </p>
                    <Link href="/" className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${isDark ? 'text-neutral-700 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Beranda
                    </Link>
                </div>
            </div>
        </div>
    );
}


