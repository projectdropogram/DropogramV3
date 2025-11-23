"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Shield, Ban, CheckCircle, DollarSign, Users } from "lucide-react";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Profile = {
    id: string;
    full_name: string;
    role: string;
    is_blocked: boolean;
    is_admin: boolean;
};

export function AdminDashboard() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [realPaymentsEnabled, setRealPaymentsEnabled] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        // Fetch Settings
        const { data: settings } = await supabase.from('app_settings').select('*').eq('id', 'global').single();
        if (settings) {
            setRealPaymentsEnabled(settings.enable_real_payments);
        }

        // Fetch Profiles
        const { data: users } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (users) {
            setProfiles(users as any);
        }
        setLoading(false);
    };

    const togglePaymentMode = async () => {
        const newValue = !realPaymentsEnabled;
        const { error } = await supabase
            .from('app_settings')
            .update({ enable_real_payments: newValue })
            .eq('id', 'global');

        if (error) {
            alert("Failed to update settings: " + error.message);
        } else {
            setRealPaymentsEnabled(newValue);
        }
    };

    const toggleBlockUser = async (userId: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('profiles')
            .update({ is_blocked: !currentStatus })
            .eq('id', userId);

        if (error) {
            alert("Failed to update user: " + error.message);
        } else {
            setProfiles(profiles.map(p => p.id === userId ? { ...p, is_blocked: !currentStatus } : p));
        }
    };

    if (loading) return <div className="p-8 text-center">Loading Admin Panel...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary" />
                Admin Dashboard
            </h1>

            {/* Global Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Monetization Settings
                </h2>
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                    <div>
                        <h3 className="font-bold text-gray-900">Real Payments (Stripe)</h3>
                        <p className="text-sm text-gray-500">
                            {realPaymentsEnabled
                                ? "Active: Users will be charged real money via Stripe."
                                : "Simulated: Payments are mocked for testing (Instant Success)."}
                        </p>
                    </div>
                    <button
                        onClick={togglePaymentMode}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${realPaymentsEnabled ? 'bg-green-500' : 'bg-gray-200'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${realPaymentsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>

            {/* User Management */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        User Management
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-3">User</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {profiles.map((profile) => (
                                <tr key={profile.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{profile.full_name || 'No Name'}</div>
                                        <div className="text-xs text-gray-400 font-mono">{profile.id}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {profile.role}
                                        </span>
                                        {profile.is_admin && (
                                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                Admin
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {profile.is_blocked ? (
                                            <span className="text-red-500 flex items-center gap-1 text-sm font-bold">
                                                <Ban className="h-4 w-4" /> Blocked
                                            </span>
                                        ) : (
                                            <span className="text-green-500 flex items-center gap-1 text-sm font-bold">
                                                <CheckCircle className="h-4 w-4" /> Active
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {!profile.is_admin && (
                                            <button
                                                onClick={() => toggleBlockUser(profile.id, profile.is_blocked)}
                                                className={`text-sm font-bold px-3 py-1 rounded-lg transition-colors ${profile.is_blocked
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                    }`}
                                            >
                                                {profile.is_blocked ? "Unblock" : "Block"}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
