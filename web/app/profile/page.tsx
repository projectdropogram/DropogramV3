"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { NavBar } from "@/components/NavBar";
import { useRouter } from "next/navigation";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [session, setSession] = useState<any>(null);
    const [fullName, setFullName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [role, setRole] = useState("");
    const router = useRouter();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                router.replace("/login");
            } else {
                setSession(session);
                fetchProfile(session.user.id);
            }
        });
    }, [router]);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('full_name, avatar_url, role')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (data) {
                setFullName(data.full_name || "");
                setAvatarUrl(data.avatar_url);
                setRole(data.role || "consumer");
            }
        } catch (error: any) {
            alert('Error loading user data: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async () => {
        try {
            setLoading(true);
            const { error } = await supabase.from('profiles').upsert({
                id: session.user.id,
                full_name: fullName,
                updated_at: new Date().toISOString(),
            });

            if (error) throw error;
            alert('Profile updated!');
        } catch (error: any) {
            alert('Error updating the data: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setAvatarUrl(publicUrl);

            // Update Profile immediately
            const { error: updateError } = await supabase.from('profiles').upsert({
                id: session.user.id,
                avatar_url: publicUrl,
                updated_at: new Date().toISOString(),
            });

            if (updateError) throw updateError;

        } catch (error: any) {
            alert('Error uploading avatar: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.replace("/login");
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-white">
            <NavBar />
            <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-extrabold text-gray-900">Your Profile</h1>
                    <p className="mt-2 text-sm text-gray-500">Manage your identity on Dropogram.</p>
                </div>

                <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="relative h-32 w-32 rounded-full bg-gray-100 overflow-hidden border-4 border-white shadow-lg mb-4 group">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-gray-400 text-4xl font-bold">
                                    {session?.user?.email?.[0].toUpperCase()}
                                </div>
                            )}

                            {/* Overlay for upload */}
                            <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <span className="text-white text-sm font-bold">Change</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={uploadAvatar}
                                    disabled={uploading}
                                />
                            </label>
                        </div>
                        <div className="text-sm text-gray-500">
                            {uploading ? "Uploading..." : "Click image to change"}
                        </div>
                    </div>

                    {/* Form Section */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="text"
                                disabled
                                className="block w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-500"
                                value={session?.user?.email}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-primary focus:border-primary"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Your Name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <div className="px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 capitalize">
                                {role}
                            </div>
                        </div>

                        <div className="pt-4 flex gap-4">
                            <button
                                onClick={updateProfile}
                                disabled={loading}
                                className="flex-1 bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary-hover transition-colors"
                            >
                                Save Changes
                            </button>
                            <button
                                onClick={handleSignOut}
                                className="flex-1 bg-white text-gray-700 font-bold py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
