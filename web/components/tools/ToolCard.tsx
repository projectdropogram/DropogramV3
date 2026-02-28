"use client";

import Link from 'next/link';
import { useState } from 'react';
import { Heart, Star, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { ToolSearchResult, formatCentsShort, conditionLabel, categoryIcon } from './types';

interface ToolCardProps {
    item: ToolSearchResult;
    startDate?: string;
    endDate?: string;
}

export function ToolCard({ item, startDate, endDate }: ToolCardProps) {
    const [imgIdx, setImgIdx] = useState(0);
    const [isFav, setIsFav] = useState(false);

    const fallback = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' fill='none'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Cpath d='M185 130h30v60h-30z' fill='%239ca3af'/%3E%3Ccircle cx='200' cy='120' r='18' stroke='%239ca3af' stroke-width='6' fill='none'/%3E%3Ctext x='200' y='220' text-anchor='middle' fill='%239ca3af' font-size='14'%3ENo image%3C/text%3E%3C/svg%3E";
    const images = item.images.length > 0 ? item.images : [fallback];
    const href = `/tools/item/${item.id}${startDate && endDate ? `?start=${startDate}&end=${endDate}` : ''}`;

    return (
        <div className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100">
            {/* Image carousel */}
            <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                <Link href={href}>
                    <img
                        src={images[imgIdx]}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                </Link>

                {/* Carousel arrows */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={(e) => { e.preventDefault(); setImgIdx(i => (i - 1 + images.length) % images.length); }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-white"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={(e) => { e.preventDefault(); setImgIdx(i => (i + 1) % images.length); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-white"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                            {images.map((_, i) => (
                                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imgIdx ? 'bg-white' : 'bg-white/50'}`} />
                            ))}
                        </div>
                    </>
                )}

                {/* Favorite */}
                <button
                    onClick={(e) => { e.preventDefault(); setIsFav(!isFav); }}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors shadow-sm"
                >
                    <Heart className={`h-4 w-4 ${isFav ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                </button>

                {/* Category badge */}
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold bg-white/90 backdrop-blur-sm shadow-sm">
                    {categoryIcon(item.category)} {conditionLabel(item.condition)}
                </span>

                {/* Availability */}
                {!item.is_available && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white font-bold text-sm bg-black/60 px-4 py-2 rounded-full">Unavailable for selected dates</span>
                    </div>
                )}
            </div>

            {/* Info */}
            <Link href={href}>
                <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{item.title}</h3>
                        {item.avg_rating && (
                            <div className="flex items-center gap-1 shrink-0">
                                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs font-bold text-gray-900">{item.avg_rating.toFixed(1)}</span>
                                <span className="text-xs text-gray-400">({item.total_rentals})</span>
                            </div>
                        )}
                    </div>
                    {item.brand && (
                        <p className="text-xs text-gray-500 mt-0.5">{item.brand}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1 text-gray-400">
                        <MapPin className="h-3 w-3" />
                        <span className="text-xs">
                            {item.location_city}{item.location_state ? `, ${item.location_state}` : ''}
                            {item.dist_meters < 1609 ? ` · ${Math.round(item.dist_meters)}m` : ` · ${(item.dist_meters / 1609).toFixed(1)}mi`}
                        </span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-50">
                        <span className="font-bold text-gray-900">{formatCentsShort(item.daily_rate_cents)}</span>
                        <span className="text-xs text-gray-500"> / day</span>
                        {item.deposit_cents > 0 && (
                            <span className="text-xs text-gray-400 ml-2">+ {formatCentsShort(item.deposit_cents)} deposit</span>
                        )}
                    </div>
                </div>
            </Link>
        </div>
    );
}
