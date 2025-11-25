"use client";

import { useState } from "react";
import { ShoppingCart, ArrowRight, TrendingDown, Store, AlertCircle, MapPin } from "lucide-react";

type StorePrice = {
    storeName: string;
    totalCost: number;
    itemsFound: number;
    totalItems: number;
    color: string;
    distance?: string;
};

type Substitution = {
    original: string;
    suggestion: string;
    savings: number;
};

export function SourcingOptimizer() {
    const [inputList, setInputList] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<StorePrice[] | null>(null);
    const [substitutions, setSubstitutions] = useState<Substitution[]>([]);
    const [manualLocation, setManualLocation] = useState("");

    const [locationStatus, setLocationStatus] = useState<'idle' | 'locating' | 'found' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleOptimize = () => {
        if (!inputList.trim()) return;
        setLoading(true);
        setErrorMessage(null);

        if (manualLocation.trim()) {
            setLocationStatus('found');
            generateResults(null, null, manualLocation);
            return;
        }

        setLocationStatus('locating');

        // Get Location
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocationStatus('found');
                    generateResults(position.coords.latitude, position.coords.longitude);
                },
                (error) => {
                    console.error("Location error:", error);
                    let errorMessage = "Unable to retrieve location.";
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = "Location permission denied. Please enable it in your browser settings.";
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = "Location information is unavailable.";
                            break;
                        case error.TIMEOUT:
                            errorMessage = "The request to get user location timed out.";
                            break;
                    }
                    setErrorMessage(errorMessage);
                    setLocationStatus('error');
                    generateResults(null, null); // Proceed without location
                }
            );
        } else {
            setLocationStatus('error');
            generateResults(null, null);
        }
    };

    const generateResults = async (lat: number | null, lng: number | null, city?: string) => {
        try {
            const items = inputList.split(',').map(i => i.trim()).filter(i => i.length > 0);

            const response = await fetch('/api/sourcing/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items,
                    location: city || (lat && lng ? `${lat},${lng}` : undefined)
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || errorData.error || 'Failed to fetch prices');
            }

            const data = await response.json();
            setResults(data.results.sort((a: StorePrice, b: StorePrice) => a.totalCost - b.totalCost));

            // Generate substitutions locally for now (could be moved to API)
            const count = items.length;
            const mockSubs: Substitution[] = [];
            if (inputList.toLowerCase().includes("organic")) {
                mockSubs.push({
                    original: "Organic Ingredients",
                    suggestion: "Conventional Alternatives",
                    savings: count * 2.50
                });
            }
            if (inputList.toLowerCase().includes("beef")) {
                mockSubs.push({
                    original: "Ground Beef",
                    suggestion: "Bulk Pack (5lb+)",
                    savings: 4.00
                });
            }
            setSubstitutions(mockSubs);

        } catch (error) {
            console.error("Optimization error:", error);
            setErrorMessage(error instanceof Error ? error.message : "Failed to analyze prices. Please try again.");
            setLocationStatus('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                        <ShoppingCart className="h-6 w-6 text-primary" />
                        Smart Sourcing
                    </h2>
                    <p className="text-gray-500">
                        Paste your shopping list below. We'll find the best prices at local stores to maximize your margins.
                    </p>
                </div>

                <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Input Section */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Shopping List
                            </label>
                            <textarea
                                value={inputList}
                                onChange={(e) => setInputList(e.target.value)}
                                placeholder="e.g. 5 lbs Ground Beef, 3 onions, 1 gal Milk, 2 doz Eggs..."
                                className="w-full h-64 p-4 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-primary focus:bg-white transition-all outline-none resize-none font-mono text-sm leading-relaxed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Location (Optional)
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={manualLocation}
                                    onChange={(e) => setManualLocation(e.target.value)}
                                    placeholder="e.g. Austin, TX (Leave empty to use GPS)"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-primary focus:bg-white transition-all outline-none"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleOptimize}
                            disabled={loading || !inputList.trim()}
                            className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-primary-hover transition-all active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    {locationStatus === 'locating' ? 'Locating Stores...' : 'Scraping Prices (this may take a moment)...'}
                                </>
                            ) : (
                                <>
                                    Find Lowest Prices <ArrowRight className="h-5 w-5" />
                                </>
                            )}
                        </button>
                        {locationStatus === 'error' && errorMessage && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-sm text-red-600 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                <p>{errorMessage}</p>
                            </div>
                        )}
                    </div>

                    {/* Results Section */}
                    <div className="relative">
                        {!results && !loading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-gray-400 p-8 border-2 border-dashed border-gray-100 rounded-xl">
                                <Store className="h-12 w-12 mb-4 opacity-20" />
                                <p className="font-medium">Results will appear here</p>
                            </div>
                        )}

                        {results && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-500">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-gray-900 text-lg">Price Comparison</h3>
                                    <span className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full">
                                        Best Deal Found!
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    {results.map((store, idx) => (
                                        <div
                                            key={store.storeName}
                                            className={`p-4 rounded-xl border-2 transition-all ${idx === 0 ? 'border-green-500 bg-green-50/50 shadow-sm transform scale-105' : 'border-transparent bg-gray-50'}`}
                                        >
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-lg ${idx === 0 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900">{store.storeName}</h4>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                                            <span>{store.itemsFound}/{store.totalItems} items found</span>
                                                            {store.distance && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="flex items-center gap-1 text-gray-600">
                                                                        <MapPin className="h-3 w-3" />
                                                                        {store.distance} miles
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-xl font-bold ${idx === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                                        ${store.totalCost.toFixed(2)}
                                                    </div>
                                                    {idx === 0 && results.length > 1 && (
                                                        <div className="text-xs font-bold text-green-600">
                                                            Save ${(results[results.length - 1].totalCost - store.totalCost).toFixed(2)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {substitutions.length > 0 && (
                                    <div className="mt-8 bg-amber-50 rounded-xl p-5 border border-amber-100">
                                        <h4 className="font-bold text-amber-900 flex items-center gap-2 mb-3">
                                            <TrendingDown className="h-5 w-5" />
                                            Smart Substitutions
                                        </h4>
                                        <div className="space-y-3">
                                            {substitutions.map((sub, i) => (
                                                <div key={i} className="flex items-start gap-3 text-sm">
                                                    <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-amber-800">
                                                            Swap <span className="font-bold line-through opacity-60">{sub.original}</span> for <span className="font-bold">{sub.suggestion}</span>
                                                        </p>
                                                        <p className="text-amber-600 font-bold text-xs mt-1">
                                                            Save est. ${sub.savings.toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
