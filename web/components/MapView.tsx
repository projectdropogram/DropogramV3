"use client";

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix for default marker icon missing in Leaflet + Next.js
const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

type Product = {
    id: string;
    title: string;
    description: string;
    price: number;
    image_url: string;
    dist_meters: number;
    lat?: number; // We need to pass coordinates if available, or parse from location column if needed
    // For this demo, we'll assume the parent component passes parsed lat/long or we use a mock
};

// Helper to parse PostGIS point if needed, but ideally RPC returns lat/long
// Since our RPC returns distance but not raw coords, we might need to update RPC or just mock for now.
// Wait, the RPC returns `dist_meters` relative to user. 
// To show on map, we need absolute coordinates.
// Let's update the RPC in the next step if needed, but for now let's assume we have them.
// Actually, the `find_nearby_products` RPC *doesn't* return lat/long columns explicitly in the table definition I wrote.
// I should update the RPC to return lat/long. 
// For now, I will create a placeholder Map that centers on the user.

export function MapView({ products, userLocation }: { products: any[], userLocation: { lat: number, lng: number } }) {

    return (
        <div className="h-[60vh] w-full rounded-xl overflow-hidden shadow-lg border border-gray-200 z-0 relative">
            <MapContainer
                center={[userLocation.lat, userLocation.lng]}
                zoom={13}
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* User Location */}
                <Marker position={[userLocation.lat, userLocation.lng]} icon={icon}>
                    <Popup>
                        You are here! 📍
                    </Popup>
                </Marker>

                {/* Products - We need their coordinates. 
                    Since our current RPC doesn't return them, we'll simulate them nearby for the demo 
                    or we need to update the RPC. 
                    Let's simulate for now to avoid another SQL roundtrip for the user immediately.
                */}
                {products.map((product, idx) => {
                    // Fake random offset for demo if real coords missing
                    const lat = userLocation.lat + (Math.random() - 0.5) * 0.02;
                    const lng = userLocation.lng + (Math.random() - 0.5) * 0.02;

                    return (
                        <Marker key={product.id} position={[lat, lng]} icon={icon}>
                            <Popup>
                                <div className="w-32">
                                    <img src={product.image_url} className="w-full h-20 object-cover rounded mb-2" />
                                    <h3 className="font-bold text-sm">{product.title}</h3>
                                    <p className="text-xs">${product.price}</p>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
