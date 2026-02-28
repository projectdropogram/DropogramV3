"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { RenterRentals } from '@/components/tools/RenterRentals';
import { Package } from 'lucide-react';

export default function ToolRentalsPage() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/login'); return; }
            setUserId(user.id);
            setLoading(false);
        })();
    }, [router]);

    if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;
    if (!userId) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-3xl mx-auto px-4 py-6">
                <div className="flex items-center gap-3 mb-6">
                    <Package className="h-6 w-6 text-primary" />
                    <h1 className="text-xl font-extrabold text-gray-900">My Rentals</h1>
                </div>
                <RenterRentals renterId={userId} />
            </div>
        </div>
    );
}
