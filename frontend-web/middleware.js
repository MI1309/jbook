import { NextResponse } from 'next/server';
import { BUNPO_ID_TO_SLUG } from './data/bunpoIdToSlug';
import { getMaintenanceHtml } from './lib/maintenanceHtml';

export function middleware(request) {
    const { pathname, searchParams } = request.nextUrl;

    const isMaintenanceMode =
        process.env.MAINTENANCE_MODE === 'true' ||
        process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';

    const bypassSecret = process.env.MAINTENANCE_BYPASS_TOKEN || 'jbook-admin';

    // 1. Handle Admin Bypass via Query Parameter (?bypass=secret or ?bypass=clear)
    const bypassParam = searchParams.get('bypass');
    if (bypassParam) {
        const cleanUrl = request.nextUrl.clone();
        cleanUrl.searchParams.delete('bypass');

        if (bypassParam === 'clear') {
            const res = NextResponse.redirect(cleanUrl);
            res.cookies.delete('jbook_maint_bypass');
            return res;
        }

        if (bypassParam === bypassSecret) {
            const res = NextResponse.redirect(cleanUrl);
            res.cookies.set('jbook_maint_bypass', bypassSecret, {
                path: '/',
                maxAge: 60 * 60 * 24, // 24 hours
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
            });
            return res;
        }
    }

    const hasBypassCookie =
        request.cookies.get('jbook_maint_bypass')?.value === bypassSecret;

    // 2. Intercept if Maintenance Mode is active and request is not bypassed
    if (isMaintenanceMode && !hasBypassCookie) {
        // Return JSON 503 for API routes
        if (pathname.startsWith('/api/')) {
            return NextResponse.json(
                {
                    error: 'Service Unavailable',
                    message: 'JBook API sedang dalam pemeliharaan berkala. Silakan coba kembali nanti.',
                },
                {
                    status: 503,
                    headers: {
                        'Retry-After': '1800',
                        'Cache-Control': 'no-store, max-age=0',
                    },
                }
            );
        }

        // Return HTML 503 for all regular page routes
        return new NextResponse(getMaintenanceHtml(1800), {
            status: 503,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Retry-After': '1800',
                'Cache-Control': 'no-store, max-age=0',
            },
        });
    }

    // 3. Normal Route Logic: Bunpo Legacy UUID Redirect
    if (pathname.startsWith('/bunpo/')) {
        const match = pathname.match(
            /^\/bunpo\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i
        );

        if (match) {
            const uuid = match[1].toLowerCase();
            const target = BUNPO_ID_TO_SLUG[uuid];
            const destination = target
                ? `/bunpo/${target.level}/${target.slug}`
                : '/bunpo';

            return NextResponse.redirect(new URL(destination, request.url), 301);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon)
         * - static assets (.svg, .png, .jpg, .ico, .txt, .xml, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)',
    ],
};
