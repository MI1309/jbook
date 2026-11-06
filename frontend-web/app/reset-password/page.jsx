'use client';

import { useState, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AppMessage from '@/components/common/AppMessage';
import { Eye, EyeOff } from 'lucide-react';
import AuthLayout, { authButtonClass, authIconButtonClass, authInputClass, authLabelClass } from '@/components/auth/AuthLayout';

function ResetPasswordForm() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const searchParams = useSearchParams();
    const router = useRouter();
    const { resetPassword } = useAuth();

    const uid = searchParams.get('uid');
    const token = searchParams.get('token');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (password !== confirmPassword) {
            setError('Konfirmasi password belum sama.');
            return;
        }

        if (password.length < 8) {
            setError('Password harus terdiri dari minimal 8 karakter.');
            return;
        }

        if (!uid || !token) {
            setError('Tautan reset tidak valid. Silakan minta tautan baru.');
            return;
        }

        setIsLoading(true);

        try {
            const res = await resetPassword(uid, token, password);
            if (!res.success) {
                setError(res.error || 'Password gagal diperbarui. Tautan mungkin sudah kedaluwarsa.');
            } else {
                setSuccessMessage(res.message || 'Password berhasil diperbarui.');
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            }
        } catch {
            setError('Tidak dapat terhubung. Silakan coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!uid || !token) {
        return (
                <AppMessage variant="warning" className="text-sm">
                <span className="block">Link reset password tidak valid. Silakan minta link baru.</span>
                <div className="mt-4 text-center">
                    <Link href="/forgot-password" className="text-sm font-bold text-[#39765d] transition-colors hover:underline dark:text-[#8ec6a5]">
                        Minta Link Baru
                    </Link>
                </div>
            </AppMessage>
        );
    }

    return (
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
                <AppMessage variant="warning">{error}</AppMessage>
            )}
            {successMessage && (
                <AppMessage variant="success">
                    <span className="block">{successMessage}</span>
                    <p className="mt-2 text-xs font-bold">Mengalihkan ke halaman login...</p>
                </AppMessage>
            )}
            <div className="space-y-4">
                <div>
                    <label htmlFor="password" className={authLabelClass}>Password Baru</label>
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
                            aria-label={showPassword ? 'Sembunyikan password baru' : 'Tampilkan password baru'}
                            aria-pressed={showPassword}
                        >
                            {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                        </button>
                    </div>
                </div>
                <div>
                    <label htmlFor="confirmPassword" className={authLabelClass}>Konfirmasi Password</label>
                    <div className="relative">
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            className={`${authInputClass} pr-12`}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => setShowConfirmPassword((visible) => !visible)}
                            className={authIconButtonClass}
                            aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi password' : 'Tampilkan konfirmasi password'}
                            aria-pressed={showConfirmPassword}
                        >
                            {showConfirmPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                        </button>
                    </div>
                </div>
            </div>

            <div>
                <button
                    type="submit"
                    disabled={isLoading || !!successMessage}
                    className={authButtonClass}
                >
                    {isLoading ? 'Mereset...' : 'Reset Password'}
                </button>
            </div>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <AuthLayout eyebrow="Keamanan akun" title="Atur password baru" description="Gunakan password minimal 8 karakter untuk melindungi akunmu.">
                <Suspense fallback={<div className="py-10 text-center text-sm font-semibold text-gray-500">Menyiapkan form...</div>}>
                    <ResetPasswordForm />
                </Suspense>
        </AuthLayout>
    );
}

