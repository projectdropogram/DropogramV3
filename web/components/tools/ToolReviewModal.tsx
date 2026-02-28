"use client";

import { useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { ToolRental, formatCents } from './types';
import { Star, X } from 'lucide-react';

interface ToolReviewModalProps {
    rental: ToolRental;
    isOpen: boolean;
    onClose: () => void;
}

export function ToolReviewModal({ rental, isOpen, onClose }: ToolReviewModalProps) {
    const [overallRating, setOverallRating] = useState(0);
    const [conditionRating, setConditionRating] = useState(0);
    const [communicationRating, setCommunicationRating] = useState(0);
    const [body, setBody] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const valid = overallRating > 0 && conditionRating > 0 && communicationRating > 0;

    const submit = async () => {
        if (!valid) return;
        setSubmitting(true);
        setError('');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setError('Not authenticated'); setSubmitting(false); return; }

        const { error: err } = await supabase.from('tools_reviews').insert({
            rental_id: rental.id,
            item_id: rental.item_id,
            author_id: user.id,
            subject_id: rental.lender_id,
            reviewer_role: 'renter' as const,
            overall_rating: overallRating,
            condition_rating: conditionRating,
            communication_rating: communicationRating,
            body: body.trim() || null,
        });

        if (err) {
            setError(err.message);
            setSubmitting(false);
        } else {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">Leave a Review</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        <X className="h-5 w-5 text-gray-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-5">
                    {/* Rental info */}
                    <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">
                        <p className="font-bold text-gray-900 mb-1">Rental #{rental.id.slice(0, 8)}</p>
                        <p>{new Date(rental.start_at).toLocaleDateString()} – {new Date(rental.end_at).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatCents(rental.total_cents)} total</p>
                    </div>

                    <RatingRow label="Overall Experience" value={overallRating} onChange={setOverallRating} />
                    <RatingRow label="Tool Condition" value={conditionRating} onChange={setConditionRating} />
                    <RatingRow label="Communication" value={communicationRating} onChange={setCommunicationRating} />

                    <div>
                        <label className="text-sm font-bold text-gray-700 block mb-1">Comments (optional)</label>
                        <textarea
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                            rows={3}
                            maxLength={1000}
                            placeholder="How was your experience?"
                            value={body}
                            onChange={e => setBody(e.target.value)}
                        />
                        <p className="text-xs text-gray-400 text-right">{body.length}/1000</p>
                    </div>

                    {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 flex gap-3">
                    <button onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={submit}
                        disabled={!valid || submitting}
                        className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-40 transition-colors">
                        {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function RatingRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
    return (
        <div>
            <label className="text-sm font-bold text-gray-700 block mb-1.5">{label}</label>
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                    <button key={i} onClick={() => onChange(i)} className="p-0.5">
                        <Star className={`h-7 w-7 transition-colors ${i <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                    </button>
                ))}
            </div>
        </div>
    );
}
