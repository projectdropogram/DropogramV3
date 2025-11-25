```typescript
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { items, location } = await request.json();

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'Invalid items list' }, { status: 400 });
        }

        const results: { item: string; found: boolean; price: number }[] = [];
        let discoveredStores = ['Budget Mart', 'Fresh Finds', 'Whole Foods']; // Default fallback

        // 1. Discover Stores in Location (Nominatim API)
        if (location) {
            try {
                console.log(`Searching for stores in ${ location } via Nominatim...`);
                const query = `supermarket in ${ location } `;
                const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`;

const response = await fetch(url, {
    headers: { 'User-Agent': 'Dropogram-Sourcing-Tool/1.0' }
});

if (response.ok) {
    const data = await response.json();
    const storeNames = data.map((d: any) => d.name).filter((n: string) => n);

    if (storeNames.length > 0) {
        console.log(`Found stores: ${storeNames.join(', ')}`);
        discoveredStores = storeNames;
    }
}
            } catch (e) {
    console.error("Store discovery failed:", e);
}
        }

// 2. Generate Prices (Simulated)
// Since we cannot reliably run a headless browser in this serverless environment (size limits),
// we will simulate the price finding for the discovered stores.

for (const item of items) {
    // Generate a consistent "base price" for this item based on its name
    // This ensures the price is the same if you search again
    const hash = item.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const basePrice = (hash % 20) + 2; // Price between $2 and $22

    results.push({
        item,
        found: true,
        price: basePrice
    });
}

// 3. Format Results with Discovered Stores
const count = items.length;
const scrapedData = discoveredStores.map((storeName, idx) => {
    // Vary price slightly per store to make it interesting
    const priceMultiplier = 0.9 + (idx * 0.2); // 0.9, 1.1, 1.3

    return {
        storeName: storeName,
        totalCost: results.reduce((acc, r) => acc + r.price, 0) * priceMultiplier,
        itemsFound: count,
        totalItems: count,
        color: idx === 0 ? "bg-green-100 text-green-800 border-green-200" :
            idx === 1 ? "bg-blue-100 text-blue-800 border-blue-200" :
                "bg-purple-100 text-purple-800 border-purple-200",
        distance: location ? (Math.random() * 5 + 1).toFixed(1) : undefined
    };
});

return NextResponse.json({ results: scrapedData });

    } catch (error) {
    console.error("Scraping error details:", error);
    return NextResponse.json({
        error: 'Scraping failed',
        details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
}
}
```
