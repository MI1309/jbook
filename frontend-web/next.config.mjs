import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
    dest: "public",
    cacheOnFrontEndNav: true,
    aggressiveFrontEndNavCaching: false, // ← ubah jadi false
    reloadOnOnline: true,
    swcMinify: true,
    disable: process.env.NODE_ENV === "development",
    workboxOptions: {
        disableDevLogs: true,
        runtimeCaching: [
            // Halaman navigasi — selalu ambil dari network dulu
            {
                urlPattern: ({ url, sameOrigin }) =>
                    sameOrigin && !url.pathname.startsWith("/api/"),
                handler: "NetworkFirst",
                options: {
                    cacheName: "pages",
                    networkTimeoutSeconds: 10,
                    expiration: {
                        maxEntries: 32,
                        maxAgeSeconds: 24 * 60 * 60,
                    },
                },
            },
            // API calls (same-origin) — NetworkFirst, cache sebagai fallback offline
            {
                urlPattern: ({ url, sameOrigin }) =>
                    sameOrigin && url.pathname.startsWith("/api/"),
                handler: "NetworkFirst",
                options: {
                    cacheName: "apis",
                    networkTimeoutSeconds: 10,
                    expiration: {
                        maxEntries: 64,
                        maxAgeSeconds: 7 * 24 * 60 * 60,
                    },
                },
            },
            // External API (PythonAnywhere backend) — cache data untuk offline
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
                        maxAgeSeconds: 7 * 24 * 60 * 60,
                    },
                },
            },
        ],
    },
});

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withPWA(nextConfig);