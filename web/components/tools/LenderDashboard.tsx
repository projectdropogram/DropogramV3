"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { ToolRental, formatCents, RentalStatus } from './types';
import { Check, X, Clock, Package, MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface LenderDashboardProps {
    lenderId: string;
}

const STATUS_COLUMNS: { key: string; label: string; icon: React.ReactNode; statuses: RentalStatus[] }[] = [
    { key: 'pending', label: 'Pending Requests', icon: <Clock className="h-4 w-4" />, statuses: ['pending'] },
    { key: 'active', label: 'Active Rentals', icon: <Package className="h-4 w-4" />, statuses: ['approved', 'active'] },
    { key: 'completed', label: 'Completed', icon: <Check className="h-4 w-4" />, statuses: ['completed'] },
];

export function LenderDashboard({ lenderId }: LenderDashboardProps) {
    const [rentals, setRentals] = useState<ToolRental[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

    const fetchRentals = async () => {
        const { data } = await supabase
            .from('tools_rentals')
            .select('*, tools_items(title, images)')
            .eq('lender_id', lenderId)
            .order('created_at', { ascending: false });
        if (data) setRentals(data as any);
        setLoading(false);
    };

    const fetchUnreadCounts = async () => {
        const { data } = await supabase
            .from('tools_messages')
            .select('rental_id')
            .neq('sender_id', lenderId)
            .is('read_at', null);
        if (data) {
            const counts: Record<string, number> = {};
            data.forEach(m => { counts[m.rental_id] = (counts[m.rental_id] || 0) + 1; });
            setUnreadCounts(counts);
        }
    };

    useEffect(() => {
        fetchRentals();
        fetchUnreadCounts();
        const interval = setInterval(() => { fetchRentals(); fetchUnreadCounts(); }, 10000);
        return () => clearInterval(interval);
    }, [lenderId]);

    const updateStatus = async (rentalId: string, status: RentalStatus) => {
        await supabase
            .from('tools_rentals')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', rentalId);
        fetchRentals();
    };

    const cancelRental = async (rentalId: string) => {
        await supabase
            .from('tools_rentals')
            .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancelled_by: lenderId, updated_at: new Date().toISOString() })
            .eq('id', rentalId);
        // Remove the availability block
        await supabase
            .from('tools_availability_blocks')
            .delete()
            .eq('rental_id', rentalId);
        fetchRentals();
    };

    if (loading) return <div className="text-center py-10 text-gray-400">Loading dashboard...</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {STATUS_COLUMNS.map(col => {
                const colRentals = rentals.filter(r => col.statuses.includes(r.status));
                return (
                    <div key={col.key} className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                            {col.icon}
                            <span>{col.label}</span>
                            <span className="ml-auto text-xs bg-gray-100 px-2 py-0.5 rounded-full">{colRentals.length}</span>
                        </div>
                        {colRentals.length === 0 && (
                            <div className="text-center py-8 text-gray-300 text-sm bg-gray-50 rounded-xl">No rentals</div>
                        )}
                        {colRentals.map(rental => (
                            <RentalCard key={rental.id} rental={rental}
                                onApprove={() => updateStatus(rental.id, 'approved')}
                                onDecline={() => cancelRental(rental.id)}
                                onActivate={() => updateStatus(rental.id, 'active')}
                                onComplete={() => updateStatus(rental.id, 'completed')}
                                unreadCount={unreadCounts[rental.id] || 0}
                            />
                        ))}
                    </div>
                );
            })}
        </div>
    );
}

function RentalCard({ rental, onApprove, onDecline, onActivate, onComplete, unreadCount }: {
    rental: ToolRental;
    onApprove: () => void;
    onDecline: () => void;
    onActivate: () => void;
    onComplete: () => void;
    unreadCount: number;
}) {
    const item = (rental as any).tools_items;
    const thumbnail = item?.images?.[0];
    const startDate = new Date(rental.start_at).toLocaleDateString();
    const endDate = new Date(rental.end_at).toLocaleDateString();

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
                {thumbnail && (
                    <img src={thumbnail} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 truncate">{item?.title ?? 'Tool'}</p>
                    <p className="text-xs text-gray-400">{startDate} → {endDate}</p>
                </div>
                <span className="text-sm font-bold text-gray-900 shrink-0">{formatCents(rental.total_cents)}</span>
            </div>

            {rental.pickup_notes && (
                <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">📝 {rental.pickup_notes}</p>
            )}

            <div className="flex items-center gap-2">
                {rental.status === 'pending' && (
                    <>
                        <button onClick={onApprove}
                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600 transition-colors">
                            <Check className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button onClick={onDecline}
                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors">
                            <X className="h-3.5 w-3.5" /> Decline
                        </button>
                    </>
                )}
                {rental.status === 'approved' && (
                    <button onClick={onActivate}
                        className="flex-1 py-2 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors text-center">
                        Mark as Picked Up
                    </button>
                )}
                {rental.status === 'active' && (
                    <button onClick={onComplete}
                        className="flex-1 py-2 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600 transition-colors text-center">
                        Mark as Returned
                    </button>
                )}
                <Link href={`/tools/messages/${rental.id}`}
                    className="relative p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                    <MessageSquare className="h-4 w-4 text-gray-500" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                            {unreadCount}
                        </span>
                    )}
                </Link>
            </div>
        </div>
    );
}
