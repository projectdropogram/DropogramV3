"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { ToolItem } from '@/components/tools/types';
import { ToolDetailView } from '@/components/tools/ToolDetailView';
import { ToolBookingSidebar } from '@/components/tools/ToolBookingSidebar';
import { ToolAvailabilityCalendar } from '@/components/tools/ToolAvailabilityCalendar';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ToolItemPage() {
    const { id } = useParams<{ id: string }>();
    const [item, setItem] = useState<ToolItem | null>(null);
    const [lenderName, setLenderName] = useState<string | null>(null);
    const [lenderAvatar, setLenderAvatar] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        (async () => {
            const { data } = await supabase
                .from('tools_items')
                .select('*')
                .eq('id', id)
                .single();
            if (data) {
                setItem(data as ToolItem);
                // Fetch lender's display info from profiles table
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, avatar_url')
                    .eq('id', data.lender_id)
                    .single();
                if (profile) {
                    setLenderName(profile.full_name);
                    setLenderAvatar(profile.avatar_url);
                }
            }
            setLoading(false);
        })();
    }, [id]);

    if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;
    if (!item) return (
        <div className="text-center py-20">
            <p className="text-lg font-bold text-gray-900 mb-2">Tool not found</p>
            <Link href="/tools/search" className="text-sm text-primary hover:underline">Back to search</Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-6">
                <Link href="/tools/search" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
                    <ArrowLeft className="h-4 w-4" /> Back to search
                </Link>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Detail (left 2 cols) */}
                    <div className="lg:col-span-2 space-y-8">
                        <ToolDetailView item={item} lenderName={lenderName} lenderAvatar={lenderAvatar} />
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Availability</h3>
                            <ToolAvailabilityCalendar itemId={item.id} />
                        </div>
                    </div>

                    {/* Booking sidebar (right col) */}
                    <div>
                        <ToolBookingSidebar item={item} />
                    </div>
                </div>
            </div>
        </div>
    );
}
