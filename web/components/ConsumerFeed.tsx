"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { Search, Map as MapIcon, List, Heart } from "lucide-react";
import { OrderModal } from "./OrderModal";
import { CategoryBar } from "./CategoryBar";
import dynamic from "next/dynamic";

// Dynamically import MapView to avoid SSR issues with Leaflet
const MapView = dynamic(() => import("./MapView").then(mod => mod.MapView), {
    ssr: false,
    loading: () => <div className="h-[60vh] w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center">Loading Map...</div>
});

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Product = {
    id: string;
    title: string;
    description: string;
    price: number;
    image_url: string;
    dist_meters: number;
    producer_id: string;
    lat: number;
    long: number;
};

export function ConsumerFeed() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [session, setSession] = useState<any>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const [radius, setRadius] = useState(80467); // 50 miles default

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) fetchFavorites(session.user.id);
        });

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                },
                (error) => {
                    console.error("Error getting location:", error);
                    // Fallback to San Francisco
                    setUserLocation({ lat: 37.7749, lng: -122.4194 });
                }
            );
        } else {
            // Fallback
            setUserLocation({ lat: 37.7749, lng: -122.4194 });
        }
    }, []);

    useEffect(() => {
        if (userLocation) {
            fetchNearbyProducts();
        }
    }, [userLocation, debouncedSearch, selectedCategory, radius]);

    const fetchFavorites = async (userId: string) => {
        const { data } = await supabase.from('favorites').select('product_id').eq('user_id', userId);
        if (data) {
            setFavorites(new Set(data.map(f => f.product_id)));
        }
    };

    const toggleFavorite = async (productId: string) => {
        if (!session) return alert("Please sign in to save favorites");

        const newFavorites = new Set(favorites);
        if (favorites.has(productId)) {
            newFavorites.delete(productId);
            await supabase.from('favorites').delete().match({ user_id: session.user.id, product_id: productId });
        } else {
            newFavorites.add(productId);
            await supabase.from('favorites').insert({ user_id: session.user.id, product_id: productId });
        }
        setFavorites(newFavorites);
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

    const fetchNearbyProducts = async () => {
        if (!userLocation) return;
        setLoading(true);

        const { data, error } = await supabase.rpc("find_nearby_products", {
            lat: userLocation.lat,
            long: userLocation.lng,
            radius_meters: radius,
            search_text: debouncedSearch || null,
            tag_filter: selectedCategory || null
        });

        if (error) {
            console.error("Error fetching products:", error);
        } else {
            setProducts(data || []);
        }
        setLoading(false);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
                <div className="relative flex-1 w-full flex gap-2">
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary transition-all shadow-sm"
                            placeholder="Search for lasagna, cookies, tacos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Radius Selector */}
                    <div className="relative">
                        <select
                            value={radius}
                            onChange={(e) => setRadius(Number(e.target.value))}
                            className="appearance-none pl-4 pr-10 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary transition-all shadow-sm cursor-pointer h-full"
                            style={{ fontFamily: 'inherit' }}
                        >
                            <option value={8046}>5 miles</option>
                            <option value={16093}>10 miles</option>
                            <option value={40233}>25 miles</option>
                            <option value={80467}>50 miles</option>
                            <option value={20000000}>Global 🌍</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}
                    >
                        <List className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('map')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'map' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}
                    >
                        <MapIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Categories */}
            <div className="mb-8">
                <CategoryBar onSelect={setSelectedCategory} />
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-center py-20 text-gray-500">Finding drops near you...</div>
            ) : viewMode === 'map' && userLocation ? (
                <MapView products={products} userLocation={userLocation} />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                        <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group relative">
                            <div className="relative h-48 bg-gray-200">
                                {product.image_url ? (
                                    <img
                                        src={product.image_url}
                                        alt={product.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400">
                                        No Image
                                    </div>
                                )}
                                <div className="absolute top-3 right-3">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
                                        className={`p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm transition-transform active:scale-90 ${favorites.has(product.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                                    >
                                        <Heart className={`h-5 w-5 ${favorites.has(product.id) ? 'fill-current' : ''}`} />
                                    </button>
                                </div>
                                <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-gray-700 shadow-sm">
                                    {(product.dist_meters / 1609.34).toFixed(1)} mi away
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{product.title}</h3>
                                    <span className="text-lg font-bold text-primary">${product.price}</span>
                                </div>
                                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{product.description}</p>
                                <button
                                    onClick={() => setSelectedProduct(product)}
                                    className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary-hover transition-colors active:scale-95 transform"
                                >
                                    Order Now
                                </button>
                            </div>
                        </div>
                    ))}
                    {products.length === 0 && (
                        <div className="col-span-full text-center py-20 text-gray-400">
                            No drops found nearby. Try changing your search or category!
                        </div>
                    )}
                </div>
            )}
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
