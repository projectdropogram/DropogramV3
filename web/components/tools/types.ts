// ============================================================
// Tool Rental Types
// Completely isolated from Dropogram types.
// ============================================================

export type ToolCategory =
    | 'power_tools'
    | 'hand_tools'
    | 'garden'
    | 'construction'
    | 'automotive'
    | 'cleaning'
    | 'measuring'
    | 'ladders'
    | 'other';

export type ToolCondition = 'like_new' | 'good' | 'fair';

export type RentalStatus =
    | 'pending'
    | 'approved'
    | 'active'
    | 'completed'
    | 'cancelled'
    | 'disputed';

export type ReviewerRole = 'renter' | 'lender';

export const TOOL_CATEGORIES: { value: ToolCategory; label: string; icon: string }[] = [
    { value: 'power_tools', label: 'Power Tools', icon: '⚡' },
    { value: 'hand_tools', label: 'Hand Tools', icon: '🔧' },
    { value: 'garden', label: 'Garden', icon: '🌿' },
    { value: 'construction', label: 'Construction', icon: '🏗️' },
    { value: 'automotive', label: 'Automotive', icon: '🚗' },
    { value: 'cleaning', label: 'Cleaning', icon: '🧹' },
    { value: 'measuring', label: 'Measuring', icon: '📏' },
    { value: 'ladders', label: 'Ladders', icon: '🪜' },
    { value: 'other', label: 'Other', icon: '🔩' },
];

export const TOOL_CONDITIONS: { value: ToolCondition; label: string }[] = [
    { value: 'like_new', label: 'Like New' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
];

export interface ToolItem {
    id: string;
    lender_id: string;
    title: string;
    description: string | null;
    category: ToolCategory;
    brand: string | null;
    model_number: string | null;
    condition: ToolCondition;
    daily_rate_cents: number;
    deposit_cents: number;
    min_rental_days: number;
    max_rental_days: number;
    location_city: string | null;
    location_state: string | null;
    is_active: boolean;
    requires_id_check: boolean;
    images: string[];
    tags: string[];
    total_rentals: number;
    avg_rating: number | null;
    created_at: string;
    updated_at: string;
}

export interface ToolSearchResult {
    id: string;
    lender_id: string;
    title: string;
    description: string | null;
    category: ToolCategory;
    condition: ToolCondition;
    brand: string | null;
    daily_rate_cents: number;
    deposit_cents: number;
    avg_rating: number | null;
    total_rentals: number;
    images: string[];
    tags: string[];
    location_city: string | null;
    location_state: string | null;
    item_lat: number;
    item_lng: number;
    dist_meters: number;
    is_available: boolean;
}

export interface ToolRental {
    id: string;
    renter_id: string;
    lender_id: string;
    item_id: string;
    status: RentalStatus;
    start_at: string;
    end_at: string;
    daily_rate_cents: number;
    deposit_cents: number;
    subtotal_cents: number;
    platform_fee_cents: number;
    total_cents: number;
    lender_payout_cents: number;
    pickup_notes: string | null;
    return_notes: string | null;
    pre_rental_photos: string[];
    post_rental_photos: string[];
    cancellation_reason: string | null;
    cancelled_at: string | null;
    cancelled_by: string | null;
    dispute_reason: string | null;
    dispute_opened_at: string | null;
    dispute_resolved_at: string | null;
    dispute_resolution: string | null;
    created_at: string;
    updated_at: string;
    // Joined data
    tools_items?: ToolItem;
    profiles?: { full_name: string; avatar_url: string | null };
}

export interface ToolReview {
    id: string;
    rental_id: string;
    author_id: string;
    subject_id: string;
    item_id: string;
    reviewer_role: ReviewerRole;
    overall_rating: number;
    condition_rating: number | null;
    communication_rating: number | null;
    body: string | null;
    created_at: string;
}

export interface ToolMessage {
    id: string;
    rental_id: string;
    sender_id: string;
    body: string;
    read_at: string | null;
    created_at: string;
}

export interface LenderProfile {
    user_id: string;
    is_lender: boolean;
    lender_bio: string | null;
    response_rate: number | null;
    avg_response_hours: number | null;
    total_rentals_completed: number;
    is_verified_lender: boolean;
    payout_account_id: string | null;
}

export interface PricingQuote {
    total_days: number;
    daily_rate_cents: number;
    subtotal_cents: number;
    platform_fee_cents: number;
    lender_payout_cents: number;
    deposit_cents: number;
    total_cents: number;
    line_items: { label: string; amount_cents: number }[];
}

export function formatCents(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
}

export function formatCentsShort(cents: number): string {
    const dollars = cents / 100;
    return dollars % 1 === 0 ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

export function conditionLabel(c: ToolCondition): string {
    return TOOL_CONDITIONS.find(tc => tc.value === c)?.label ?? c;
}

export function categoryLabel(c: ToolCategory): string {
    return TOOL_CATEGORIES.find(tc => tc.value === c)?.label ?? c;
}

export function categoryIcon(c: ToolCategory): string {
    return TOOL_CATEGORIES.find(tc => tc.value === c)?.icon ?? '🔩';
}
