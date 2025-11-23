"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import { NavBar } from "@/components/NavBar";
import { useRouter, useSearchParams } from "next/navigation";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function LoginContent() {
    const [email, setEmail] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get("redirect") || "/consumer";

    // Check if already logged in
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) router.replace(redirectTo);
        };
        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) router.replace(redirectTo);
        });

        return () => subscription.unsubscribe();
    }, [router, redirectTo]);

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                // emailRedirectTo: window.location.origin + redirectTo, 
                // Removed to force OTP Code flow instead of Magic Link
            }
        });

        if (error) {
            alert(error.message);
        } else {
            setOtpSent(true);
            alert("Check your email for the login code!");
        }
        setLoading(false);
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.auth.verifyOtp({
            email,
            token: otpCode,
            type: 'email',
        });

        if (error) {
            alert(error.message);
            setLoading(false);
        } else {
            // Login successful, redirect handled by router or useEffect
            router.replace(redirectTo);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <NavBar />
            <div className="flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <h2 className="mt-6 text-3xl font-extrabold text-gray-900 tracking-tight">
                            Sign in to Dropogram
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Access your profile, orders, and drops.
                        </p>
                    </div>

                    {!otpSent ? (
                        <form className="mt-8 space-y-6" onSubmit={handleSendCode}>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                                <input
                                    type="email"
                                    required
                                    className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm bg-gray-50"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                                >
                                    {loading ? "Sending..." : "Send Login Code"}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form className="mt-8 space-y-6" onSubmit={handleVerifyCode}>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Enter Code</label>
                                <input
                                    type="text"
                                    required
                                    className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm bg-gray-50 text-center tracking-widest text-2xl"
                                    placeholder="12345678"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value)}
                                    maxLength={8}
                                />
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                                >
                                    {loading ? "Verifying..." : "Verify & Sign In"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setOtpSent(false)}
                                    className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-700"
                                >
                                    Use a different email
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>}>
            <LoginContent />
        </Suspense>
    );
}
