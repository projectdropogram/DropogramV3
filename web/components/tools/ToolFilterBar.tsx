"use client";

import { ToolCategory, ToolCondition, TOOL_CATEGORIES, TOOL_CONDITIONS } from './types';

export interface ToolFilters {
    category: ToolCategory | null;
    condition: ToolCondition | null;
    priceMax: number | null;
    radius: number;
}

interface ToolFilterBarProps {
    filters: ToolFilters;
    onChange: (filters: ToolFilters) => void;
}

const RADIUS_OPTIONS = [
    { value: 8047, label: '5 mi' },
    { value: 16093, label: '10 mi' },
    { value: 40234, label: '25 mi' },
    { value: 80467, label: '50 mi' },
    { value: 999999999, label: 'Global' },
];

export function ToolFilterBar({ filters, onChange }: ToolFilterBarProps) {
    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {/* Category pills */}
            <button
                onClick={() => onChange({ ...filters, category: null })}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    filters.category === null
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
                All
            </button>
            {TOOL_CATEGORIES.map(c => (
                <button
                    key={c.value}
                    onClick={() => onChange({ ...filters, category: filters.category === c.value ? null : c.value })}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                        filters.category === c.value
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    {c.icon} {c.label}
                </button>
            ))}

            {/* Divider */}
            <div className="w-px h-6 bg-gray-200 shrink-0 mx-1" />

            {/* Condition pills */}
            {TOOL_CONDITIONS.map(c => (
                <button
                    key={c.value}
                    onClick={() => onChange({ ...filters, condition: filters.condition === c.value ? null : c.value })}
                    className={`px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                        filters.condition === c.value
                            ? 'bg-blue-500 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    {c.label}
                </button>
            ))}

            {/* Divider */}
            <div className="w-px h-6 bg-gray-200 shrink-0 mx-1" />

            {/* Radius selector */}
            <select
                value={filters.radius}
                onChange={(e) => onChange({ ...filters, radius: Number(e.target.value) })}
                className="px-3 py-2 rounded-full text-xs font-bold bg-gray-100 border-0 focus:ring-2 focus:ring-primary cursor-pointer"
            >
                {RADIUS_OPTIONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                ))}
            </select>

            {/* Price max */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1.5 shrink-0">
                <span className="text-xs text-gray-500">Max:</span>
                <span className="text-xs font-bold">$</span>
                <input
                    type="number"
                    placeholder="∞"
                    value={filters.priceMax ?? ''}
                    onChange={(e) => onChange({ ...filters, priceMax: e.target.value ? Number(e.target.value) : null })}
                    className="w-16 bg-transparent text-xs font-bold focus:outline-none"
                    min={0}
                />
                <span className="text-xs text-gray-400">/day</span>
            </div>
        </div>
    );
}
