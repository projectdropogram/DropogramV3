"use client";

import { useState } from 'react';
import { Upload, X, MapPin, Crosshair, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { ToolCategory, ToolCondition, TOOL_CATEGORIES, TOOL_CONDITIONS } from './types';

interface ToolListingFormProps {
    onSuccess: () => void;
}

type Step = 'details' | 'photos' | 'pricing' | 'location' | 'review';

export function ToolListingForm({ onSuccess }: ToolListingFormProps) {
    const [step, setStep] = useState<Step>('details');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Details
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<ToolCategory>('other');
    const [condition, setCondition] = useState<ToolCondition>('good');
    const [brand, setBrand] = useState('');
    const [modelNumber, setModelNumber] = useState('');
    const [tags, setTags] = useState('');

    // Photos
    const [images, setImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);

    // Pricing
    const [dailyRate, setDailyRate] = useState('');
    const [deposit, setDeposit] = useState('');
    const [minDays, setMinDays] = useState(1);
    const [maxDays, setMaxDays] = useState(14);

    // Location
    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [locating, setLocating] = useState(false);

    const steps: Step[] = ['details', 'photos', 'pricing', 'location', 'review'];
    const stepIdx = steps.indexOf(step);

    const handleGeolocate = () => {
        if (!navigator.geolocation) return;
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLat(pos.coords.latitude);
                setLng(pos.coords.longitude);
                setLocating(false);
            },
            () => {
                setLocating(false);
                alert('Could not get location. Please enter coordinates manually.');
            },
            { timeout: 10000 }
        );
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setUploading(true);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setUploading(false); return; }

        const newImages: string[] = [];
        for (const file of Array.from(files)) {
            const ext = file.name.split('.').pop();
            const path = `${session.user.id}/${crypto.randomUUID()}.${ext}`;
            const { error } = await supabase.storage.from('tool-images').upload(path, file);
            if (!error) {
                const { data: urlData } = supabase.storage.from('tool-images').getPublicUrl(path);
                newImages.push(urlData.publicUrl);
            }
        }

        setImages(prev => [...prev, ...newImages].slice(0, 8));
        setUploading(false);
    };

    const removeImage = (idx: number) => {
        setImages(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');

        const { data, error: rpcError } = await supabase.rpc('create_tool_item', {
            p_title: title,
            p_description: description || null,
            p_category: category,
            p_brand: brand || null,
            p_model_number: modelNumber || null,
            p_condition: condition,
            p_daily_rate_cents: Math.round(parseFloat(dailyRate) * 100),
            p_deposit_cents: deposit ? Math.round(parseFloat(deposit) * 100) : 0,
            p_min_rental_days: minDays,
            p_max_rental_days: maxDays,
            p_lat: lat ?? 37.7749,
            p_long: lng ?? -122.4194,
            p_location_city: city || null,
            p_location_state: state || null,
            p_images: images,
            p_tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        });

        if (rpcError) {
            setError(rpcError.message);
            setLoading(false);
            return;
        }

        setLoading(false);
        onSuccess();
    };

    const canAdvance = () => {
        switch (step) {
            case 'details': return title.length >= 3 && category;
            case 'photos': return true; // photos optional
            case 'pricing': return dailyRate && parseFloat(dailyRate) > 0;
            case 'location': return true; // fallback to SF
            case 'review': return true;
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            {/* Progress bar */}
            <div className="flex items-center gap-2 mb-8">
                {steps.map((s, i) => (
                    <div key={s} className="flex items-center flex-1">
                        <div className={`h-2 flex-1 rounded-full transition-colors ${i <= stepIdx ? 'bg-primary' : 'bg-gray-200'}`} />
                    </div>
                ))}
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>
            )}

            {/* Step: Details */}
            {step === 'details' && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900">Tool Details</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. DeWalt 20V Max Cordless Drill"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)}
                            placeholder="Describe the tool, what's included, any special instructions..."
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                            <select value={category} onChange={e => setCategory(e.target.value as ToolCategory)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50">
                                {TOOL_CATEGORIES.map(c => (
                                    <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Condition *</label>
                            <select value={condition} onChange={e => setCondition(e.target.value as ToolCondition)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50">
                                {TOOL_CONDITIONS.map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                            <input type="text" value={brand} onChange={e => setBrand(e.target.value)}
                                placeholder="e.g. DeWalt" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                            <input type="text" value={modelNumber} onChange={e => setModelNumber(e.target.value)}
                                placeholder="e.g. DCD771C2" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                        <input type="text" value={tags} onChange={e => setTags(e.target.value)}
                            placeholder="e.g. cordless, drill, battery-powered"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50" />
                    </div>
                </div>
            )}

            {/* Step: Photos */}
            {step === 'photos' && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900">Photos</h2>
                    <p className="text-sm text-gray-500">Add up to 8 photos of your tool. First photo will be the thumbnail.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {images.map((url, i) => (
                            <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200">
                                <img src={url} alt={`Tool photo ${i + 1}`} className="w-full h-full object-cover" />
                                <button onClick={() => removeImage(i)}
                                    className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white hover:bg-red-600">
                                    <X className="h-3 w-3" />
                                </button>
                                {i === 0 && <span className="absolute bottom-1 left-1 text-xs bg-black/60 text-white px-2 py-0.5 rounded-full">Cover</span>}
                            </div>
                        ))}
                        {images.length < 8 && (
                            <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-gray-50 transition-colors">
                                <Upload className="h-6 w-6 text-gray-400 mb-1" />
                                <span className="text-xs text-gray-400">{uploading ? 'Uploading...' : 'Add Photo'}</span>
                                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploading} />
                            </label>
                        )}
                    </div>
                </div>
            )}

            {/* Step: Pricing */}
            {step === 'pricing' && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900">Pricing & Duration</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Daily Rate *</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                                <input type="number" step="0.01" min="0.01" value={dailyRate} onChange={e => setDailyRate(e.target.value)}
                                    placeholder="25.00" className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Security Deposit</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                                <input type="number" step="0.01" min="0" value={deposit} onChange={e => setDeposit(e.target.value)}
                                    placeholder="0.00" className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50" />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Min Rental (days)</label>
                            <input type="number" min={1} value={minDays} onChange={e => setMinDays(Number(e.target.value))}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Rental (days)</label>
                            <input type="number" min={minDays} value={maxDays} onChange={e => setMaxDays(Number(e.target.value))}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50" />
                        </div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-xl">
                        <p className="text-sm text-blue-700">
                            <strong>Platform fee:</strong> 15% of rental subtotal. You'll receive <strong>85%</strong> of each rental.
                        </p>
                    </div>
                </div>
            )}

            {/* Step: Location */}
            {step === 'location' && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900">Pickup Location</h2>
                    <p className="text-sm text-gray-500">Where should renters pick up this tool?</p>
                    <button onClick={handleGeolocate} disabled={locating}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-primary hover:bg-gray-50 transition-colors text-sm font-medium text-gray-600">
                        <Crosshair className={`h-4 w-4 ${locating ? 'animate-spin' : ''}`} />
                        {locating ? 'Getting location...' : lat ? 'Location detected ✓' : 'Use my current location'}
                    </button>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                            <input type="text" value={city} onChange={e => setCity(e.target.value)}
                                placeholder="San Francisco" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                            <input type="text" maxLength={2} value={state} onChange={e => setState(e.target.value.toUpperCase())}
                                placeholder="CA" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                            <input type="number" step="any" value={lat ?? ''} onChange={e => setLat(Number(e.target.value))}
                                placeholder="37.7749" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                            <input type="number" step="any" value={lng ?? ''} onChange={e => setLng(Number(e.target.value))}
                                placeholder="-122.4194" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50" />
                        </div>
                    </div>
                </div>
            )}

            {/* Step: Review */}
            {step === 'review' && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900">Review Your Listing</h2>
                    <div className="bg-gray-50 rounded-xl p-6 space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Title</span>
                            <span className="text-sm font-bold">{title}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Category</span>
                            <span className="text-sm font-bold">{TOOL_CATEGORIES.find(c => c.value === category)?.label}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Condition</span>
                            <span className="text-sm font-bold">{TOOL_CONDITIONS.find(c => c.value === condition)?.label}</span>
                        </div>
                        {brand && <div className="flex justify-between"><span className="text-sm text-gray-500">Brand</span><span className="text-sm font-bold">{brand}</span></div>}
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Daily Rate</span>
                            <span className="text-sm font-bold">${dailyRate}/day</span>
                        </div>
                        {deposit && parseFloat(deposit) > 0 && (
                            <div className="flex justify-between"><span className="text-sm text-gray-500">Deposit</span><span className="text-sm font-bold">${deposit}</span></div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Rental Duration</span>
                            <span className="text-sm font-bold">{minDays}–{maxDays} days</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Photos</span>
                            <span className="text-sm font-bold">{images.length} uploaded</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Location</span>
                            <span className="text-sm font-bold">{city || 'Auto-detected'}{state ? `, ${state}` : ''}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8">
                {stepIdx > 0 ? (
                    <button onClick={() => setStep(steps[stepIdx - 1])}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                        <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                ) : <div />}
                {step === 'review' ? (
                    <button onClick={handleSubmit} disabled={loading}
                        className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors shadow-sm active:scale-95 disabled:opacity-50">
                        {loading ? 'Publishing...' : <><Check className="h-4 w-4" /> Publish Listing</>}
                    </button>
                ) : (
                    <button onClick={() => setStep(steps[stepIdx + 1])} disabled={!canAdvance()}
                        className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors shadow-sm active:scale-95 disabled:opacity-50">
                        Next <ArrowRight className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
