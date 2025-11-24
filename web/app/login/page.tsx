"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import { NavBar } from "@/components/NavBar";
import { useRouter, useSearchParams } from "next/navigation";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

import { TermsModal } from "@/components/TermsModal";

function LoginContent() {
    const [email, setEmail] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);

    // New State for Sign Up Flow
    const [isSignUp, setIsSignUp] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showTerms, setShowTerms] = useState(false);

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

        if (isSignUp && !termsAccepted) {
            alert("Please accept the Terms and Conditions to sign up.");
            return;
        }

        setLoading(true);

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                data: {
                    // If signing up, we can add metadata here if needed
                    full_name: isSignUp ? email.split('@')[0] : undefined,
                }
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
            <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />

            <div className="flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <h2 className="mt-6 text-3xl font-extrabold text-secondary tracking-tight font-heading">
                            {isSignUp ? "Join Dropogram" : "Welcome Back"}
                        </h2>
                        <p className="mt-2 text-sm text-gray-600 font-body">
                            {isSignUp
                                ? "Start discovering homemade treasures today."
                                : "Access your profile, orders, and drops."}
                        </p>
                    </div>

                    {/* Toggle Switch */}
                    <div className="flex bg-gray-100 p-1 rounded-xl relative">
                        <div className={`w-1/2 h-full absolute top-0 bottom-0 rounded-lg bg-white shadow-sm transition-all duration-300 ease-in-out ${isSignUp ? 'left-1/2 ml-[-4px]' : 'left-0 ml-[4px]'} my-1`} style={{ width: 'calc(50% - 8px)' }}></div>
                        <button
                            onClick={() => { setIsSignUp(false); setOtpSent(false); }}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg relative z-10 transition-colors ${!isSignUp ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => { setIsSignUp(true); setOtpSent(false); }}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg relative z-10 transition-colors ${isSignUp ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {!otpSent ? (
                        <form className="mt-8 space-y-6" onSubmit={handleSendCode}>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 font-body">Email address</label>
                                <input
                                    type="email"
                                    required
                                    className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all sm:text-sm bg-gray-50"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            {isSignUp && (
                                <div className="flex items-start">
                                    <div className="flex items-center h-5">
                                        <input
                                            id="terms"
                                            name="terms"
                                            type="checkbox"
                                            required
                                            checked={termsAccepted}
                                            onChange={(e) => setTermsAccepted(e.target.checked)}
                                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
                                        />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label htmlFor="terms" className="font-medium text-gray-700">
                                            I agree to the{' '}
                                            <button
                                                type="button"
                                                onClick={() => setShowTerms(true)}
                                                className="text-primary hover:text-primary-hover font-bold underline decoration-2 underline-offset-2 cursor-pointer"
                                            >
                                                Terms and Conditions
                                            </button>
                                        </label>
                                    </div>
                                </div>
                            )}

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading || (isSignUp && !termsAccepted)}
                                    className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white transition-all shadow-md hover:shadow-lg active:scale-95 ${(isSignUp && !termsAccepted)
                                            ? 'bg-gray-300 cursor-not-allowed shadow-none'
                                            : 'bg-primary hover:bg-primary-hover'
                                        }`}
                                >
                                    {loading ? "Sending..." : (isSignUp ? "Create Account" : "Send Login Code")}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form className="mt-8 space-y-6" onSubmit={handleVerifyCode}>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 font-body">Enter Code</label>
                                <input
                                    type="text"
                                    required
                                    className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all sm:text-sm bg-gray-50 text-center tracking-widest text-2xl font-heading"
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
                                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all shadow-md hover:shadow-lg active:scale-95"
                                >
                                    {loading ? "Verifying..." : "Verify & Sign In"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setOtpSent(false)}
                                    className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-700 font-medium"
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
