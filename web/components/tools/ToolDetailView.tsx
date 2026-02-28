"use client";

import { useState, useEffect } from 'react';
import { Star, MapPin, Shield, ChevronLeft, ChevronRight, Calendar, Tag } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { ToolItem, ToolReview, formatCentsShort, conditionLabel, categoryLabel, categoryIcon } from './types';

interface ToolDetailViewProps {
    item: ToolItem;
    lenderName: string | null;
    lenderAvatar: string | null;
}

export function ToolDetailView({ item, lenderName, lenderAvatar }: ToolDetailViewProps) {
    const [imgIdx, setImgIdx] = useState(0);
    const [reviews, setReviews] = useState<ToolReview[]>([]);

    const fallback = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' fill='none'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Cpath d='M185 130h30v60h-30z' fill='%239ca3af'/%3E%3Ccircle cx='200' cy='120' r='18' stroke='%239ca3af' stroke-width='6' fill='none'/%3E%3Ctext x='200' y='220' text-anchor='middle' fill='%239ca3af' font-size='14'%3ENo image%3C/text%3E%3C/svg%3E";
    const images = item.images.length > 0 ? item.images : [fallback];

    useEffect(() => {
        const fetchReviews = async () => {
            const { data } = await supabase
                .from('tools_reviews')
                .select('*')
                .eq('item_id', item.id)
                .order('created_at', { ascending: false })
                .limit(10);
            if (data) setReviews(data);
        };
        fetchReviews();
    }, [item.id]);

    return (
        <div className="space-y-6">
            {/* Image gallery */}
            <div className="relative aspect-[16/9] sm:aspect-[2/1] rounded-2xl overflow-hidden bg-gray-100">
                <img src={images[imgIdx]} alt={item.title} className="w-full h-full object-cover" />
                {images.length > 1 && (
                    <>
                        <button onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-white">
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button onClick={() => setImgIdx(i => (i + 1) % images.length)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-white">
                            <ChevronRight className="h-5 w-5" />
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {images.map((_, i) => (
                                <button key={i} onClick={() => setImgIdx(i)}
                                    className={`w-2 h-2 rounded-full transition-colors ${i === imgIdx ? 'bg-white' : 'bg-white/50'}`} />
                            ))}
                        </div>
                    </>
                )}
                <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/90 backdrop-blur-sm shadow-sm">
                        {categoryIcon(item.category)} {categoryLabel(item.category)}
                    </span>
                    <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/90 backdrop-blur-sm shadow-sm">
                        {conditionLabel(item.condition)}
                    </span>
                </div>
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {images.map((url, i) => (
                        <button key={i} onClick={() => setImgIdx(i)}
                            className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === imgIdx ? 'border-primary' : 'border-transparent'}`}>
                            <img src={url} alt="" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}

            {/* Title & rating */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{item.title}</h1>
                <div className="flex items-center gap-4 mt-2">
                    {item.avg_rating && (
                        <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-bold">{item.avg_rating.toFixed(1)}</span>
                            <span className="text-sm text-gray-400">({item.total_rentals} rentals)</span>
                        </div>
                    )}
                    {item.location_city && (
                        <div className="flex items-center gap-1 text-gray-400">
                            <MapPin className="h-4 w-4" />
                            <span className="text-sm">{item.location_city}{item.location_state ? `, ${item.location_state}` : ''}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Lender card */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden shrink-0">
                    {lenderAvatar ? (
                        <img src={lenderAvatar} alt={lenderName ?? ''} className="h-full w-full object-cover" />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-400 font-bold text-lg">
                            {(lenderName ?? '?')[0].toUpperCase()}
                        </div>
                    )}
                </div>
                <div>
                    <p className="font-bold text-gray-900">{lenderName ?? 'Tool Owner'}</p>
                    <p className="text-xs text-gray-500">Listed on {new Date(item.created_at).toLocaleDateString()}</p>
                </div>
            </div>

            {/* Description */}
            {item.description && (
                <div>
                    <h3 className="font-bold text-gray-900 mb-2">About This Tool</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{item.description}</p>
                </div>
            )}

            {/* Specs */}
            <div>
                <h3 className="font-bold text-gray-900 mb-3">Details</h3>
                <div className="grid grid-cols-2 gap-3">
                    {item.brand && (
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                            <Tag className="h-4 w-4 text-gray-400" />
                            <div><p className="text-xs text-gray-400">Brand</p><p className="text-sm font-bold">{item.brand}</p></div>
                        </div>
                    )}
                    {item.model_number && (
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                            <Tag className="h-4 w-4 text-gray-400" />
                            <div><p className="text-xs text-gray-400">Model</p><p className="text-sm font-bold">{item.model_number}</p></div>
                        </div>
                    )}
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div><p className="text-xs text-gray-400">Min Rental</p><p className="text-sm font-bold">{item.min_rental_days} day{item.min_rental_days > 1 ? 's' : ''}</p></div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div><p className="text-xs text-gray-400">Max Rental</p><p className="text-sm font-bold">{item.max_rental_days} days</p></div>
                    </div>
                    {item.deposit_cents > 0 && (
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                            <Shield className="h-4 w-4 text-gray-400" />
                            <div><p className="text-xs text-gray-400">Deposit</p><p className="text-sm font-bold">{formatCentsShort(item.deposit_cents)} (refundable)</p></div>
                        </div>
                    )}
                </div>
            </div>

            {/* Tags */}
            {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {item.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">{tag}</span>
                    ))}
                </div>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
                <div>
                    <h3 className="font-bold text-gray-900 mb-3">Reviews</h3>
                    <div className="space-y-4">
                        {reviews.map(r => (
                            <div key={r.id} className="p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex items-center gap-0.5">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <Star key={star} className={`h-3.5 w-3.5 ${star <= r.overall_rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                        ))}
                                    </div>
                                    <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
                                </div>
                                {r.body && <p className="text-sm text-gray-600">{r.body}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
