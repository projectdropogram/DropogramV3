"use client";

import { NavBar } from "@/components/NavBar";

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <NavBar />
            {children}
        </>
    );
}
