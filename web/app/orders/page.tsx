"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { NavBar } from "@/components/NavBar";
import { useRouter } from "next/navigation";

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
        producer_id: string;
    };
    profiles: {
        full_name: string; // Producer Name
    };
};

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                router.replace("/login");
            } else {
                setSession(session);
                fetchOrders(session.user.id);

                // Realtime Subscription
                const channel = supabase
                    .channel('consumer_orders')
                    .on(
                        'postgres_changes',
                        {
                            event: '*',
                            schema: 'public',
                            table: 'orders',
                            filter: `consumer_id=eq.${session.user.id}`
                        },
                        () => {
                            fetchOrders(session.user.id);
                        }
                    )
                    .subscribe();

                return () => {
                    supabase.removeChannel(channel);
                };
            }
        });
    }, [router]);

    const fetchOrders = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    products (
                        title,
                        image_url,
                        producer_id
                    )
                `)
                .eq('consumer_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data as any);
        } catch (err) {
            console.error("Error fetching orders:", err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'accepted': return 'bg-blue-100 text-blue-800 animate-pulse';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending': return 'Sent to Kitchen';
            case 'accepted': return 'Cooking...';
            case 'completed': return 'Ready for Pickup!';
            case 'cancelled': return 'Cancelled';
            default: return status;
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading Orders...</div>;

    const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
    const pastOrders = orders.filter(o => o.status === 'completed' || o.status === 'cancelled');

    return (
        <div className="min-h-screen bg-white">
            <NavBar />
            <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Your Orders</h1>

                {/* Active Orders */}
                {activeOrders.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Active Now</h2>
                        <div className="space-y-4">
                            {activeOrders.map(order => (
                                <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-16 w-16 bg-gray-100 rounded-lg overflow-hidden">
                                                {order.products.image_url && (
                                                    <img src={order.products.image_url} alt={order.products.title} className="h-full w-full object-cover" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-900">{order.products.title}</h3>
                                                <p className="text-gray-500 text-sm">Qty: {order.quantity} • ${order.total_price}</p>
                                            </div>
                                        </div>
                                        <span className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(order.status)}`}>
                                            {getStatusText(order.status)}
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
                                        <div
                                            className="bg-primary h-2.5 rounded-full transition-all duration-500"
                                            style={{
                                                width: order.status === 'pending' ? '33%' : order.status === 'accepted' ? '66%' : '100%'
                                            }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-gray-400 text-right">
                                        Ordered at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Past Orders */}
                <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Past Orders</h2>
                    <div className="space-y-4">
                        {pastOrders.map(order => (
                            <div key={order.id} className="bg-gray-50 border border-gray-100 rounded-lg p-4 flex items-center justify-between opacity-75 hover:opacity-100 transition-opacity">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-gray-200 rounded-md overflow-hidden grayscale">
                                        {order.products.image_url && (
                                            <img src={order.products.image_url} alt={order.products.title} className="h-full w-full object-cover" />
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-700">{order.products.title}</h4>
                                        <p className="text-gray-500 text-xs">{new Date(order.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                                    {getStatusText(order.status)}
                                </span>
                            </div>
                        ))}
                        {pastOrders.length === 0 && activeOrders.length === 0 && (
                            <div className="text-center py-12 text-gray-400">
                                No orders yet. Time to get hungry! 🍔
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
