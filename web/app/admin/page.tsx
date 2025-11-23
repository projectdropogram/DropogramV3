"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { AdminDashboard } from "@/components/AdminDashboard";
import { NavBar } from "@/components/NavBar";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminPage() {
    const [authorized, setAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkAdmin();
    }, []);

    const checkAdmin = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            router.replace("/login");
            return;
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', session.user.id)
            .single();

        if (profile?.is_admin) {
            setAuthorized(true);
        } else {
            router.replace("/"); // Kick non-admins out
        }
        setLoading(false);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Verifying Access...</div>;
    if (!authorized) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <NavBar />
            <AdminDashboard />
        </div>
    );
}
