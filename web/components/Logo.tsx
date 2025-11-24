
import React from 'react';
import Image from 'next/image';

export const Logo = ({ className = "h-[100px] w-auto" }: { className?: string }) => {
    return (
        <div className={`relative ${className} `}>
            <Image
                src="/logo.png"
                alt="Dropogram Logo"
                width={375}
                height={125}
                className="object-contain h-full w-auto"
                priority
            />
        </div>
    );
};

export const LogoText = ({ theme }: { theme?: 'original' | 'martha' }) => {
    if (theme === 'original') {
        return (
            <div className="h-[100px] flex items-center px-2">
                <span className="text-4xl font-bold text-[var(--color-primary)] tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                    Dropogram
                </span>
            </div>
        );
    }

    return (
        <div className="h-[100px] w-auto relative">
            <Image
                src="/logo.png"
                alt="Dropogram Logo"
                width={375}
                height={125}
                className="object-contain h-full w-auto"
                priority
            />
        </div>
    );
};

