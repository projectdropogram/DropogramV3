# 🧪 Tool Rental — Manual Test Script

> **Pre-requisite:** You must run the 3 SQL migrations in the Supabase Dashboard SQL Editor  
> **before** any of these tests will work. Run them in order:
>
> 1. `20240522000016_tool_rental_flags.sql`
> 2. `20240522000017_tool_rental_schema.sql`
> 3. `20240522000018_enforce_blocked_users.sql`
>
> Then enable the feature flag:
> ```sql
> UPDATE app_settings SET tools_enabled = true WHERE id = 'global';
> ```
>
> **Note:** Realtime is not required. All live-updating features use polling instead  
> (chat polls every 3s, dashboards every 10s, settings every 30s).

---

## 0 — Start the Dev Server

```bash
cd web && npm run dev
```

Open **http://localhost:3000**

---

## 1 — Feature Flag Gating

| # | Step | Expected Result | ✅/❌ |
|---|------|----------------|-------|
| 1.1 | Visit `/tools` | Tools landing page loads with hero, categories, how-it-works | |
| 1.2 | Check NavBar | Should show **Lend** and **Rent** tabs (with wrench/package icons) alongside **Drop Studio** and **Shop** | |
| 1.3 | Click **Shop** tab | Navigates to `/consumer` — Dropogram feed loads | |
| 1.4 | Click **Rent** tab | Navigates back to `/tools/search` | |
| 1.5 | Click the logo | Navigates to `/consumer` (since Dropogram is enabled) | |
| 1.6 | In Supabase SQL Editor run: `UPDATE app_settings SET tools_enabled = false WHERE id = 'global';` | | |
| 1.7 | Refresh `/tools` | Should redirect to `/` → `/consumer` | |
| 1.8 | Check NavBar | **Lend** and **Rent** tabs should disappear | |
| 1.9 | Re-enable: `UPDATE app_settings SET tools_enabled = true WHERE id = 'global';` | | |
| 1.10 | Refresh `/tools` | Tools landing loads again | |

---

## 2 — Landing Page (`/tools`)

| # | Step | Expected Result | ✅/❌ |
|---|------|----------------|-------|
| 2.1 | Check hero section | "Rent tools from people nearby" heading, "Browse Tools" and "List Your Tools" buttons visible | |
| 2.2 | Check categories grid | 9 category cards with icons (Power Tools 🔌, Hand Tools 🔨, Garden 🌱, etc.) | |
| 2.3 | Click a category card (e.g. "Power Tools") | Navigates to `/tools/search?category=power_tools` | |
| 2.4 | Check "How It Works" section | 3 cards: Find a Tool, Book & Pick Up, Use & Return | |
| 2.5 | "Recently Listed" section | Empty for now (no tools listed yet) — this is normal | |

---

## 3 — Authentication

