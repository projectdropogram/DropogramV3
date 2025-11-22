"use client";

import { ConsumerFeed } from "@/components/ConsumerFeed";
import { NavBar } from "@/components/NavBar";

export default function FeedPage() {
    return (
        <div className="min-h-screen bg-white">
            <NavBar />

            <main>
                <ConsumerFeed />
            </main>
        </div>
    );
}
