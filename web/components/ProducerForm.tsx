"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (ensure env vars are set)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface ProducerFormProps {
    className?: string;
    onSuccess?: () => void;
}

export function ProducerForm({ className, onSuccess }: ProducerFormProps) {
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState<{ lat: number; long: number } | null>(null);

    const [error, setError] = useState<string | null>(null);

    // Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [imageUrl, setImageUrl] = useState("");

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
                    console.error("Error getting location:", err.code, err.message);
                    let msg = "Could not get location.";
                    if (err.code === 1) msg = "Location permission denied. Please allow location access in your browser settings.";
                    else if (err.code === 2) msg = "Location unavailable. Ensure your GPS is on.";
                    else if (err.code === 3) msg = "Location request timed out.";
                    setError(msg);
                }
            );
        } else {
            setError("Geolocation is not supported by this browser.");
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!location) {
            setError("Location is required to post a drop.");
            setLoading(false);
            return;
        }

        try {
            // Call the RPC function we created
            const { data, error: rpcError } = await supabase.rpc('create_product', {
                title,
                description,
                price: parseFloat(price),
                image_url: imageUrl,
                lat: location.lat,
                long: location.long
            });

            if (rpcError) throw rpcError;

            alert("Drop created successfully!");
            setTitle("");
            setDescription("");
            setPrice("");
            setImageUrl("");
            if (onSuccess) onSuccess();

        } catch (err: any) {
            console.error("Error submitting drop:", err);
            setError(err.message || "Failed to create drop.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={`p-6 bg-white rounded-lg shadow-md max-w-md mx-auto ${className}`}>
            <h2 className="text-2xl font-bold mb-6 text-gray-800">New Drop</h2>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                    Title
                </label>
                <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="title"
                    name="title"
                    type="text"
                    placeholder="e.g. Kerala Fish Curry"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
            </div>

            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                    Description
                </label>
                <textarea
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="description"
                    name="description"
                    placeholder="Describe your dish..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                />
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Price ($)</label>
                    <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                        placeholder="0.00"
                        step="0.01"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Image URL</label>
                    <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                        placeholder="https://..."
                    />
                </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
                <label className="block text-sm font-bold text-gray-700 mb-2">Location</label>
                {location ? (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-lg">
                        <span>📍</span>
                        <span className="font-medium">Location Detected ({location.lat.toFixed(4)}, {location.long.toFixed(4)})</span>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="text-sm text-gray-500 bg-gray-50 px-4 py-3 rounded-lg">
                            Detecting location... If this takes too long, use the manual override below.
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="number"
                                placeholder="Latitude"
                                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:ring-primary outline-none"
                                onChange={(e) => setLocation(prev => ({ ...prev!, lat: parseFloat(e.target.value) || 0 }))}
                            />
                            <input
                                type="number"
                                placeholder="Longitude"
                                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:ring-primary outline-none"
                                onChange={(e) => setLocation(prev => ({ ...prev!, long: parseFloat(e.target.value) || 0 }))}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => setLocation({ lat: 40.7128, long: -74.0060 })}
                            className="text-sm text-primary font-bold hover:underline"
                        >
                            Use NYC Defaults
                        </button>
                    </div>
                )}
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white font-bold text-lg py-4 rounded-xl hover:bg-primary-hover transition-all transform active:scale-95 shadow-lg shadow-orange-200"
            >
                {loading ? "Dropping..." : "Post Drop 🚀"}
            </button>
        </form>
    );
}

