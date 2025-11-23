"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { OrderModal } from './OrderModal';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    image_url: string;
    dist_meters: number;
}

export function ConsumerFeed() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState<{ lat: number; long: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [radius, setRadius] = useState(50000); // 50km default
    const [session, setSession] = useState<any>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    // Get Session on Mount
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });
    }, []);

    // Get Location on Mount
    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        long: position.coords.longitude,
                    });
                },
                (err) => {
                    console.error("Error getting location:", err);
                }
            );
        }
    }, []);

    // Fetch Products when location changes
    useEffect(() => {
        if (location) {
            fetchProducts();
        }
    }, [location, radius]);

    const fetchProducts = async () => {
        if (!location) return;
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.rpc('find_nearby_products', {
                lat: location.lat,
                long: location.long,
                radius_meters: radius
            });

            if (error) throw error;
            setProducts(data || []);

        } catch (err: any) {
            console.error("Error fetching feed:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOrderClick = (product: Product) => {
        if (!session) {
            alert("Please sign in to place an order.");
            return;
        }
        setSelectedProduct(product);
    };

    const confirmOrder = async () => {
        if (!selectedProduct || !session) return;

        try {
            const { error } = await supabase.from('orders').insert({
                consumer_id: session.user.id,
                product_id: selectedProduct.id,
                total_price: selectedProduct.price,
                quantity: 1,
                status: 'pending'
            });

            if (error) throw error;
            alert("Order placed successfully! The producer will be notified.");
            setSelectedProduct(null);
        } catch (err: any) {
            console.error("Error placing order:", err);
            alert("Failed to place order: " + err.message);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
            {/* Hero Section */}
            <div className="py-8">
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                    Cravings, <span className="text-primary">Dropped.</span>
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                    Discover homemade food and local goods near you.
                </p>
            </div>

            {/* Filters Bar */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md py-4 border-b border-gray-100 mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4 overflow-x-auto pb-2 sm:pb-0">
                    {/* Radius Filter */}
                    <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
                        <span className="text-sm font-medium text-gray-600">Distance:</span>
                        <select
                            className="bg-transparent text-sm font-bold text-gray-900 focus:outline-none cursor-pointer"
                            value={radius / 1000}
                            onChange={(e) => setRadius(Number(e.target.value) * 1000)}
                        >
                            <option value="5">5 km</option>
                            <option value="10">10 km</option>
                            <option value="50">50 km</option>
                            <option value="5000">Global</option>
                        </select>
                    </div>
                </div>

                {/* Location Status */}
                <div className="hidden sm:block text-xs text-gray-400">
                    {location ? `📍 ${location.lat.toFixed(2)}, ${location.long.toFixed(2)}` : 'Detecting location...'}
                </div>
            </div>

            {/* Manual Location Fallback */}
            {!location && (
                <div className="mb-8 p-6 bg-accent rounded-xl text-center">
                    <p className="text-gray-700 mb-4 font-medium">Enable location to see what's cooking nearby.</p>
                    <button
                        className="text-primary font-bold hover:underline"
                        onClick={() => setLocation({ lat: 40.7128, long: -74.0060 })}
                    >
                        Use NYC (Demo)
                    </button>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 border border-red-100">
                    {error}
                </div>
            )}

            {/* Loading State */}
            {loading && products.length === 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-gray-100 rounded-xl"></div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && products.length === 0 && location && (
                <div className="text-center py-20">
                    <div className="text-6xl mb-4">🍽️</div>
                    <h3 className="text-xl font-bold text-gray-900">No drops found nearby.</h3>
                    <p className="text-gray-500 mt-2">Try increasing the distance radius!</p>
                </div>
            )}

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map((product) => (
                    <div key={product.id} className="group bg-white rounded-xl card-shadow overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                        {/* Image Container */}
                        <div className="relative h-56 bg-gray-200 overflow-hidden">
                            {product.image_url ? (
                                <img
                                    src={product.image_url}
                                    alt={product.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400 bg-gray-100">
                                    <span className="text-4xl">🥘</span>
                                </div>
                            )}
                            {/* Distance Badge */}
                            <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur text-gray-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                {(product.dist_meters / 1000).toFixed(1)} km
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-gray-900 leading-tight">{product.title}</h3>
                                <span className="font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded text-sm">${product.price}</span>
                            </div>
                            <p className="text-gray-500 text-sm mb-6 line-clamp-2 h-10">{product.description}</p>

                            <button
                                onClick={() => handleOrderClick(product)}
                                className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary-hover transition-colors active:scale-95 transform"
                            >
                                Order Now
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Order Modal */}
            {selectedProduct && (
                <OrderModal
                    product={selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                    onConfirm={confirmOrder}
                />
            )}
        </div>
    );
}
