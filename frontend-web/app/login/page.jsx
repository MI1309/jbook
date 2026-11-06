'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import AppMessage from '@/components/common/AppMessage';
import { Eye, EyeOff } from 'lucide-react';
import AuthLayout, { authButtonClass, authIconButtonClass, authInputClass, authLabelClass } from '@/components/auth/AuthLayout';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const res = await login(email, password);
            if (!res.success) setError(res.error);
        } catch {
            setError('Tidak dapat terhubung. Silakan coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout eyebrow="Selamat datang kembali" title="Masuk ke JBook" description="Lanjutkan belajar bahasa Jepang dari tempat terakhir kamu berhenti.">
                <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                    {error && (
                        <AppMessage variant="warning" className="text-sm">
                            {error}
                        </AppMessage>
                    )}
                    
                    <div className="space-y-5">
                        <div className="group">
                            <label htmlFor="email-address" className={authLabelClass}>Email</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                required
                                className={authInputClass}
                                placeholder="nama@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="group">
                            <label htmlFor="password" className={authLabelClass}>Password</label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    className={`${authInputClass} pr-12`}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => setShowPassword((visible) => !visible)}
                                    className={authIconButtonClass}
                                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                    aria-pressed={showPassword}
                                >
                                    {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end pt-1">
                        <Link href="/forgot-password" className="text-sm font-semibold text-[#39765d] hover:underline dark:text-[#8ec6a5]">
                            Lupa Password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={authButtonClass}
                    >
                        {isLoading ? 'Memeriksa akun...' : 'Masuk Sekarang'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-300">
                        Belum punya akun?{' '}
                        <Link href="/register" className="font-bold text-[#39765d] hover:underline dark:text-[#8ec6a5]">
                            Daftar
                        </Link>
                    </p>
                </div>
        </AuthLayout>
    );
}


