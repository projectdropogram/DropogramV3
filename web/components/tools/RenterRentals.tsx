"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { ToolRental, formatCents } from './types';
import { Clock, Check, XCircle, AlertTriangle, MessageSquare, Star } from 'lucide-react';
import Link from 'next/link';
import { ToolReviewModal } from './ToolReviewModal';

interface RenterRentalsProps {
    renterId: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="h-3.5 w-3.5" /> },
    approved: { label: 'Approved', color: 'bg-blue-100 text-blue-700', icon: <Check className="h-3.5 w-3.5" /> },
    active: { label: 'Active', color: 'bg-green-100 text-green-700', icon: <Check className="h-3.5 w-3.5" /> },
    completed: { label: 'Completed', color: 'bg-gray-100 text-gray-700', icon: <Check className="h-3.5 w-3.5" /> },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-600', icon: <XCircle className="h-3.5 w-3.5" /> },
    disputed: { label: 'Disputed', color: 'bg-orange-100 text-orange-700', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
};

export function RenterRentals({ renterId }: RenterRentalsProps) {
    const [rentals, setRentals] = useState<ToolRental[]>([]);
    const [loading, setLoading] = useState(true);
    const [reviewRental, setReviewRental] = useState<ToolRental | null>(null);
    const [reviewedRentals, setReviewedRentals] = useState<Set<string>>(new Set());
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

    const fetchRentals = async () => {
        const { data } = await supabase
            .from('tools_rentals')
            .select('*, tools_items(title, images)')
            .eq('renter_id', renterId)
            .order('created_at', { ascending: false });
        if (data) setRentals(data as any);
        setLoading(false);
    };

    const fetchReviewed = async () => {
        const { data } = await supabase
            .from('tools_reviews')
            .select('rental_id')
            .eq('author_id', renterId);
        if (data) setReviewedRentals(new Set(data.map(r => r.rental_id)));
    };

    const fetchUnreadCounts = async () => {
        const { data } = await supabase
            .from('tools_messages')
            .select('rental_id')
            .neq('sender_id', renterId)
            .is('read_at', null);
        if (data) {
            const counts: Record<string, number> = {};
            data.forEach(m => { counts[m.rental_id] = (counts[m.rental_id] || 0) + 1; });
            setUnreadCounts(counts);
        }
    };

    useEffect(() => {
        fetchRentals();
        fetchReviewed();
        fetchUnreadCounts();
        const interval = setInterval(() => { fetchRentals(); fetchUnreadCounts(); }, 10000);
        return () => clearInterval(interval);
    }, [renterId]);

    const cancelRental = async (rentalId: string) => {
        await supabase
            .from('tools_rentals')
            .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString(),
                cancelled_by: renterId,
                cancellation_reason: 'Cancelled by renter',
                updated_at: new Date().toISOString(),
            })
            .eq('id', rentalId);
        await supabase.from('tools_availability_blocks').delete().eq('rental_id', rentalId);
        fetchRentals();
    };

    if (loading) return <div className="text-center py-10 text-gray-400">Loading rentals...</div>;

    const activeRentals = rentals.filter(r => ['pending', 'approved', 'active'].includes(r.status));
    const pastRentals = rentals.filter(r => ['completed', 'cancelled', 'disputed'].includes(r.status));

    return (
        <div className="space-y-8">
            {/* Active */}
            <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Active Rentals</h2>
                {activeRentals.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl text-sm text-gray-400">
                        No active rentals. <Link href="/tools" className="text-primary hover:underline">Browse tools</Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {activeRentals.map(rental => (
                            <RentalRow key={rental.id} rental={rental}
                                onCancel={() => cancelRental(rental.id)}
                                canReview={false}
                                onReview={() => {}}
                                unreadCount={unreadCounts[rental.id] || 0} />
                        ))}
                    </div>
                )}
            </div>

            {/* Past */}
            <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Past Rentals</h2>
                {pastRentals.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl text-sm text-gray-400">No past rentals</div>
                ) : (
                    <div className="space-y-3">
                        {pastRentals.map(rental => (
                            <RentalRow key={rental.id} rental={rental}
                                onCancel={() => {}}
                                canReview={rental.status === 'completed' && !reviewedRentals.has(rental.id)}
                                onReview={() => setReviewRental(rental)}
                                unreadCount={unreadCounts[rental.id] || 0} />
                        ))}
                    </div>
                )}
            </div>

            {/* Review modal */}
            {reviewRental && (
                <ToolReviewModal
                    rental={reviewRental}
                    isOpen={true}
                    onClose={() => { setReviewRental(null); fetchReviewed(); }}
                />
            )}
        </div>
    );
}

function RentalRow({ rental, onCancel, canReview, onReview, unreadCount }: {
    rental: ToolRental;
    onCancel: () => void;
    canReview: boolean;
    onReview: () => void;
    unreadCount: number;
}) {
    const item = (rental as any).tools_items;
    const thumbnail = item?.images?.[0];
    const status = STATUS_CONFIG[rental.status] ?? STATUS_CONFIG.pending;
    const startDate = new Date(rental.start_at).toLocaleDateString();
    const endDate = new Date(rental.end_at).toLocaleDateString();

    const isActive = ['pending', 'approved'].includes(rental.status);
    const now = new Date();
    const endAt = new Date(rental.end_at);
    const daysLeft = rental.status === 'active' ? Math.max(0, Math.ceil((endAt.getTime() - now.getTime()) / 86400000)) : null;

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
                {thumbnail && (
                    <img src={thumbnail} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-gray-900 truncate">{item?.title ?? 'Tool'}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${status.color}`}>
                            {status.icon} {status.label}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400">{startDate} → {endDate}</p>
                    {daysLeft !== null && (
                        <p className="text-xs text-green-600 font-medium mt-1">
                            {daysLeft === 0 ? 'Return today' : `${daysLeft} day${daysLeft > 1 ? 's' : ''} remaining`}
                        </p>
                    )}
                </div>
                <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900">{formatCents(rental.total_cents)}</p>
                    <div className="flex items-center gap-1 mt-2">
                        <Link href={`/tools/messages/${rental.id}`}
                            className="relative p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                            <MessageSquare className="h-3.5 w-3.5 text-gray-500" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-0.5">
                                    {unreadCount}
                                </span>
                            )}
                        </Link>
                        {isActive && (
                            <button onClick={onCancel}
                                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 transition-colors">
                                <XCircle className="h-3.5 w-3.5 text-red-500" />
                            </button>
                        )}
                        {canReview && (
                            <button onClick={onReview}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-yellow-50 hover:bg-yellow-100 text-yellow-700 text-xs font-bold transition-colors">
                                <Star className="h-3.5 w-3.5" /> Review
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
