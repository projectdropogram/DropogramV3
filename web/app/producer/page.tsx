"use client";

import { ProducerForm } from "@/components/ProducerForm";
import { NavBar } from "@/components/NavBar";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ProducerPage() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);

    const [producerName, setProducerName] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState("");

    const ALLOWED_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'aol.com', 'protonmail.com'];

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const validateEmailDomain = (email: string) => {
        const domain = email.split('@')[1];
        if (!domain) return false;
        return ALLOWED_DOMAINS.includes(domain.toLowerCase());
    };

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!validateEmailDomain(email)) {
            alert("Please use a major email provider (Gmail, Yahoo, Outlook, etc.)");
            setLoading(false);
            return;
        }

        if (isSignUp && producerName.trim().length < 3) {
            alert("Producer Name must be at least 3 characters long.");
            setLoading(false);
            return;
        }

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: window.location.origin + '/producer',
                data: isSignUp ? {
                    role: 'producer',
                    full_name: producerName
                } : undefined
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
        }
        // Session update handled by onAuthStateChange
        setLoading(false);
    };

    if (loading) return <div className="p-10 text-center text-gray-500">Loading Drop Studio...</div>;

    if (!session) {
        return (
            <div className="min-h-screen bg-white">
                <NavBar />
                <div className="flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-md w-full space-y-8">
                        <div className="text-center">
                            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 tracking-tight">
                                {isSignUp ? "Join the Kitchen" : "Welcome Back"}
                            </h2>
                            <p className="mt-2 text-sm text-gray-600">
                                {isSignUp ? "Start selling your drops today." : "Sign in to manage your drops."}
                            </p>
                        </div>

                        {!otpSent ? (
                            <form className="mt-8 space-y-6" onSubmit={handleSendCode}>
                                <div className="rounded-md shadow-sm -space-y-px">
                                    {isSignUp && (
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Producer Name</label>
                                            <input
                                                type="text"
                                                required
                                                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm bg-gray-50"
                                                placeholder="e.g. Joe's Burgers"
                                                value={producerName}
                                                onChange={(e) => setProducerName(e.target.value)}
                                            />
                                        </div>
                                    )}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            required
                                            className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm bg-gray-50"
                                            placeholder="chef@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                                    >
                                        Send Login Code
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form className="mt-8 space-y-6" onSubmit={handleVerifyCode}>
                                <div className="rounded-md shadow-sm -space-y-px">
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Enter Code</label>
                                        <input
                                            type="text"
                                            required
                                            className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm bg-gray-50 text-center tracking-widest text-2xl"
                                            placeholder="123456"
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value)}
                                            maxLength={6}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                                    >
                                        Verify & Sign In
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

                        <div className="text-center">
                            <button
                                className="text-sm font-medium text-primary hover:text-primary-hover"
                                onClick={() => {
                                    setIsSignUp(!isSignUp);
                                    setOtpSent(false);
                                }}
                            >
                                {isSignUp
                                    ? "Already have an account? Sign in"
                                    : "New here? Create a Producer account"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <NavBar />
            <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
                        Drop Studio
                    </h1>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                        <span>Logged in as {session.user.email}</span>
                        <span>•</span>
                        <button
                            onClick={() => supabase.auth.signOut()}
                            className="text-primary font-medium hover:underline"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl card-shadow p-8 border border-gray-100">
                    <ProducerForm />
                </div>
            </div>
        </div>
    );
}
