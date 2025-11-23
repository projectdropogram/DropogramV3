"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function NavBar() {
    const pathname = usePathname();
    const isProducer = pathname?.includes('/producer');
    const [isAdmin, setIsAdmin] = useState(false);
    const [session, setSession] = useState<any>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                fetchProfile(session.user.id);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setAvatarUrl(null);
                setIsAdmin(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string) => {
        const { data } = await supabase.from('profiles').select('avatar_url, is_admin').eq('id', userId).single();
        if (data) {
            setAvatarUrl(data.avatar_url);
            setIsAdmin(data.is_admin || false);
        }
    };

    return (
        <nav className="border-b border-gray-100 sticky top-0 bg-white z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/consumer">
                            <h1 className="text-2xl font-extrabold text-primary tracking-tight cursor-pointer">
                                Dropogram
                            </h1>
                        </Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
                            <Link href="/producer">
                                <span className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all cursor-pointer inline-block ${isProducer ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                                    Drop Studio
                                </span>
                            </Link>
                            <Link href="/consumer">
                                <span className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all cursor-pointer inline-block ${!isProducer ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                                    Consumer
                                </span>
                            </Link>
                        </div>

                        {session ? (
                            <>
                                {isAdmin && (
                                    <Link href="/admin">
                                        <span className="text-sm font-bold text-purple-600 hover:text-purple-800 transition-colors cursor-pointer mr-2">
                                            Admin
                                        </span>
                                    </Link>
                                )}
                                <Link href="/orders">
                                    <span className="text-sm font-bold text-gray-500 hover:text-primary transition-colors cursor-pointer mr-2">
                                        Orders
                                    </span>
                                </Link>
                                <Link href="/profile">
                                    <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden border border-gray-300 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-gray-500 text-xs font-bold">
                                                {session.user.email?.[0].toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            </>
                        ) : (
                            <Link href="/login">
                                <button className="text-sm font-bold text-gray-700 hover:text-primary transition-colors">
                                    Sign In
                                </button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
