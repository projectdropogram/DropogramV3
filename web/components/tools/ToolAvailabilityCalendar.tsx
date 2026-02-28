"use client";

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/utils/supabase/client';

interface ToolAvailabilityCalendarProps {
    itemId: string;
}

interface Block {
    start_at: string;
    end_at: string;
    type: string;
}

export function ToolAvailabilityCalendar({ itemId }: ToolAvailabilityCalendarProps) {
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });

    useEffect(() => {
        const fetchBlocks = async () => {
            const start = new Date(currentMonth);
            start.setDate(1);
            const end = new Date(currentMonth);
            end.setMonth(end.getMonth() + 1);
            end.setDate(0);

            const { data } = await supabase
                .from('tools_availability_blocks')
                .select('start_at, end_at, type')
                .eq('item_id', itemId)
                .gte('end_at', start.toISOString())
                .lte('start_at', end.toISOString());
            if (data) setBlocks(data);
        };
        fetchBlocks();
    }, [itemId, currentMonth]);

    const blockedDates = useMemo(() => {
        const set = new Set<string>();
        blocks.forEach(b => {
            const start = new Date(b.start_at);
            const end = new Date(b.end_at);
            const d = new Date(start);
            while (d < end) {
                set.add(d.toISOString().split('T')[0]);
                d.setDate(d.getDate() + 1);
            }
        });
        return set;
    }, [blocks]);

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    const today = new Date().toISOString().split('T')[0];

    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

    const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <button onClick={prevMonth} className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">←</button>
                <span className="text-sm font-bold text-gray-900">{monthLabel}</span>
                <button onClick={nextMonth} className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">→</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <div key={d} className="text-xs font-medium text-gray-400 py-1">{d}</div>
                ))}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isBlocked = blockedDates.has(dateStr);
                    const isPast = dateStr < today;
                    return (
                        <div key={day}
                            className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                isBlocked ? 'bg-red-100 text-red-400 line-through' :
                                isPast ? 'text-gray-300' :
                                'text-gray-700 bg-green-50'
                            }`}>
                            {day}
                        </div>
                    );
                })}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-50 border border-green-200" /> Available</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-100 border border-red-200" /> Booked</div>
            </div>
        </div>
    );
}
