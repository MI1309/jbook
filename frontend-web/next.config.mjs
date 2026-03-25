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
            // API calls — NetworkOnly, jangan di-cache
            {
                urlPattern: ({ url, sameOrigin }) =>
                    sameOrigin && url.pathname.startsWith("/api/"),
                handler: "NetworkOnly", // ← API tidak di-cache sama sekali
                options: {
                    cacheName: "apis",
                },
            },
        ],
    },
});

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withPWA(nextConfig);