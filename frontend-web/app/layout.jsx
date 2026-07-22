import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { PracticeProvider } from "@/context/PracticeContext";
import { ThemeProvider } from "@/context/ThemeContext";
import ClientShell from "@/components/common/ClientShell";
import OfflineIndicator from "@/components/common/OfflineIndicator";
import AnnouncementPopup from "@/components/common/AnnouncementPopup";
import SakuraBackground from "@/components/common/SakuraBackground";
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
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://jbook-five.vercel.app'),
    title: {
        default: "JBook - Belajar Bahasa Jepang",
        template: "%s | JBook"
    },
    description: "Aplikasi belajar bahasa Jepang lengkap dengan materi Kanji, Bunpo (tata bahasa), Kotoba (kosakata), dan latihan soal JLPT. Tingkatkan kemampuan bahasa Jepang Anda sekarang juga.",
    keywords: ["belajar bahasa jepang", "kanji", "bunpo", "kotoba", "JLPT", "bahasa jepang online", "jbook", "latihan jlpt", "kosakata jepang", "tata bahasa jepang"],
    authors: [{ name: "JBook Team" }],
    creator: "JBook Team",
    publisher: "JBook",
    manifest: "/manifest.json",
    icons: {
        icon: "/icon.svg",
        apple: "/icon.svg",
    },
    openGraph: {
        title: "JBook - Platform Belajar Bahasa Jepang Lengkap",
        description: "Pelajari Kanji, Bunpo, dan Kotoba dengan interaktif. Siapkan diri Anda untuk ujian JLPT dengan materi dan latihan terlengkap di JBook.",
        url: 'https://jbook.vercel.app',
        siteName: 'JBook',
        images: [
            {
                url: '/icon-512.png',
                width: 512,
                height: 512,
                alt: 'JBook Logo',
            },
        ],
        locale: 'id_ID',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'JBook - Belajar Bahasa Jepang',
        description: 'Aplikasi interaktif untuk belajar Kanji, Bunpo, dan Kotoba.',
        images: ['/icon-512.png'],
    },
    alternates: {
        canonical: '/',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
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
        <html lang="en" suppressHydrationWarning className="dark preload">
            <head>
            </head>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen flex flex-col transition-colors duration-300`}
            >
                <ThemeProvider>
                    <AuthProvider>
                        <PracticeProvider>
                            <ClientShell>
                                <SakuraBackground />
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