import { NextResponse } from 'next/server';
import { BUNPO_ID_TO_SLUG } from './data/bunpoIdToSlug';

export function middleware(request) {
    const { pathname } = request.nextUrl;
    const match = pathname.match(
        /^\/bunpo\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i
    );

    if (!match) return NextResponse.next();

    const uuid = match[1].toLowerCase();
    const target = BUNPO_ID_TO_SLUG[uuid];
    const destination = target
        ? `/bunpo/${target.level}/${target.slug}`
        : '/bunpo';

    return NextResponse.redirect(new URL(destination, request.url), 301);
}

export const config = {
    matcher: ['/bunpo/:path*'],
};