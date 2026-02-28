"use client";

import { LogoText } from './Logo';
import { useTheme } from './ThemeProvider';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { Menu, X, Wrench, Package } from 'lucide-react';

export function NavBar() {
    const pathname = usePathname();
    const isProducer = pathname?.includes('/producer');
    const isTools = pathname?.startsWith('/tools');
    const { theme, toolsEnabled, dropogramEnabled } = useTheme();
    const [isAdmin, setIsAdmin] = useState(false);
    const [session, setSession] = useState<any>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        <nav className="glass-panel sticky top-4 mx-4 mt-4 rounded-2xl z-50 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex items-center">
                        <Link href={dropogramEnabled ? '/consumer' : '/tools'}>
                            <LogoText theme={theme} />
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-6">
                        <div className="flex items-center space-x-1 bg-gray-100/50 p-1 rounded-xl backdrop-blur-sm">
                            {dropogramEnabled && (
                                <>
                                    <Link href="/producer">
                                        <span className={`px-5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer inline-block ${isProducer ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                                            Drop Studio
                                        </span>
                                    </Link>
                                    <Link href="/consumer">
                                        <span className={`px-5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer inline-block ${!isProducer && !isTools ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                                            Shop
                                        </span>
                                    </Link>
                                </>
                            )}
                            {toolsEnabled && (
                                <>
                                    <Link href="/tools/dashboard">
                                        <span className={`px-5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${isTools && pathname?.includes('/dashboard') ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                                            <Wrench className="h-3.5 w-3.5" /> Lend
                                        </span>
                                    </Link>
                                    <Link href="/tools/search">
                                        <span className={`px-5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${isTools && !pathname?.includes('/dashboard') ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                                            <Package className="h-3.5 w-3.5" /> Rent
                                        </span>
                                    </Link>
                                </>
                            )}
                        </div>

                        {session ? (
                            <div className="flex items-center gap-4">
                                {isAdmin && (
                                    <Link href="/admin">
                                        <span className="text-sm font-bold text-purple-600 hover:text-purple-800 transition-colors cursor-pointer bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                                            Admin
                                        </span>
                                    </Link>
                                )}
                                {dropogramEnabled && (
                                    <Link href="/orders">
                                        <span className="text-sm font-bold text-gray-600 hover:text-primary transition-colors cursor-pointer">
                                            Orders
                                        </span>
                                    </Link>
                                )}
                                {toolsEnabled && (
                                    <Link href="/tools/rentals">
                                        <span className="text-sm font-bold text-gray-600 hover:text-primary transition-colors cursor-pointer">
                                            My Rentals
                                        </span>
                                    </Link>
                                )}
                                <Link href="/profile">
                                    <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-gray-500 text-sm font-bold bg-gray-100">
                                                {session.user.email?.[0].toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            </div>
                        ) : (
                            <Link href="/login">
                                <button className="text-sm font-bold text-white bg-primary hover:bg-primary-hover px-6 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95">
                                    Sign In
                                </button>
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex md:hidden items-center gap-4">
                        {session && (
                            <Link href="/profile">
                                <div className="h-9 w-9 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm cursor-pointer">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-gray-500 text-xs font-bold bg-gray-100">
                                            {session.user.email?.[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        )}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden border-t border-gray-100 p-4 space-y-4 animate-in slide-in-from-top-5 fade-in duration-200">
                    <div className="flex flex-col space-y-2 bg-gray-50 p-2 rounded-xl">
                        {dropogramEnabled && (
                            <>
                                <Link href="/producer" onClick={() => setIsMobileMenuOpen(false)}>
                                    <span className={`block px-4 py-3 rounded-lg text-sm font-bold transition-all cursor-pointer text-center ${isProducer ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                                        Drop Studio
                                    </span>
                                </Link>
                                <Link href="/consumer" onClick={() => setIsMobileMenuOpen(false)}>
                                    <span className={`block px-4 py-3 rounded-lg text-sm font-bold transition-all cursor-pointer text-center ${!isProducer && !isTools ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                                        Shop
                                    </span>
                                </Link>
                            </>
                        )}
                        {toolsEnabled && (
                            <>
                                <Link href="/tools/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                                    <span className={`flex items-center justify-center gap-1.5 px-4 py-3 rounded-lg text-sm font-bold transition-all cursor-pointer ${isTools && pathname?.includes('/dashboard') ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                                        <Wrench className="h-3.5 w-3.5" /> Lend Tools
                                    </span>
                                </Link>
                                <Link href="/tools/search" onClick={() => setIsMobileMenuOpen(false)}>
                                    <span className={`flex items-center justify-center gap-1.5 px-4 py-3 rounded-lg text-sm font-bold transition-all cursor-pointer ${isTools && !pathname?.includes('/dashboard') ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                                        <Package className="h-3.5 w-3.5" /> Rent Tools
                                    </span>
                                </Link>
                            </>
                        )}
                    </div>

                    {session ? (
                        <div className="space-y-2">
                            {isAdmin && (
                                <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                                    <span className="block w-full text-center px-4 py-3 rounded-xl text-sm font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors">
                                        Admin Dashboard
                                    </span>
                                </Link>
                            )}
                            {dropogramEnabled && (
                                <Link href="/orders" onClick={() => setIsMobileMenuOpen(false)}>
                                    <span className="block w-full text-center px-4 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors">
                                        My Orders
                                    </span>
                                </Link>
                            )}
                            {toolsEnabled && (
                                <Link href="/tools/rentals" onClick={() => setIsMobileMenuOpen(false)}>
                                    <span className="block w-full text-center px-4 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors">
                                        My Rentals
                                    </span>
                                </Link>
                            )}
                        </div>
                    ) : (
                        <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                            <button className="w-full text-center px-4 py-3 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary-hover shadow-sm transition-all">
                                Sign In
                            </button>
                        </Link>
                    )}
                </div>
            )}
        </nav>
    );
}
