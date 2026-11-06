'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import AppMessage from '@/components/common/AppMessage';
import AuthLayout, { authButtonClass, authInputClass, authLabelClass, authLinkClass } from '@/components/auth/AuthLayout';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [accountExists, setAccountExists] = useState(null);
    const [emailSent, setEmailSent] = useState(null);
    const [debugResetLink, setDebugResetLink] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { forgotPassword } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setAccountExists(null);
        setEmailSent(null);
        setIsLoading(true);

        try {
            const res = await forgotPassword(email);
            if (!res.success) {
                setError(res.error || 'Terjadi kesalahan. Silakan coba lagi.');
            } else {
                setSuccessMessage(res.message || 'Periksa email untuk mendapatkan tautan penggantian password.');
                setAccountExists(res.account_exists);
                setEmailSent(res.email_sent);
                if (res.reset_link) setDebugResetLink(res.reset_link);
            }
        } catch {
            setError('Tidak dapat terhubung. Silakan coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout eyebrow="Pemulihan akun" title="Lupa password?" description="Masukkan email akunmu. Kami akan mengirimkan tautan untuk membuat password baru.">
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <AppMessage variant="warning" className="text-sm">
                            {error}
                        </AppMessage>
                    )}
                    
                    {successMessage && (
                        <AppMessage variant={accountExists === false || emailSent === false ? 'warning' : 'success'} className="text-sm">
                            <div>
                                {successMessage}
                                {debugResetLink && (
                                    <div className="mt-4 rounded-xl border border-emerald-500/20 bg-black/5 p-3 dark:bg-black/20">
                                        <p className="mb-1 text-[10px] font-black uppercase tracking-widest opacity-70">Debug Link:</p>
                                        <a href={debugResetLink} className="break-all text-[10px] font-bold text-blue-700 underline dark:text-blue-300" target="_blank" rel="noopener noreferrer">{debugResetLink}</a>
                                    </div>
                                )}
                            </div>
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
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={authButtonClass}
                    >
                        {isLoading ? 'Mengirim...' : 'Kirim Link Reset'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link href="/login" className={`text-sm ${authLinkClass}`}>Kembali ke login</Link>
                </div>
        </AuthLayout>
    );
}

