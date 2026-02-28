"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { LenderDashboard } from '@/components/tools/LenderDashboard';
import { ToolListingForm } from '@/components/tools/ToolListingForm';
import { LayoutGrid, Plus, X } from 'lucide-react';

export default function ToolDashboardPage() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setUserId(user.id);

            // Ensure lender profile exists (upsert)
            await supabase.from('tools_lender_profiles').upsert({
                user_id: user.id,
                is_lender: true,
            }, { onConflict: 'user_id' });

            setLoading(false);
        })();
    }, [router]);

    if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;
    if (!userId) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <LayoutGrid className="h-6 w-6 text-primary" />
                        <h1 className="text-xl font-extrabold text-gray-900">Lender Dashboard</h1>
                    </div>
                    <button onClick={() => setShowForm(!showForm)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                            showForm
                                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                : 'bg-primary text-white hover:bg-primary/90'
                        }`}>
                        {showForm ? <><X className="h-4 w-4" /> Close</> : <><Plus className="h-4 w-4" /> List a Tool</>}
                    </button>
                </div>

                {/* Listing form (expandable) */}
                {showForm && (
                    <div className="mb-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <ToolListingForm
                            onSuccess={() => {
                                setShowForm(false);
                                // Dashboard will auto-refresh via realtime
                            }}
                        />
                    </div>
                )}

                {/* Rental management */}
                <LenderDashboard lenderId={userId} />
            </div>
        </div>
    );
}