| # | Step | Expected Result | ✅/❌ |
|---|------|----------------|-------|
| 3.1 | Click **Lend** tab (or "List Your Tools") | Should redirect to `/login` (you're not signed in) | |
| 3.2 | Enter your email address | Receives a magic code / OTP | |
| 3.3 | Enter the code | Logs in, redirects to the dashboard page | |
| 3.4 | Check NavBar | Profile avatar/initial appears, **Orders** link visible | |

---

## 4 — List a Tool (Lender Flow)

| # | Step | Expected Result | ✅/❌ |
|---|------|----------------|-------|
| 4.1 | Go to `/tools/dashboard` | Lender Dashboard page loads, "List a Tool" button in top-right | |
| 4.2 | Click **"+ List a Tool"** | Form expands with Step 1: Details | |
| 4.3 | Fill in: Title = "DeWalt Cordless Drill", Category = Power Tools, Condition = Like New, Description = "Great drill, barely used" | Fields accept input | |
| 4.4 | Click **Next →** | Advances to Step 2: Photos | |
| 4.5 | Upload 1-2 photos (optional, can skip) | Photos appear as thumbnails with X to remove | |
| 4.6 | Click **Next →** | Advances to Step 3: Pricing | |
| 4.7 | Set Daily Rate = 15, Deposit = 50, Min days = 1, Max days = 7 | Fields accept numeric input | |
| 4.8 | Click **Next →** | Advances to Step 4: Location | |
| 4.9 | Click "Use my location" OR manually enter city/state | Lat/lng populate (or keep default SF) | |
| 4.10 | Click **Next →** | Advances to Step 5: Review | |
| 4.11 | Verify all details shown are correct | Title, category, condition, rate, location all displayed | |
| 4.12 | Click **Submit Listing** | Loading spinner, then form closes. No errors in console | |
| 4.13 | Verify in Supabase: go to Table Editor → `tools_items` | New row exists with your details | |

> **Repeat 4.2–4.12** to create a 2nd listing (e.g. "Makita Circular Saw", category = Power Tools, rate = $25/day)  
> This gives you items to search for in the next section.

---

## 5 — Search & Browse (`/tools/search`)

| # | Step | Expected Result | ✅/❌ |
|---|------|----------------|-------|
| 5.1 | Click **Rent** tab or go to `/tools/search` | Search page loads with search bar, filter bar, and results area | |
| 5.2 | Check that your listed tool(s) appear | ToolCards visible with title, price, category badge | |
| 5.3 | Type "drill" in search text box, click Search | Only the drill listing appears (or "No tools found" if text search doesn't match) | |
| 5.4 | Clear search, click a category filter pill (e.g. "Power Tools") | Results filter to power tools only | |
| 5.5 | Click **Map** toggle (top-right) | View switches to map + side list layout | |
| 5.6 | Verify pins appear on map | Pins show price labels (e.g. "$15") | |
| 5.7 | Click a pin on the map | Popup shows tool title and price | |
| 5.8 | Click **List** toggle | Switches back to grid view | |
| 5.9 | Hover over a card | Card gets hover shadow | |
| 5.10 | Click a ToolCard | Navigates to `/tools/item/[id]` | |

---

## 6 — Tool Detail Page (`/tools/item/[id]`)

| # | Step | Expected Result | ✅/❌ |
|---|------|----------------|-------|
| 6.1 | Verify tool detail loads | Image gallery (or placeholder), title, category badge, condition badge | |
| 6.2 | Check lender info card | Shows your name (from profiles.full_name) and avatar | |
| 6.3 | Check description and specs | Description text, daily rate, deposit, min/max days displayed | |
| 6.4 | Check availability calendar below detail | Monthly calendar visible with green/red date indicators | |
| 6.5 | Click next/prev month arrows on calendar | Calendar navigates months | |
| 6.6 | Check booking sidebar (right column on desktop) | Date pickers for start/end date, pickup notes textarea, "Request Rental" button | |

---

## 7 — Booking Flow (Requires 2nd Account)

> **Important:** You can't rent your own tool. Open an **incognito window** and sign in  
> with a **different email** to act as the renter.

| # | Step | Expected Result | ✅/❌ |
|---|------|----------------|-------|
| 7.1 | In incognito: go to `/tools/search` | Same search page, your listed tools visible | |
| 7.2 | Click on the drill listing | Detail page loads | |
| 7.3 | In booking sidebar: set Start = tomorrow, End = 3 days from now | Dates populate | |
| 7.4 | Wait 1-2 seconds | Pricing quote loads: subtotal, platform fee (15%), deposit, total | |
| 7.5 | Verify math: daily rate × 3 days = subtotal, fee = 15% of subtotal, total = subtotal + fee + deposit | Numbers are correct | |
| 7.6 | Optionally add pickup notes | Text accepted | |
| 7.7 | Click **"Request Rental"** | Loading, then navigates to `/tools/checkout?rental_id=...` | |
| 7.8 | Checkout page shows | Green checkmark, "Rental Requested!", tool name, dates, total, "Pending" badge | |
| 7.9 | Click **"View My Rentals"** | Navigates to `/tools/rentals` | |
| 7.10 | Verify rental appears | Active Rentals section shows the drill with "Pending" status badge | |

---

## 8 — Lender Approval (Back to Original Account)

| # | Step | Expected Result | ✅/❌ |
|---|------|----------------|-------|
| 8.1 | In original window: go to `/tools/dashboard` | Pending Requests column shows the new rental request | |
| 8.2 | Verify rental card shows | Tool thumbnail, renter info, dates, total, pickup notes | |
| 8.3 | Click **✓ Approve** on the rental | Card moves from Pending → Active Rentals column | |
| 8.4 | Back in incognito (`/tools/rentals`) | Status should update to "Approved" within ~10 seconds (polling) | |

---

## 9 — Messaging (`/tools/messages/[rental_id]`)

| # | Step | Expected Result | ✅/❌ |
|---|------|----------------|-------|
| 9.1 | In incognito (renter): on `/tools/rentals`, click the message icon 💬 on the rental | Navigates to `/tools/messages/[rental_id]` | |
| 9.2 | Chat page loads | "Rental Chat" header, empty state "No messages yet" | |
| 9.3 | Type "Hi, when can I pick up?" and press Enter | Message appears as a blue bubble on the right | |
| 9.4 | In original window (lender): navigate to the same `/tools/messages/[rental_id]` URL | Chat loads with the renter's message on the left (gray bubble) | |
| 9.5 | Type "Tomorrow at 5pm works!" and press Enter | Message appears. Renter's window should show it within ~3 seconds (polling) | |
| 9.6 | Verify read receipts | Sender sees "Read" label under sent messages | |

---

## 10 — Rental Lifecycle

| # | Step | Expected Result | ✅/❌ |
|---|------|----------------|-------|
| 10.1 | As lender on `/tools/dashboard`: click **"Mark as Picked Up"** on the approved rental | Status changes to "Active" | |
| 10.2 | In renter's `/tools/rentals` | Shows "Active", with "X days remaining" countdown | |
| 10.3 | As lender: click **"Mark as Returned"** | Status changes to "Completed", card moves to Completed column | |
| 10.4 | In renter's `/tools/rentals` | Rental moves to "Past Rentals" section | |

---

## 11 — Reviews

| # | Step | Expected Result | ✅/❌ |
|---|------|----------------|-------|
| 11.1 | As renter on `/tools/rentals`: completed rental shows ⭐ **Review** button | Button visible on the completed rental | |
| 11.2 | Click **Review** | Modal opens: Overall Experience, Tool Condition, Communication (5 stars each) + Comments | |
| 11.3 | Select 5 stars for each, add comment "Great tool, lender was friendly!" | Stars highlight in yellow | |
| 11.4 | Click **Submit Review** | Modal closes | |
| 11.5 | Click **Review** again | Button should be gone (already reviewed) | |
| 11.6 | Visit the tool detail page (`/tools/item/[id]`) | Review appears at the bottom with stars and comment | |

---

## 12 — Cancellation

| # | Step | Expected Result | ✅/❌ |
|---|------|----------------|-------|
| 12.1 | Create another rental (repeat step 7) for the 2nd tool listing | New pending rental created | |
| 12.2 | As renter on `/tools/rentals`: click the ❌ icon on the pending rental | Rental status changes to "Cancelled" | |
| 12.3 | Verify in lender's dashboard | Rental disappears from Pending (or shows cancelled) | |
| 12.4 | Verify availability: the dates should be free again on the tool's calendar | Green dates restored | |

---

## 13 — Edge Cases

| # | Step | Expected Result | ✅/❌ |
|---|------|----------------|-------|
| 13.1 | As renter: try to book the same tool for the same dates (already booked) | Should get an error / overlapping dates prevented | |
| 13.2 | Try booking with end date before start date | "Request Rental" should stay disabled or show no quote | |
| 13.3 | Visit `/tools/messages/[random-uuid]` as a user not involved | Should redirect to `/tools/rentals` | |
| 13.4 | Sign out, visit `/tools/dashboard` | Should redirect to `/login` | |
| 13.5 | Sign out, visit `/tools/rentals` | Should redirect to `/login` | |
| 13.6 | Visit `/tools/search` while signed out | Should work fine (browse is public) | |
| 13.7 | Visit `/tools/item/[valid-id]` while signed out | Detail page loads, booking sidebar shows "Sign in to book" (or redirect on click) | |

---

## 14 — Mobile Responsive

| # | Step | Expected Result | ✅/❌ |
|---|------|----------------|-------|
| 14.1 | Open Chrome DevTools → toggle device toolbar (phone size) | | |
| 14.2 | Visit `/tools` | Hero stacks vertically, categories in 3-column grid | |
| 14.3 | Open hamburger menu (☰) | Mobile menu shows Lend Tools / Rent Tools tabs | |
| 14.4 | Visit `/tools/search` | Cards in 2-column grid, search bar usable | |
| 14.5 | Visit `/tools/item/[id]` | Detail and sidebar stack vertically | |
| 14.6 | Visit `/tools/dashboard` | Kanban columns stack vertically | |

---

## 15 — Dual-Mode Navigation

| # | Step | Expected Result | ✅/❌ |
|---|------|----------------|-------|
| 15.1 | From any tools page, click **Shop** | Goes to `/consumer`, Dropogram feed loads | |
| 15.2 | From consumer page, click **Lend** | Goes to `/tools/dashboard` | |
| 15.3 | From consumer page, click **Rent** | Goes to `/tools/search` | |
| 15.4 | Click **Drop Studio** | Goes to `/producer` | |
| 15.5 | **Orders** link in desktop nav | Goes to `/orders` (Dropogram orders) | |
| 15.6 | Mobile menu: **My Rentals** link | Goes to `/tools/rentals` | |

---

## Quick SQL Helpers

Run these in the Supabase SQL Editor if you need to inspect or reset data:

```sql
-- See all listed tools
SELECT id, title, category, daily_rate_cents, status FROM tools_items;

-- See all rentals
SELECT id, item_id, renter_id, status, start_at, end_at, total_cents FROM tools_rentals;

-- See all reviews
SELECT id, item_id, overall_rating, body FROM tools_reviews;

-- See all messages
SELECT id, rental_id, sender_id, body, read_at FROM tools_messages ORDER BY created_at;

-- See feature flags
SELECT tools_enabled, dropogram_enabled FROM app_settings WHERE id = 'global';

-- Reset: delete all tool data (keeps schema)
DELETE FROM tools_messages;
DELETE FROM tools_reviews;
DELETE FROM tools_availability_blocks;
DELETE FROM tools_rentals;
DELETE FROM tools_items;
DELETE FROM tools_lender_profiles;
```

---

**Total test cases: 65**  
Estimated time: **30–45 minutes** with two browser windows (one normal, one incognito).
