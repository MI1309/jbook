import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { PracticeProvider } from "@/context/PracticeContext";
import { ThemeProvider } from "@/context/ThemeContext";
import ClientShell from "@/components/common/ClientShell";
import OfflineIndicator from "@/components/common/OfflineIndicator";
import AnnouncementPopup from "@/components/common/AnnouncementPopup";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata = {
    title: "JBook - Belajar Bahasa Jepang",
    description: "Aplikasi belajar bahasa Jepang lengkap dengan Kanji, Bunpo, dan Kotoba.",
    manifest: "/manifest.json",
    icons: {
        icon: "/icon.svg",
        apple: "/icon.svg",
    },
};

export const viewport = {
    themeColor: "#dc2626",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
};


export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning className="preload">
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            try {
                                if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                                    document.documentElement.classList.add('dark');
                                } else {
                                    document.documentElement.classList.remove('dark');
                                }
                            } catch (_) {}
                        `,
                    }}
                />
            </head>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen flex flex-col transition-colors duration-300`}
            >
                <ThemeProvider>
                    <AuthProvider>
                        <PracticeProvider>
                            <ClientShell>
                                {children}
                            </ClientShell>
                            <OfflineIndicator />
                            <AnnouncementPopup />
                            <ToastContainer 
                                position="bottom-right"
                                autoClose={3000}
                                hideProgressBar={false}
                                newestOnTop
                                closeOnClick
                                rtl={false}
                                pauseOnFocusLoss
                                draggable
                                pauseOnHover
                                theme="colored"
                            />
                        </PracticeProvider>
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}