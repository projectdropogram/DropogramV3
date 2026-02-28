"use client";

import { useState, useEffect, useCallback } from 'react';
import { Calendar, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { ToolItem, PricingQuote, formatCents } from './types';

interface ToolBookingSidebarProps {
    item: ToolItem;
}

export function ToolBookingSidebar({ item }: ToolBookingSidebarProps) {
    const router = useRouter();
    const [session, setSession] = useState<any>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [pickupNotes, setPickupNotes] = useState('');
    const [quote, setQuote] = useState<PricingQuote | null>(null);
    const [quoteLoading, setQuoteLoading] = useState(false);
    const [quoteError, setQuoteError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session));
        return () => subscription.unsubscribe();
    }, []);

    const fetchQuote = useCallback(async () => {
        if (!startDate || !endDate) return;
        setQuoteLoading(true);
        setQuoteError('');
        setQuote(null);

        const startAt = new Date(startDate + 'T10:00:00').toISOString();
        const endAt = new Date(endDate + 'T10:00:00').toISOString();

        const { data, error } = await supabase.rpc('get_pricing_quote', {
            p_item_id: item.id,
            p_start_at: startAt,
            p_end_at: endAt,
        });

        if (error) {
            setQuoteError(error.message);
        } else {
            setQuote(data as PricingQuote);
        }
        setQuoteLoading(false);
    }, [startDate, endDate, item.id]);

    useEffect(() => {
        const timer = setTimeout(fetchQuote, 500);
        return () => clearTimeout(timer);
    }, [fetchQuote]);

    const handleSubmit = async () => {
        if (!session) {
            router.push(`/login?redirect=/tools/item/${item.id}`);
            return;
        }

        setSubmitting(true);
        setSubmitError('');

        const startAt = new Date(startDate + 'T10:00:00').toISOString();
        const endAt = new Date(endDate + 'T10:00:00').toISOString();

        const { data, error } = await supabase.rpc('create_tool_rental', {
            p_item_id: item.id,
            p_start_at: startAt,
            p_end_at: endAt,
            p_pickup_notes: pickupNotes || null,
        });

        if (error) {
            setSubmitError(error.message);
        } else {
            setSubmitSuccess(true);
            setTimeout(() => router.push('/tools/rentals'), 2000);
        }
        setSubmitting(false);
    };

    if (submitSuccess) {
        return (
            <div className="glass-panel rounded-2xl p-6 text-center space-y-3">
                <div className="text-4xl">🎉</div>
                <h3 className="text-lg font-bold text-gray-900">Rental Requested!</h3>
                <p className="text-sm text-gray-500">The lender will review your request. Redirecting to your rentals...</p>
            </div>
        );
    }

    return (
        <div className="glass-panel rounded-2xl p-6 space-y-4 sticky top-24">
            {/* Price header */}
            <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">{formatCents(item.daily_rate_cents)}</span>
                <span className="text-sm text-gray-500">/ day</span>
            </div>

            {/* Date pickers */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Start</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input type="date" value={startDate} min={today} onChange={e => setStartDate(e.target.value)}
                            className="w-full pl-9 pr-2 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-gray-50" />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">End</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input type="date" value={endDate} min={startDate || today} onChange={e => setEndDate(e.target.value)}
                            className="w-full pl-9 pr-2 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-gray-50" />
                    </div>
                </div>
            </div>

            {/* Pickup notes */}
            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Pickup Notes (optional)</label>
                <textarea value={pickupNotes} onChange={e => setPickupNotes(e.target.value)}
                    placeholder="Preferred pickup time, any questions..."
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-gray-50 resize-none" />
            </div>

            {/* Quote */}
            {quoteLoading && (
                <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
            )}
            {quoteError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs">{quoteError}</div>
            )}
            {quote && (
                <div className="space-y-2 border-t border-gray-100 pt-4">
                    {quote.line_items.map((li, i) => (
                        <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-500">{li.label}</span>
                            <span className="font-medium">{formatCents(li.amount_cents)}</span>
                        </div>
                    ))}
                    <div className="flex justify-between text-sm font-bold border-t border-gray-100 pt-2">
                        <span>Total</span>
                        <span>{formatCents(quote.total_cents)}</span>
                    </div>
                </div>
            )}

            {submitError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs">{submitError}</div>
            )}

            <button
                onClick={handleSubmit}
                disabled={!startDate || !endDate || !quote || quoteLoading || submitting}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {submitting ? 'Submitting...' : session ? 'Request Rental' : 'Sign In to Rent'}
            </button>

            <p className="text-xs text-center text-gray-400">You won't be charged yet. The lender will review your request.</p>
        </div>
    );
}
