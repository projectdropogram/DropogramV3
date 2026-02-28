"use client";

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { ToolSearchResult, ToolCategory } from '@/components/tools/types';
import { ToolSearchBar, ToolSearchParams } from '@/components/tools/ToolSearchBar';
import { ToolFilterBar, ToolFilters } from '@/components/tools/ToolFilterBar';
import { ToolCard } from '@/components/tools/ToolCard';
import dynamic from 'next/dynamic';
import { List, Map as MapIcon } from 'lucide-react';

const ToolMapView = dynamic(() => import('@/components/tools/ToolMapView'), { ssr: false });

export default function ToolSearchPage() {
    return (
        <Suspense fallback={<div className="text-center py-20 text-gray-400">Loading...</div>}>
            <SearchContent />
        </Suspense>
    );
}

function SearchContent() {
    const params = useSearchParams();

    const [items, setItems] = useState<ToolSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

    const [searchParams, setSearchParams] = useState<ToolSearchParams>({
        location: '',
        lat: 37.7749,
        lng: -122.4194,
        startDate: '',
        endDate: '',
        category: (params.get('category') as ToolCategory) || null,
        searchText: '',
    });

    const [filters, setFilters] = useState<ToolFilters>({
        category: (params.get('category') as ToolCategory) || null,
        condition: null,
        priceMax: null,
        radius: 25,
    });

    const doSearch = useCallback(async () => {
        setLoading(true);
        const radiusMiles = filters.radius ?? 25;
        const { data, error } = await supabase.rpc('find_nearby_tools', {
            lat: searchParams.lat ?? 37.7749,
            long: searchParams.lng ?? -122.4194,
            radius_meters: radiusMiles * 1609.34,
            category_filter: filters.category ?? searchParams.category ?? null,
            search_text: searchParams.searchText || null,
            start_at: searchParams.startDate || null,
            end_at: searchParams.endDate || null,
        });
        if (!error && data) {
            let results = data as ToolSearchResult[];
            if (filters.condition) results = results.filter(r => r.condition === filters.condition);
            if (filters.priceMax) results = results.filter(r => r.daily_rate_cents <= filters.priceMax! * 100);
            setItems(results);
        }
        setLoading(false);
    }, [searchParams, filters]);

    useEffect(() => { doSearch(); }, [doSearch]);

    const handleSearch = (p: ToolSearchParams) => {
        setSearchParams(p);
        if (p.category) setFilters(f => ({ ...f, category: p.category ?? null }));
    };

    const center: [number, number] = [searchParams.lat ?? 37.7749, searchParams.lng ?? -122.4194];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="sticky top-20 z-30 bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <ToolSearchBar onSearch={handleSearch} initialValues={searchParams} />
                </div>
                <div className="max-w-7xl mx-auto px-4 pb-3">
                    <ToolFilterBar filters={filters} onChange={setFilters} />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-4">
                {/* View toggle + result count */}
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-500">
                        {loading ? 'Searching...' : `${items.length} tool${items.length !== 1 ? 's' : ''} found`}
                    </p>
                    <div className="flex bg-gray-100 rounded-lg p-0.5">
                        <button onClick={() => setViewMode('list')}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                            <List className="h-3.5 w-3.5" /> List
                        </button>
                        <button onClick={() => setViewMode('map')}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${viewMode === 'map' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                            <MapIcon className="h-3.5 w-3.5" /> Map
                        </button>
                    </div>
                </div>

                {viewMode === 'list' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {items.map(item => (
                            <div key={item.id}
                                onMouseEnter={() => setHoveredItemId(item.id)}
                                onMouseLeave={() => setHoveredItemId(null)}>
                                <ToolCard item={item}
                                    startDate={searchParams.startDate}
                                    endDate={searchParams.endDate} />
                            </div>
                        ))}
                        {!loading && items.length === 0 && (
                            <div className="col-span-full text-center py-16 text-gray-400">
                                <p className="text-lg font-bold mb-1">No tools found</p>
                                <p className="text-sm">Try adjusting your search or filters</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-2 gap-4" style={{ height: 'calc(100vh - 220px)' }}>
                        <div className="h-full rounded-xl overflow-hidden">
                            <ToolMapView items={items} center={center}
                                hoveredItemId={hoveredItemId}
                                onPinClick={(id: string) => {
                                    const el = document.getElementById(`tool-${id}`);
                                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    setHoveredItemId(id);
                                }} />
                        </div>
                        <div className="overflow-y-auto space-y-3 pr-2">
                            {items.map(item => (
                                <div key={item.id} id={`tool-${item.id}`}
                                    onMouseEnter={() => setHoveredItemId(item.id)}
                                    onMouseLeave={() => setHoveredItemId(null)}>
                                    <ToolCard item={item}
                                        startDate={searchParams.startDate}
                                        endDate={searchParams.endDate} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
