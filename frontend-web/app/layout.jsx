import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

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

import { PracticeProvider } from "@/context/PracticeContext";

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 min-h-screen flex flex-col`}
            >
                <AuthProvider>
                    <PracticeProvider>
                        <Navbar />
                        <main className="flex-grow">
                            {children}
                        </main>
                        <footer className="bg-white border-t border-gray-200 mt-auto">
                            <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-500">
                                &copy; {new Date().getFullYear()} JBook. Belajar Bahasa Jepang.
                            </div>
                        </footer>
                    </PracticeProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
