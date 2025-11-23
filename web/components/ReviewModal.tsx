"use client";

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Star, X } from 'lucide-react';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ReviewModalProps {
    orderId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export function ReviewModal({ orderId, onClose, onSuccess }: ReviewModalProps) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        setSubmitting(true);
        const { error } = await supabase.from('reviews').insert({
            order_id: orderId,
            rating,
            comment
        });

        if (error) {
            alert("Failed to submit review: " + error.message);
            setSubmitting(false);
        } else {
            alert("Review submitted! ⭐");
            onSuccess();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900">Rate your Order</h3>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>

                    <div className="flex justify-center gap-2 mb-6">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => setRating(star)}
                                className="transition-transform hover:scale-110 focus:outline-none"
                            >
                                <Star
                                    className={`h-10 w-10 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                />
                            </button>
                        ))}
                    </div>

                    <textarea
                        className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary mb-6 resize-none"
                        rows={3}
                        placeholder="How was the food? (Optional)"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />

                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-primary-hover transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
                    >
                        {submitting ? "Submitting..." : "Submit Review"}
                    </button>
                </div>
            </div>
        </div>
    );
}
