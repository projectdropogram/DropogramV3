"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { Search, Map as MapIcon, List, Heart, Share2, UserPlus, Check } from "lucide-react";
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
    const [followedProducers, setFollowedProducers] = useState<Set<string>>(new Set());
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
            if (session) {
                fetchFavorites(session.user.id);
                fetchFollows(session.user.id);
            }
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
                    console.warn("Geolocation failed, falling back to default location:", error.message);
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

    const fetchFollows = async (userId: string) => {
        const { data } = await supabase.from('follows').select('producer_id').eq('follower_id', userId);
        if (data) {
            setFollowedProducers(new Set(data.map(f => f.producer_id)));
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

    const toggleFollow = async (producerId: string) => {
        if (!session) return alert("Please sign in to follow producers");

        const newFollows = new Set(followedProducers);
        if (followedProducers.has(producerId)) {
            newFollows.delete(producerId);
            await supabase.from('follows').delete().match({ follower_id: session.user.id, producer_id: producerId });
        } else {
            newFollows.add(producerId);
            await supabase.from('follows').insert({ follower_id: session.user.id, producer_id: producerId });
        }
        setFollowedProducers(newFollows);
    };

    const shareDrop = async (product: Product) => {
        const shareData = {
            title: `Check out ${product.title} on Dropogram!`,
            text: `I found this amazing drop: ${product.title} for $${product.price}.`,
            url: window.location.href // Ideally deep link to product
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error("Error sharing:", err);
            }
        } else {
            // Fallback
            navigator.clipboard.writeText(`${shareData.title} ${shareData.url}`);
            alert("Link copied to clipboard! 📋");
        }
    };

    const confirmOrder = async () => {
        if (!selectedProduct || !session) return;

        try {
            // Check Payment Mode
            const { data: settings } = await supabase.from('app_settings').select('enable_real_payments').eq('id', 'global').single();

            if (settings?.enable_real_payments) {
                alert("Real payments are enabled! Stripe integration is coming in the next step. For now, this transaction is blocked for safety.");
                return;
            }

            // Simulated Payment Flow
            const { error } = await supabase.from('orders').insert({
                consumer_id: session.user.id,
                product_id: selectedProduct.id,
                total_price: selectedProduct.price,
                quantity: 1,
                status: 'pending'
            });

            if (error) throw error;
            alert("Order placed successfully! (Simulated Payment)");
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
            <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between sticky top-24 z-40 glass-panel p-4 rounded-2xl shadow-sm transition-all">
                <div className="relative flex-1 w-full flex gap-2">
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-11 pr-4 py-3 border-none rounded-xl leading-5 bg-white/50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all font-medium"
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
                            className="appearance-none pl-4 pr-10 py-3 border-none rounded-xl bg-white/50 text-gray-700 font-bold focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer h-full"
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

                <div className="flex bg-white/50 p-1 rounded-xl backdrop-blur-sm">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <List className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('map')}
                        className={`p-2.5 rounded-lg transition-all ${viewMode === 'map' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <MapIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Categories */}
            <div className="mb-10">
                <CategoryBar onSelect={setSelectedCategory} />
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-center py-32">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium">Finding delicious drops near you...</p>
                </div>
            ) : viewMode === 'map' && userLocation ? (
                <div className="rounded-3xl overflow-hidden shadow-lg border border-white/50">
                    <MapView products={products} userLocation={userLocation} />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {products.map((product) => (
                        <div key={product.id} className="glass-card rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 group relative flex flex-col h-full border-0">
                            <div className="relative h-64 overflow-hidden">
                                {product.image_url ? (
                                    <img
                                        src={product.image_url}
                                        alt={product.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400 font-medium">
                                        No Image Available
                                    </div>
                                )}

                                {/* Floating Actions */}
                                <div className="absolute top-4 right-4 flex flex-col gap-3">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
                                        className={`p-3 rounded-full bg-white/90 backdrop-blur-md shadow-lg transition-all hover:scale-110 active:scale-95 ${favorites.has(product.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                                    >
                                        <Heart className={`h-5 w-5 ${favorites.has(product.id) ? 'fill-current' : ''}`} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); shareDrop(product); }}
                                        className="p-3 rounded-full bg-white/90 backdrop-blur-md shadow-lg text-gray-400 hover:text-blue-500 transition-all hover:scale-110 active:scale-95"
                                    >
                                        <Share2 className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm flex items-center gap-1">
                                    <MapIcon className="h-3 w-3" />
                                    {(product.dist_meters / 1609.34).toFixed(1)} mi
                                </div>
                            </div>

                            <div className="p-6 flex flex-col flex-grow">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="text-xl font-bold text-gray-900 line-clamp-1 font-heading tracking-tight">{product.title}</h3>
                                    <span className="text-xl font-bold text-primary font-heading">${product.price}</span>
                                </div>
                                <p className="text-gray-600 text-sm mb-6 line-clamp-2 leading-relaxed flex-grow">{product.description}</p>

                                <div className="flex items-center justify-between mb-6 pt-4 border-t border-gray-100">
                                    {/* Producer Info & Follow */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Producer</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleFollow(product.producer_id); }}
                                            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${followedProducers.has(product.producer_id) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                        >
                                            {followedProducers.has(product.producer_id) ? (
                                                <>
                                                    <Check className="h-3.5 w-3.5" /> Following
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus className="h-3.5 w-3.5" /> Follow
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setSelectedProduct(product)}
                                    className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-primary-hover transition-all active:scale-95 transform shadow-lg shadow-primary/20 hover:shadow-primary/40"
                                >
                                    Order Now
                                </button>
                            </div>
                        </div>
                    ))}
                    {products.length === 0 && (
                        <div className="col-span-full text-center py-32">
                            <div className="text-6xl mb-4">🍽️</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2 font-heading">No drops found nearby</h3>
                            <p className="text-gray-500">Try expanding your search radius or checking back later!</p>
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
