import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
    dest: "public",
    cacheOnFrontEndNav: true,
    aggressiveFrontEndNavCaching: false,
    reloadOnOnline: true,
    swcMinify: true,
    disable: process.env.NODE_ENV === "development",
    fallbacks: {
        document: "/offline", // Fallback ke /offline jika navigasi gagal saat offline
    },
    workboxOptions: {
        disableDevLogs: true,
        runtimeCaching: [
            // Blog — Selalu Online (NetworkOnly atau NetworkFirst dengan timeout cepat & tanpa cache panjang)
            {
                urlPattern: ({ url }) => url.pathname.startsWith("/blog"),
                handler: "NetworkFirst",
                options: {
                    cacheName: "blog-online-only",
                    networkTimeoutSeconds: 3,
                    expiration: {
                        maxEntries: 10,
                        maxAgeSeconds: 60, // Hanya 1 menit
                    },
                },
            },
            // Halaman penting aplikasi — Selalu sedia offline (NetworkFirst)
            {
                urlPattern: ({ url }) => 
                    ['/dashboard', '/practice', '/tts', '/kanji', '/bunpo', '/kana', '/kotoba'].some(path => url.pathname === path || url.pathname.startsWith(path + '/')),
                handler: "NetworkFirst",
                options: {
                    cacheName: "app-core-pages",
                    networkTimeoutSeconds: 5, // Timeout lebih cepat untuk transisi offline yang mulus
                    expiration: {
                        maxEntries: 50,
                        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 hari
                    },
                },
            },
            // Halaman navigasi umum — NetworkFirst, cache 30 hari
            {
                urlPattern: ({ url }) => !url.pathname.startsWith("/api/") && !url.pathname.startsWith("/blog"),
                handler: "NetworkFirst",
                options: {
                    cacheName: "pages",
                    networkTimeoutSeconds: 10,
                    expiration: {
                        maxEntries: 32,
                        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 hari
                    },
                },
            },
            // API calls (same-origin)
            {
                urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
                handler: "NetworkFirst",
                options: {
                    cacheName: "apis",
                    networkTimeoutSeconds: 10,
                    expiration: {
                        maxEntries: 64,
                        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 hari
                    },
                },
            },
            // External API (PythonAnywhere backend)
            {
                urlPattern: ({ url }) =>
                    url.hostname === "imronm.pythonanywhere.com" &&
                    url.pathname.startsWith("/api/"),
                handler: "NetworkFirst",
                options: {
                    cacheName: "backend-api",
                    networkTimeoutSeconds: 10,
                    expiration: {
                        maxEntries: 128,
                        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 hari
                    },
                },
            },
        ],
    },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    turbopack: {},
};

export default withPWA(nextConfig);