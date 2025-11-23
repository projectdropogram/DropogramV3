"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Order = {
    id: string;
    status: 'pending' | 'accepted' | 'completed' | 'cancelled';
    quantity: number;
    total_price: number;
    created_at: string;
    products: {
        title: string;
        image_url: string;
    };
    profiles: {
        full_name: string;
    };
};

export function ProducerOrderBoard({ producerId }: { producerId: string }) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();

        // Realtime Subscription
        const channel = supabase
            .channel('producer_orders')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders'
                },
                (payload) => {
                    // Simple strategy: Refetch all orders on any change to ensure relations are loaded
                    // In a high-scale app, we'd optimistically update the state
                    fetchOrders();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [producerId]);

    const fetchOrders = async () => {
        try {
            // We need to join with products to filter by producer_id
            // And join with profiles to get consumer info
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    products!inner (
                        title,
                        image_url,
                        producer_id
                    ),
                    profiles (
                        full_name
                    )
                `)
                .eq('products.producer_id', producerId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data as any);
        } catch (err) {
            console.error("Error fetching orders:", JSON.stringify(err, null, 2));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (orderId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;
            // Realtime will trigger a refetch
        } catch (err) {
            console.error("Error updating status:", err);
            alert("Failed to update status");
        }
    };

    const OrderCard = ({ order }: { order: Order }) => (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-3 animate-fade-in">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h4 className="font-bold text-gray-900">{order.products.title}</h4>
                    <p className="text-sm text-gray-500">
                        Qty: {order.quantity} • ${order.total_price}
                    </p>
                </div>
                <span className="text-xs font-mono text-gray-400">
                    {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>

            <div className="text-sm text-gray-600 mb-4">
                Customer: <span className="font-medium">{order.profiles?.full_name || 'Guest'}</span>
            </div>

            <div className="flex gap-2">
                {order.status === 'pending' && (
                    <button
                        onClick={() => updateStatus(order.id, 'accepted')}
                        className="flex-1 bg-primary text-white text-sm font-bold py-2 rounded hover:bg-primary-hover transition-colors"
                    >
                        Accept
                    </button>
                )}
                {order.status === 'accepted' && (
                    <button
                        onClick={() => updateStatus(order.id, 'completed')}
                        className="flex-1 bg-green-500 text-white text-sm font-bold py-2 rounded hover:bg-green-600 transition-colors"
                    >
                        Mark Ready
                    </button>
                )}
                {order.status !== 'cancelled' && order.status !== 'completed' && (
                    <button
                        onClick={() => updateStatus(order.id, 'cancelled')}
                        className="px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </div>
    );

    if (loading) return <div className="text-center py-10">Loading Kitchen...</div>;

    const pendingOrders = orders.filter(o => o.status === 'pending');
    const activeOrders = orders.filter(o => o.status === 'accepted');
    const completedOrders = orders.filter(o => o.status === 'completed');

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pending Column */}
            <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-700">New Orders</h3>
                    <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded-full">
                        {pendingOrders.length}
                    </span>
                </div>
                <div className="space-y-3">
                    {pendingOrders.map(order => <OrderCard key={order.id} order={order} />)}
                    {pendingOrders.length === 0 && (
                        <div className="text-center text-gray-400 text-sm py-8">No new orders</div>
                    )}
                </div>
            </div>

            {/* In Progress Column */}
            <div className="bg-blue-50 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-blue-800">In Kitchen</h3>
                    <span className="bg-blue-200 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">
                        {activeOrders.length}
                    </span>
                </div>
                <div className="space-y-3">
                    {activeOrders.map(order => <OrderCard key={order.id} order={order} />)}
                    {activeOrders.length === 0 && (
                        <div className="text-center text-blue-300 text-sm py-8">Kitchen is clear</div>
                    )}
                </div>
            </div>

            {/* Completed Column */}
            <div className="bg-green-50 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-green-800">Ready / Past</h3>
                    <span className="bg-green-200 text-green-800 text-xs font-bold px-2 py-1 rounded-full">
                        {completedOrders.length}
                    </span>
                </div>
                <div className="space-y-3">
                    {completedOrders.map(order => <OrderCard key={order.id} order={order} />)}
                    {completedOrders.length === 0 && (
                        <div className="text-center text-green-300 text-sm py-8">No history yet</div>
                    )}
                </div>
            </div>
        </div>
    );
}
