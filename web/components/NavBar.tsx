"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavBar() {
    const pathname = usePathname();
    const isProducer = pathname?.includes('/producer');

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
                </div>
            </div>
        </nav>
    );
}
