"use client";

import { useState } from "react";

const CATEGORIES = [
    { id: 'all', label: 'All', icon: '🍽️' },
    { id: 'vegan', label: 'Vegan', icon: '🥗' },
    { id: 'dessert', label: 'Dessert', icon: '🍰' },
    { id: 'spicy', label: 'Spicy', icon: '🌶️' },
    { id: 'drinks', label: 'Drinks', icon: '🥤' },
    { id: 'bakery', label: 'Bakery', icon: '🥐' },
    { id: 'asian', label: 'Asian', icon: '🍜' },
    { id: 'mexican', label: 'Mexican', icon: '🌮' },
    { id: 'italian', label: 'Italian', icon: '🍝' },
    { id: 'burgers', label: 'Burgers', icon: '🍔' },
];

export function CategoryBar({ onSelect }: { onSelect: (category: string | null) => void }) {
    const [active, setActive] = useState('all');

    const handleClick = (id: string) => {
        setActive(id);
        onSelect(id === 'all' ? null : id);
    };

    return (
        <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar">
            {CATEGORIES.map((cat) => (
                <button
                    key={cat.id}
                    onClick={() => handleClick(cat.id)}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all
                        ${active === cat.id
                            ? 'bg-black text-white shadow-md transform scale-105'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                    `}
                >
                    <span>{cat.icon}</span>
                    <span className="text-sm font-bold">{cat.label}</span>
                </button>
            ))}
        </div>
    );
}
