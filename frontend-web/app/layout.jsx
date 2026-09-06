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

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jbook-five.vercel.app';

export const metadata = {
    metadataBase: new URL(BASE_URL),
    title: {
        default: "JBook - Belajar Bahasa Jepang Lengkap & Interaktif",
        template: "%s | JBook"
    },
    description: "Aplikasi belajar bahasa Jepang terlengkap: Kanji JLPT N5-N1, Bunpo Tata Bahasa, Kotoba Kosakata, latihan soal, tips belajar & panduan ujian JLPT interaktif.",
    keywords: [
        "belajar bahasa jepang", "bahasa jepang online", "jbook", "kursus bahasa jepang",
        "kanji", "hiragana", "katakana", "bunpo", "tata bahasa jepang",
        "kotoba", "kosakata jepang", "jlpt", "latihan jlpt", "ujian jlpt",
        "jlpt n5", "jlpt n4", "jlpt n3", "jlpt n2", "jlpt n1",
        "kakitori", "latihan kanji", "grammar jepang", "vocabulary jepang"
    ],
    authors: [{ name: "JBook Team", url: BASE_URL }],
    creator: "JBook Team",
    publisher: "JBook",
    category: "education",
    manifest: "/manifest.json",
    icons: {
        icon: [
            { url: "/icon-16.png", sizes: "16x16", type: "image/png" },
            { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
            { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
            { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
        apple: "/icon-192.png",
        shortcut: "/favicon.ico",
    },
    openGraph: {
        type: 'website',
        locale: 'id_ID',
        url: BASE_URL,
        siteName: 'JBook',
        title: "JBook - Platform Belajar Bahasa Jepang #1",
        description: "Pelajari Kanji, Bunpo, dan Kotoba dengan interaktif. Siapkan ujian JLPT N5-N1 dengan materi, latihan soal, dan tips terlengkap.",
        images: [
            {
                url: '/icon-512.png',
                width: 512,
                height: 512,
                alt: 'JBook - Belajar Bahasa Jepang',
                type: 'image/png',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'JBook - Belajar Bahasa Jepang Lengkap',
        description: 'Kursus bahasa Jepang interaktif: Kanji, Bunpo, Kotoba & latihan JLPT terlengkap.',
        images: ['/icon-512.png'],
        creator: '@jbook',
    },
    alternates: {
        canonical: BASE_URL,
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
    verification: {
        google: 'jbook-verification',
    },
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
};

export const viewport = {
    themeColor: "#dc2626",
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    colorScheme: "light dark",
};


export default function RootLayout({ children }) {
    return (
        <html lang="id-ID" suppressHydrationWarning className="dark preload">
            <head>
                <link rel="icon" href="/favicon.ico" />
                <link rel="icon" type="image/png" sizes="32x32" href="/icon-32.png" />
                <link rel="icon" type="image/png" sizes="16x16" href="/icon-16.png" />
                <link rel="apple-touch-icon" sizes="192x192" href="/icon-192.png" />
                <link rel="alternate" type="application/rss+xml" title="JBook Blog RSS Feed" href="/feed.xml" />
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