import path from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = path.dirname(fileURLToPath(import.meta.url));

const productionSecurityHeaders = [
    { key: "X-Frame-Options", value: "SAMEORIGIN" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=()",
    },
    { key: "X-XSS-Protection", value: "1; mode=block" },
    {
        key: "Content-Security-Policy",
        value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: blob: https:",
            "font-src 'self' data: https://fonts.gstatic.com",
            "connect-src 'self' ws: wss: https:",
            "media-src 'self' blob: https:",
            "frame-ancestors 'self'",
            "form-action 'self'",
            "base-uri 'self'",
        ].join("; "),
    },
    {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
    },
];

const developmentSecurityHeaders = productionSecurityHeaders
    .filter(header => header.key !== "Strict-Transport-Security")
    .map(header => header.key === "Content-Security-Policy"
        ? {
            ...header,
            value: header.value.replace(
                "connect-src 'self' ws: wss: https:",
                "connect-src 'self' ws: wss: http://localhost:8000 http://127.0.0.1:8000 https:",
            ),
        }
        : header);

/** @type {import('next').NextConfig} */
const nextConfig = {
    outputFileTracingRoot: appDirectory,
    turbopack: {},
    async redirects() {
        return [
            {
                source: "/blog/:path*",
                destination: "/",
                permanent: false,
            },
        ];
    },
    async rewrites() {
        if (process.env.NODE_ENV !== "development") return [];
        const apiTarget = process.env.API_PROXY_TARGET || "https://japan.pythonanywhere.com/api";
        return [
            {
                source: "/backend-api/:path*",
                destination: `${apiTarget}/:path*`,
            },
        ];
    },
    async headers() {
        return [
            {
                source: "/:path*",
                headers: process.env.NODE_ENV === "production"
                    ? productionSecurityHeaders
                    : developmentSecurityHeaders,
            },
        ];
    },
};

export default nextConfig;