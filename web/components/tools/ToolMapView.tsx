"use client";

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ToolSearchResult, formatCentsShort } from './types';

interface ToolMapViewProps {
    items: ToolSearchResult[];
    center: [number, number];
    hoveredItemId: string | null;
    onPinClick: (id: string) => void;
}

function RecenterMap({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
}

/** Forces Leaflet to recalculate container size after mount / visibility change */
function InvalidateSize() {
    const map = useMap();
    useEffect(() => {
        const t = setTimeout(() => map.invalidateSize(), 200);
        return () => clearTimeout(t);
    }, [map]);
    return null;
}

/** Injects leaflet CSS into <head> if not already present (fallback for bundler issues) */
function useLeafletCSS() {
    useEffect(() => {
        const id = 'leaflet-css';
        if (document.getElementById(id)) return;
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);
    }, []);
}

function createPriceIcon(price: string, isHovered: boolean) {
    return L.divIcon({
        className: 'custom-price-pin',
        html: `<div style="
            background: ${isHovered ? 'var(--color-primary, #4f46e5)' : 'white'};
            color: ${isHovered ? 'white' : '#111'};
            padding: 4px 8px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            border: 2px solid ${isHovered ? 'var(--color-primary, #4f46e5)' : '#e5e7eb'};
            white-space: nowrap;
            transform: translate(-50%, -50%);
        ">${price}/d</div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
    });
}

// Dynamically imported in pages with { ssr: false }
function ToolMapViewInner({ items, center, hoveredItemId, onPinClick }: ToolMapViewProps) {
    useLeafletCSS();

    return (
        <div className="w-full rounded-2xl overflow-hidden shadow-md border border-gray-100" style={{ height: '100%', minHeight: '400px' }}>
            <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%', minHeight: '400px' }} scrollWheelZoom>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <RecenterMap center={center} />
                <InvalidateSize />
                {items.map(item => (
                    <Marker
                        key={item.id}
                        position={[item.item_lat, item.item_lng]}
                        icon={createPriceIcon(formatCentsShort(item.daily_rate_cents), hoveredItemId === item.id)}
                        eventHandlers={{
                            click: () => onPinClick(item.id),
                        }}
                    >
                        <Popup>
                            <div className="text-sm font-bold">{item.title}</div>
                            <div className="text-xs text-gray-500">{formatCentsShort(item.daily_rate_cents)}/day</div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}

export { ToolMapViewInner as ToolMapView };
export default ToolMapViewInner;
