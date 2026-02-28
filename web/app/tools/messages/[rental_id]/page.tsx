"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { ToolMessenger } from '@/components/tools/ToolMessenger';

export default function ToolMessagesPage() {
    const { rental_id } = useParams<{ rental_id: string }>();
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/login'); return; }

            // Verify the user is a participant in this rental
            const { data: rental } = await supabase
                .from('tools_rentals')
                .select('renter_id, lender_id')
                .eq('id', rental_id)
                .single();

            if (!rental || (rental.renter_id !== user.id && rental.lender_id !== user.id)) {
                router.push('/tools/rentals');
                return;
            }

            setUserId(user.id);
            setLoading(false);
        })();
    }, [rental_id, router]);

    if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;
    if (!userId) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto px-4 py-6">
                <ToolMessenger rentalId={rental_id} currentUserId={userId} />
            </div>
        </div>
    );
}
