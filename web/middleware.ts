import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const TOOLS_ROUTES = ['/tools'];
const DROPOGRAM_ROUTES = ['/consumer', '/producer', '/orders'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const isToolsRoute = TOOLS_ROUTES.some(r => pathname.startsWith(r));
    const isDropogramRoute = DROPOGRAM_ROUTES.some(r => pathname.startsWith(r));

    if (!isToolsRoute && !isDropogramRoute) {
        return NextResponse.next();
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data } = await supabase
        .from('app_settings')
        .select('tools_enabled, dropogram_enabled')
        .eq('id', 'global')
        .single();

    const toolsEnabled = data?.tools_enabled ?? false;
    const dropogramEnabled = data?.dropogram_enabled ?? true;

    if (isToolsRoute && !toolsEnabled) {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
    }

    if (isDropogramRoute && !dropogramEnabled) {
        const url = request.nextUrl.clone();
        url.pathname = '/tools';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/tools/:path*',
        '/consumer/:path*',
        '/consumer',
        '/producer/:path*',
        '/producer',
        '/orders/:path*',
        '/orders',
    ],
};
