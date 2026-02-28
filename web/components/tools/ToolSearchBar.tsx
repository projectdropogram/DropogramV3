"use client";

import { useState } from 'react';
import { Search, MapPin, Calendar, Crosshair } from 'lucide-react';
import { ToolCategory, TOOL_CATEGORIES } from './types';

export interface ToolSearchParams {
    location: string;
    lat: number | null;
    lng: number | null;
    startDate: string;
    endDate: string;
    category: ToolCategory | null;
    searchText: string;
}

interface ToolSearchBarProps {
    initialValues?: Partial<ToolSearchParams>;
    onSearch: (params: ToolSearchParams) => void;
    loading?: boolean;
}

export function ToolSearchBar({ initialValues, onSearch, loading }: ToolSearchBarProps) {
    const [location, setLocation] = useState(initialValues?.location ?? '');
    const [lat, setLat] = useState<number | null>(initialValues?.lat ?? null);
    const [lng, setLng] = useState<number | null>(initialValues?.lng ?? null);
    const [startDate, setStartDate] = useState(initialValues?.startDate ?? '');
    const [endDate, setEndDate] = useState(initialValues?.endDate ?? '');
    const [category, setCategory] = useState<ToolCategory | null>(initialValues?.category ?? null);
    const [searchText, setSearchText] = useState(initialValues?.searchText ?? '');
    const [locating, setLocating] = useState(false);

    const today = new Date().toISOString().split('T')[0];

    const handleGeolocate = () => {
        if (!navigator.geolocation) return;
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLat(pos.coords.latitude);
                setLng(pos.coords.longitude);
                setLocation('Current Location');
                setLocating(false);
            },
            () => {
                setLocating(false);
                alert('Could not get your location. Please enter it manually.');
            },
            { timeout: 10000 }
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Default fallback to San Francisco if no location
        const finalLat = lat ?? 37.7749;
        const finalLng = lng ?? -122.4194;
        onSearch({
            location: location || 'San Francisco, CA',
            lat: finalLat,
            lng: finalLng,
            startDate,
            endDate,
            category,
            searchText,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <div className="glass-panel rounded-2xl p-4 shadow-lg">
                {/* Top row: location + search text */}
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="City or address"
                            value={location}
                            onChange={(e) => { setLocation(e.target.value); setLat(null); setLng(null); }}
                            className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50"
                        />
                        <button
                            type="button"
                            onClick={handleGeolocate}
                            disabled={locating}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                            title="Use my location"
                        >
                            <Crosshair className={`h-4 w-4 ${locating ? 'animate-spin text-primary' : 'text-gray-400'}`} />
                        </button>
                    </div>

                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search tools (e.g. drill, saw, pressure washer)"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50"
                        />
                    </div>
                </div>

                {/* Second row: dates + category + submit */}
                <div className="flex flex-col md:flex-row gap-3 mt-3">
                    <div className="relative flex-1">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="date"
                            value={startDate}
                            min={today}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50"
                        />
                    </div>
                    <div className="relative flex-1">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="date"
                            value={endDate}
                            min={startDate || today}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50"
                        />
                    </div>
                    <select
                        value={category ?? ''}
                        onChange={(e) => setCategory(e.target.value ? e.target.value as ToolCategory : null)}
                        className="py-3 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50 min-w-[160px]"
                    >
                        <option value="">All Categories</option>
                        {TOOL_CATEGORIES.map(c => (
                            <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                        ))}
                    </select>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50 whitespace-nowrap"
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </div>
        </form>
    );
}
