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

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        if (isSignUp) {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { role: 'producer' } // Mark as producer
                }
            });
            if (error) alert(error.message);
            else alert("Check your email for the confirmation link!");
        } else {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) alert(error.message);
        }
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
                        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
                            <div className="rounded-md shadow-sm -space-y-px">
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
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input
                                        type="password"
                                        required
                                        className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm bg-gray-50"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                                >
                                    {isSignUp ? "Create Account" : "Sign In"}
                                </button>
                            </div>
                        </form>
                        <div className="text-center">
                            <button
                                className="text-sm font-medium text-primary hover:text-primary-hover"
                                onClick={() => setIsSignUp(!isSignUp)}
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
