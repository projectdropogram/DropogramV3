"use client";

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { ToolItem, ToolRental, formatCents } from '@/components/tools/types';
import { Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ToolCheckoutPage() {
    return (
        <Suspense fallback={<div className="text-center py-20 text-gray-400">Loading...</div>}>
            <CheckoutContent />
        </Suspense>
    );
}

function CheckoutContent() {
    const router = useRouter();
    const params = useSearchParams();
    const rentalId = params.get('rental_id');

    const [rental, setRental] = useState<ToolRental | null>(null);
    const [item, setItem] = useState<ToolItem | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!rentalId) { setLoading(false); return; }
        (async () => {
            const { data: r } = await supabase
                .from('tools_rentals')
                .select('*')
                .eq('id', rentalId)
                .single();
            if (r) {
                setRental(r as ToolRental);
                const { data: i } = await supabase
                    .from('tools_items')
                    .select('*')
                    .eq('id', r.item_id)
                    .single();
                if (i) setItem(i as ToolItem);
            }
            setLoading(false);
        })();
    }, [rentalId]);

    if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

    if (!rental || !item) return (
        <div className="text-center py-20">
            <p className="text-lg font-bold text-gray-900 mb-2">Booking not found</p>
            <Link href="/tools/search" className="text-sm text-primary hover:underline">Browse tools</Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
            <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <Check className="h-7 w-7 text-green-600" />
                </div>
                <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Rental Requested!</h1>
                <p className="text-sm text-gray-500 mb-6">
                    Your request has been sent to the tool owner. You'll be notified once they respond.
                </p>

                <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 mb-6">
                    <div className="flex items-center gap-3">
                        {item.images?.[0] && (
                            <img src={item.images[0]} alt="" className="w-14 h-14 rounded-lg object-cover" />
                        )}
                        <div>
                            <p className="text-sm font-bold text-gray-900">{item.title}</p>
                            <p className="text-xs text-gray-400">{item.category}</p>
                        </div>
                    </div>
                    <div className="border-t border-gray-200 pt-2 text-sm text-gray-600 space-y-1">
                        <div className="flex justify-between">
                            <span>Dates</span>
                            <span className="font-bold">{new Date(rental.start_at).toLocaleDateString()} – {new Date(rental.end_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Total</span>
                            <span className="font-bold text-gray-900">{formatCents(rental.total_cents)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Status</span>
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">Pending</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <Link href="/tools/rentals"
                        className="w-full py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">
                        View My Rentals
                    </Link>
                    <Link href="/tools/search"
                        className="w-full py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                        Browse More Tools
                    </Link>
                </div>
            </div>
        </div>
    );
}
