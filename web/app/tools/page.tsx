"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { ToolSearchResult, TOOL_CATEGORIES } from '@/components/tools/types';
import { ToolCard } from '@/components/tools/ToolCard';
import { Search, MapPin, Wrench, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ToolsLandingPage() {
    const [featured, setFeatured] = useState<ToolSearchResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            // Fetch a few featured tools (newest first)
            const { data } = await supabase
                .from('tools_items')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(8);
            if (data) {
                setFeatured(data.map(item => ({
                    ...item,
                    distance_mi: null,
                    avg_rating: null,
                    review_count: 0,
                })) as any);
            }
            setLoading(false);
        })();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero */}
            <section className="relative bg-gradient-to-br from-primary to-primary/80 text-white">
                <div className="max-w-5xl mx-auto px-4 py-16 md:py-24">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                        Rent tools from people nearby
                    </h1>
                    <p className="text-lg text-white/80 mb-8 max-w-xl">
                        Why buy when you can borrow? Find drills, saws, ladders, and more from trusted neighbors — at a fraction of the cost.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <Link href="/tools/search"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary font-bold rounded-xl hover:bg-gray-100 transition-colors">
                            <Search className="h-5 w-5" /> Browse Tools
                        </Link>
                        <Link href="/tools/dashboard"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors border border-white/20">
                            <Wrench className="h-5 w-5" /> List Your Tools
                        </Link>
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="max-w-5xl mx-auto px-4 py-12">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Browse by Category</h2>
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-3">
                    {TOOL_CATEGORIES.map(cat => (
                        <Link key={cat.value} href={`/tools/search?category=${cat.value}`}
                            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md hover:border-primary/30 transition-all text-center group">
                            <span className="text-2xl">{cat.icon}</span>
                            <span className="text-xs font-bold text-gray-600 group-hover:text-primary">{cat.label}</span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* How It Works */}
            <section className="max-w-5xl mx-auto px-4 py-12">
                <h2 className="text-xl font-bold text-gray-900 mb-6">How It Works</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    {[
                        { icon: <Search className="h-8 w-8 text-primary" />, title: 'Find a Tool', desc: 'Search by category, location, or keyword to find the perfect tool near you.' },
                        { icon: <MapPin className="h-8 w-8 text-primary" />, title: 'Book & Pick Up', desc: 'Choose dates, request a rental, and coordinate pickup with the owner.' },
                        { icon: <Wrench className="h-8 w-8 text-primary" />, title: 'Use & Return', desc: 'Complete your project, return the tool, and leave a review.' },
                    ].map((step, i) => (
                        <div key={i} className="bg-white p-6 rounded-xl border border-gray-100">
                            <div className="mb-3">{step.icon}</div>
                            <h3 className="font-bold text-gray-900 mb-1">{step.title}</h3>
                            <p className="text-sm text-gray-500">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Featured Listings */}
            {featured.length > 0 && (
                <section className="max-w-5xl mx-auto px-4 py-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Recently Listed</h2>
                        <Link href="/tools/search" className="text-sm font-bold text-primary flex items-center gap-1 hover:underline">
                            View All <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {featured.map(item => <ToolCard key={item.id} item={item} />)}
                    </div>
                </section>
            )}

            {loading && <div className="text-center py-8 text-gray-400">Loading...</div>}
        </div>
    );
}
